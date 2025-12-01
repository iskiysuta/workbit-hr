import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout berhasil" });
  res.cookies.set("hr_admin_auth", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
