function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function isManagedAppAssetPath(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return !!trimmedValue && (
    trimmedValue.startsWith("/api/uploads/app-assets/") ||
    trimmedValue.startsWith("/uploads/app-assets/")
  );
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

export function resolveAppParameterValue(formData: FormData) {
  const existingValue = readFormValue(formData, "existingValue");
  const manualValue = readFormValue(formData, "value");

  return {
    value: manualValue,
    existingValue,
    shouldDeletePreviousAsset:
      isManagedAppAssetPath(existingValue) && existingValue !== manualValue,
  };
}
