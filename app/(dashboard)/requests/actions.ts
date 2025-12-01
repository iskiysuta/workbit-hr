"use server";

import { prisma } from "@/lib/prisma";

export async function updateLeaveStatus(
  id: number,
  action: "approve" | "reject"
) {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
  });

  if (!leaveRequest || leaveRequest.status !== "PENDING") {
    return;
  }

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.schedule.upsert({
        where: {
          employeeId_date: {
            employeeId: leaveRequest.employeeId,
            date: leaveRequest.date,
          },
        },
        create: {
          employeeId: leaveRequest.employeeId,
          date: leaveRequest.date,
          shiftId: leaveRequest.shiftId,
        },
        update: {
          shiftId: leaveRequest.shiftId,
        },
      });

      await tx.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    });
  } else {
    await prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
      },
    });
  }
}

export async function updateSwapStatus(
  id: number,
  action: "approve" | "reject"
) {
  const swap = await prisma.shiftSwapRequest.findUnique({
    where: { id },
  });

  if (!swap || swap.status !== "PENDING") {
    return;
  }

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      const schedules = await tx.schedule.findMany({
        where: {
          employeeId: { in: [swap.requesterId, swap.targetId] },
          date: swap.date,
        },
      });

      const requesterSchedule = schedules.find(
        (s) => s.employeeId === swap.requesterId
      );
      const targetSchedule = schedules.find(
        (s) => s.employeeId === swap.targetId
      );

      if (!requesterSchedule || !targetSchedule) {
        await tx.shiftSwapRequest.update({
          where: { id: swap.id },
          data: {
            status: "REJECTED",
            approvedAt: new Date(),
          },
        });
        return;
      }

      await tx.schedule.update({
        where: { id: requesterSchedule.id },
        data: { shiftId: targetSchedule.shiftId },
      });
      await tx.schedule.update({
        where: { id: targetSchedule.id },
        data: { shiftId: requesterSchedule.shiftId },
      });

      await tx.shiftSwapRequest.update({
        where: { id: swap.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    });
  } else {
    await prisma.shiftSwapRequest.update({
      where: { id: swap.id },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
      },
    });
  }
}
