-- CreateTable
CREATE TABLE "AttendanceLocationSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLocationSetting_pkey" PRIMARY KEY ("id")
);
