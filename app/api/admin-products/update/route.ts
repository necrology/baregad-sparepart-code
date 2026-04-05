import {
  BackendRequestError,
  backendFetchJson,
} from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import {
  buildProductPayload,
  deleteManagedProductImage,
  resolveProductImagePath,
  saveUploadedProductImage,
} from "@/shared/lib/admin-product-form";
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
  let uploadedImagePath: string | null = null;

  try {
    uploadedImagePath = await saveUploadedProductImage(formData);
    const imageState = resolveProductImagePath(formData, uploadedImagePath);

    await backendFetchJson(`/admin/products/${id}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildProductPayload(formData, imageState.imagePath)),
    });

    if (imageState.shouldDeletePreviousImage) {
      await deleteManagedProductImage(imageState.existingImagePath);
    }

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, { edit: undefined }),
        {
          message: "Perubahan produk berhasil disimpan.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    if (uploadedImagePath) {
      await deleteManagedProductImage(uploadedImagePath);
    }

    const message =
      error instanceof BackendRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gagal memperbarui produk.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


