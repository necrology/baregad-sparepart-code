import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const managedAppAssetPrefix = "/uploads/app-assets/";
const managedAppAssetDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "app-assets",
);
const maxAppAssetSizeInBytes = 5 * 1024 * 1024;

const assetMimeExtensionMap = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
]);

const assetExtensions = [...new Set(assetMimeExtensionMap.values())];

export function isManagedAppAssetPath(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return !!trimmedValue && trimmedValue.startsWith(managedAppAssetPrefix);
}

export function isImageOrIconValue(value: string | null | undefined) {
  const trimmedValue = value?.trim().toLowerCase();
  if (!trimmedValue) {
    return false;
  }

  return (
    isManagedAppAssetPath(trimmedValue) ||
    /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/.test(trimmedValue)
  );
}

function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function resolveUploadedAssetExtension(file: File) {
  const mimeExtension = assetMimeExtensionMap.get(file.type);
  if (mimeExtension) {
    return mimeExtension;
  }

  const fileName = file.name.trim().toLowerCase();
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  if (extension && assetExtensions.includes(extension)) {
    return extension;
  }

  return "";
}

export async function saveUploadedAppAsset(formData: FormData) {
  const assetEntry = formData.get("assetFile");
  if (!(assetEntry instanceof File) || assetEntry.size === 0) {
    return null;
  }

  if (assetEntry.size > maxAppAssetSizeInBytes) {
    throw new Error("Ukuran file gambar/icon maksimal 5 MB.");
  }

  const extension = resolveUploadedAssetExtension(assetEntry);
  if (!extension) {
    throw new Error("Format file harus JPG, PNG, WEBP, GIF, SVG, atau ICO.");
  }

  await mkdir(managedAppAssetDirectory, { recursive: true });

  const fileName = `asset-${randomUUID()}.${extension}`;
  const filePath = path.join(managedAppAssetDirectory, fileName);
  const arrayBuffer = await assetEntry.arrayBuffer();

  await writeFile(filePath, Buffer.from(arrayBuffer));

  return `${managedAppAssetPrefix}${fileName}`;
}

export async function deleteManagedAppAsset(value: string | null | undefined) {
  if (!isManagedAppAssetPath(value)) {
    return;
  }

  const fileName = path.basename(String(value).trim());
  const targetPath = path.join(managedAppAssetDirectory, fileName);

  await unlink(targetPath).catch(() => undefined);
}

export function resolveAppParameterValue(
  formData: FormData,
  uploadedAssetPath: string | null,
) {
  const existingValue = readFormValue(formData, "existingValue");
  const manualValue = readFormValue(formData, "value");
  const removeAsset = formData.get("removeAsset") === "on";

  const resolvedValue = uploadedAssetPath
    ? uploadedAssetPath
    : removeAsset
      ? manualValue
      : manualValue;

  return {
    value: resolvedValue,
    existingValue,
    shouldDeletePreviousAsset:
      isManagedAppAssetPath(existingValue) && existingValue !== resolvedValue,
  };
}
