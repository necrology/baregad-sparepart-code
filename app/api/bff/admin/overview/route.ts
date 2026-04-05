import { NextResponse } from "next/server";
import { getAdminOverview } from "@/shared/api/admin-overview-service";
import { getAdminSession } from "@/shared/auth/admin-auth";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}

