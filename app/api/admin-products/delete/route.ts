import {
  BackendRequestError,
  backendFetchJson,
} from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { deleteManagedProductImage } from "@/shared/lib/admin-product-form";
import { buildSafeAdminRedirectUrl } from "@/shared/lib/admin-redirect";
import { applyToastSearchParams } from "@/shared/lib/toast";
import { redirectAfterPost } from "@/shared/lib/http-redirect";

export const runtime = "nodejs";

function buildRedirectUrl(
  request: Request,
  formData: FormData,
  patch: Record<string, string | undefined>,
) {
  return buildSafeAdminRedirectUrl(
    request,
    "/admin/produk",
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
        buildRedirectUrl(request, formData, { edit: undefined }),
        {
          message: "Sesi login tidak ditemukan.",
          tone: "error",
        },
      ),
    );
  }

  const id = String(formData.get("id") ?? "");
  const imagePath = String(formData.get("imagePath") ?? "");

  try {
    await backendFetchJson(`/admin/products/${id}`, {
      method: "DELETE",
      headers,
    });

    await deleteManagedProductImage(imagePath);

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, { edit: undefined }),
        {
          message: "Produk berhasil dihapus.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError
        ? error.message
        : "Gagal menghapus produk.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


