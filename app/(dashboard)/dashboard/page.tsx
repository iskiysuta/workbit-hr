import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const startOfActiveWindow = new Date(now);
  startOfActiveWindow.setDate(startOfActiveWindow.getDate() - 30);

  const [totalEmployees, activeEmployees, workingSchedulesToday, presentSchedulesToday, offDaySchedulesToday] =
    await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({
        where: {
          schedules: {
            some: {
              date: {
                gte: startOfActiveWindow,
                lt: endOfToday,
              },
            },
          },
        },
      }),
      prisma.schedule.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday,
          },
          shift: {
            isDayOff: false,
          },
        },
      }),
      prisma.schedule.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday,
          },
          shift: {
            isDayOff: false,
          },
          attendance: {
            NOT: {
              timeIn: null,
            },
          },
        },
      }),
      prisma.schedule.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday,
          },
          shift: {
            isDayOff: true,
          },
        },
      }),
    ]);

  const attendanceRate =
    workingSchedulesToday > 0
      ? Math.round((presentSchedulesToday / workingSchedulesToday) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ringkasan aktivitas dan data HR.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Total Karyawan</p>
          <p className="mt-2 text-2xl font-semibold">{totalEmployees}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Karyawan Aktif (30 hari)</p>
          <p className="mt-2 text-2xl font-semibold">{activeEmployees}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Cuti / Off Hari Ini</p>
          <p className="mt-2 text-2xl font-semibold">{offDaySchedulesToday}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Kehadiran Hari Ini</p>
          <p className="mt-2 text-2xl font-semibold">{attendanceRate}%</p>
        </div>
      </div>
    </div>
  );
}
