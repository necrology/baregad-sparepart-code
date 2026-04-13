import { backendFetchJson } from "@/shared/api/backend-client";

export type AdminUploadKind = "image" | "file";
export type AdminUploadScope = "product-images" | "app-assets" | "attachments";

export type UploadedAdminAsset = {
  path: string;
  url: string;
  originalName: string;
  fileName: string;
  contentType: string;
  size: number;
  scope: AdminUploadScope;
  kind: AdminUploadKind;
};

type UploadAdminAssetParams = {
  token: string;
  file: File;
  scope: AdminUploadScope;
  kind: AdminUploadKind;
};

export async function uploadAdminAsset({
  token,
  file,
  scope,
  kind,
}: UploadAdminAssetParams) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("scope", scope);
  formData.set("kind", kind);

  return backendFetchJson<UploadedAdminAsset>("/admin/uploads", {
    method: "POST",
    token,
    formData,
  });
}

export async function deleteAdminAsset(
  token: string,
  assetPath: string | null | undefined,
) {
  const trimmedPath = assetPath?.trim();

  if (!trimmedPath) {
    return;
  }

  await backendFetchJson("/admin/uploads", {
    method: "DELETE",
    token,
    json: {
      path: trimmedPath,
    },
  });
}
