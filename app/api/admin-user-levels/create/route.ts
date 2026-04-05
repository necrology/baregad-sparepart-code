import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { buildSafeAdminRedirectUrl } from "@/shared/lib/admin-redirect";
import { applyToastSearchParams } from "@/shared/lib/toast";
import { redirectAfterPost } from "@/shared/lib/http-redirect";

function buildRedirectUrl(
  request: Request,
  formData: FormData,
  patch: Record<string, string | undefined>,
) {
  return buildSafeAdminRedirectUrl(
    request,
    "/admin/level-user",
    formData.get("redirectTo"),
    patch,
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const headers = await getAdminAuthorizationHeaders();

  if (!headers) {
    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, {
          edit: undefined,
        }),
        {
          message: "Sesi login tidak ditemukan.",
          tone: "error",
        },
      ),
    );
  }

  try {
    await backendFetchJson("/admin/user-levels", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: String(formData.get("status") ?? "active"),
      }),
    });

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, {
          edit: undefined,
        }),
        {
          message: "Level user berhasil dibuat.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError ? error.message : "Gagal membuat level user.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


