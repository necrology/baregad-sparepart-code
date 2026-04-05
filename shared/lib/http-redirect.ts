import { NextResponse } from "next/server";

export function redirectAfterPost(url: string | URL) {
  return NextResponse.redirect(url, { status: 303 });
}
