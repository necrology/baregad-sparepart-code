import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";
import { ADMIN_AUTH_COOKIE, type AdminLoginResult } from "@/shared/auth/admin-auth";
import { applyToastSearchParams } from "@/shared/lib/toast";
import { redirectAfterPost } from "@/shared/lib/http-redirect";

function resolveNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/admin";
  }

  return value.startsWith("/admin") ? value : "/admin";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const usernameValue = formData.get("username");
  const passwordValue = formData.get("password");
  const username = typeof usernameValue === "string" ? usernameValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const nextPath = resolveNextPath(formData.get("next"));
  const secureCookie = new URL(request.url).protocol === "https:";

  try {
    const session = await backendFetchJson<AdminLoginResult>("/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const response = redirectAfterPost(new URL(nextPath, request.url));

    response.cookies.set({
      name: ADMIN_AUTH_COOKIE,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
      path: "/",
      maxAge: session.expiresInSeconds,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof BackendRequestError && [400, 401].includes(error.status)
        ? "Username atau password salah. Periksa kembali lalu coba lagi."
        : "Layanan login sedang bermasalah. Coba lagi beberapa saat.";
    const redirectUrl = applyToastSearchParams(
      new URL("/admin-login", request.url),
      {
        message,
        tone: "error",
      },
    );

    return redirectAfterPost(redirectUrl);
  }
}


