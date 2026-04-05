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
    "/admin/ulasan",
    formData.get("redirectTo"),
    patch,
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const headers = await getAdminAuthorizationHeaders();

  if (!headers) {
    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message: "Sesi login tidak ditemukan.",
        tone: "error",
      }),
    );
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await backendFetchJson(`/admin/product-reviews/${id}/moderate`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        adminNote: String(formData.get("adminNote") ?? ""),
      }),
    });

    const toastMessage =
      status === "approved"
        ? "Review produk berhasil ditayangkan."
        : status === "hidden"
          ? "Review produk berhasil disembunyikan."
          : status === "rejected"
            ? "Review produk berhasil ditolak."
            : "Status review produk berhasil diperbarui.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message: toastMessage,
        tone: "success",
      }),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError
        ? error.message
        : "Gagal memperbarui status review produk.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


