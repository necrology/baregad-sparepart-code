import {
  BackendRequestError,
  backendFetchJson,
} from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { deleteManagedAppAsset } from "@/shared/lib/admin-app-asset-form";
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
    "/admin/parameter-aplikasi",
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
  const value = String(formData.get("value") ?? "");

  try {
    await backendFetchJson(`/admin/app-parameters/${id}`, {
      method: "DELETE",
      headers,
    });

    await deleteManagedAppAsset(value);

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, {
          edit: undefined,
        }),
        {
          message: "Parameter aplikasi berhasil dihapus.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError
        ? error.message
        : "Gagal menghapus parameter aplikasi.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


