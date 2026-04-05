import {
  BackendRequestError,
  backendFetchJson,
} from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import {
  deleteManagedAppAsset,
  resolveAppParameterValue,
  saveUploadedAppAsset,
} from "@/shared/lib/admin-app-asset-form";
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

  let uploadedAssetPath: string | null = null;

  try {
    uploadedAssetPath = await saveUploadedAppAsset(formData);
    const { value } = resolveAppParameterValue(formData, uploadedAssetPath);

    await backendFetchJson("/admin/app-parameters", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: String(formData.get("label") ?? ""),
        key: String(formData.get("key") ?? ""),
        groupName: String(formData.get("groupName") ?? ""),
        value,
        description: String(formData.get("description") ?? ""),
        isPublic: formData.get("isPublic") === "on",
        status: String(formData.get("status") ?? "active"),
      }),
    });

    return redirectAfterPost(
      applyToastSearchParams(
        buildRedirectUrl(request, formData, {
          edit: undefined,
        }),
        {
          message: "Parameter aplikasi berhasil dibuat.",
          tone: "success",
        },
      ),
    );
  } catch (error) {
    if (uploadedAssetPath) {
      await deleteManagedAppAsset(uploadedAssetPath);
    }

    const message =
      error instanceof BackendRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gagal membuat parameter aplikasi.";

    return redirectAfterPost(
      applyToastSearchParams(buildRedirectUrl(request, formData, {}), {
        message,
        tone: "error",
      }),
    );
  }
}


