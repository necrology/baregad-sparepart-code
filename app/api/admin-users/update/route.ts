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
    "/admin/pengguna",
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
  const id = String(formData.get("id") ?? "");

  try {
    await backendFetchJson(`/admin/users/${id}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? ""),
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        levelId: String(formData.get("levelId") ?? ""),
        password: String(formData.get("password") ?? ""),
        status: String(formData.get("status") ?? "active"),
        isWhatsAppAdmin: formData.get("isWhatsAppAdmin") === "true",
      }),
    });

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, {
          edit: undefined,
        }),
        {
          message: "Perubahan user berhasil disimpan.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError ? error.message : "Gagal memperbarui user.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


