export const productReviewImageAccept = "image/jpeg,image/png,image/webp";
export const productReviewMaxImageSizeBytes = 5 * 1024 * 1024;

const supportedProductReviewImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function formatProductReviewMaxImageSize() {
  return "5 MB";
}

export function isSupportedProductReviewImageType(value: string) {
  return supportedProductReviewImageTypes.has(value.trim().toLowerCase());
}

export function validateProductReviewImageFile(
  file: Pick<File, "size" | "type"> | null | undefined,
) {
  if (!file || file.size <= 0) {
    return null;
  }

  if (!isSupportedProductReviewImageType(file.type)) {
    return "Foto ulasan harus berupa JPG, PNG, atau WebP.";
  }

  if (file.size > productReviewMaxImageSizeBytes) {
    return `Ukuran foto ulasan maksimal ${formatProductReviewMaxImageSize()}.`;
  }

  return null;
}
