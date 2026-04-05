import { ADMIN_AUTH_COOKIE } from "@/shared/auth/admin-auth";
import { applyToastSearchParams } from "@/shared/lib/toast";
import { redirectAfterPost } from "@/shared/lib/http-redirect";

export async function POST(request: Request) {
  const redirectUrl = applyToastSearchParams(new URL("/admin-login", request.url), {
    message: "Sesi login berhasil diakhiri.",
    tone: "success",
  });
  const response = redirectAfterPost(redirectUrl);

  response.cookies.delete(ADMIN_AUTH_COOKIE);

  return response;
}


