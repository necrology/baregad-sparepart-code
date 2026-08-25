import type {
  ProductReview,
  ProductReviewAdminReply,
  ProductReviewPhoto,
  ProductReviewStatus,
} from "@/entities/product-review/model/types";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function resolveOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function resolveString(value: unknown, fallback = "") {
  return resolveOptionalString(value) ?? fallback;
}

function resolveNumber(value: unknown, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function resolveBackendAssetUrl(value: string) {
  if (!value.startsWith("/api/uploads/") && !value.startsWith("/uploads/")) {
    return value;
  }

  const backendBaseUrl =
    getPublicBackendBaseUrl() || normalizeBaseUrl(process.env.BACKEND_API_BASE_URL);

  if (!backendBaseUrl) {
    return value;
  }

  try {
    return new URL(value, `${new URL(backendBaseUrl).origin}/`).toString();
  } catch {
    return value;
  }
}

function normalizeProductReviewStatus(value: unknown): ProductReviewStatus {
  switch (value) {
    case "approved":
    case "rejected":
    case "hidden":
      return value;
    case "pending":
    default:
      return "pending";
  }
}

function normalizeProductReviewAdminReply(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const message = resolveOptionalString(value.message);

  if (!message) {
    return undefined;
  }

  const reply: ProductReviewAdminReply = {
    accountId: resolveString(value.accountId ?? value.account_id),
    username: resolveString(value.username),
    displayName: resolveString(value.displayName ?? value.display_name),
    message,
    repliedAt: resolveString(
      value.repliedAt ?? value.replied_at ?? value.updatedAt ?? value.updated_at,
      new Date().toISOString(),
    ),
  };

  return reply;
}

function inferFileName(value: string) {
  const trimmedValue = value.split("?")[0] ?? value;
  const segments = trimmedValue.split("/");
  return segments.at(-1) || "review-photo";
}

function normalizeProductReviewPhoto(value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return undefined;
    }

    return {
      url: resolveBackendAssetUrl(trimmedValue),
      fileName: inferFileName(trimmedValue),
    } satisfies ProductReviewPhoto;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const url = resolveOptionalString(
    value.url ??
      value.photoUrl ??
      value.photo_url ??
      value.imageUrl ??
      value.image_url ??
      value.image ??
      value.path,
  );

  if (!url) {
    return undefined;
  }

  const size = resolveNumber(value.size, -1);

  return {
    url: resolveBackendAssetUrl(url),
    fileName:
      resolveOptionalString(value.fileName ?? value.file_name ?? value.originalName) ??
      inferFileName(url),
    contentType: resolveOptionalString(value.contentType ?? value.content_type ?? value.mimeType),
    size: size >= 0 ? size : undefined,
    uploadedAt: resolveOptionalString(value.uploadedAt ?? value.uploaded_at ?? value.createdAt),
  } satisfies ProductReviewPhoto;
}

export function normalizeProductReview(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const id = resolveOptionalString(value.id);
  const customerName = resolveOptionalString(value.customerName ?? value.customer_name);
  const comment = resolveOptionalString(value.comment);
  const createdAt = resolveOptionalString(value.createdAt ?? value.created_at);
  const updatedAt = resolveOptionalString(value.updatedAt ?? value.updated_at);
  const rating = resolveNumber(value.rating, Number.NaN);

  if (
    !id ||
    !customerName ||
    !comment ||
    !createdAt ||
    !updatedAt ||
    !Number.isFinite(rating)
  ) {
    return null;
  }

  const review: ProductReview = {
    id,
    productId: resolveString(value.productId ?? value.product_id),
    productSlug: resolveString(value.productSlug ?? value.product_slug),
    productName: resolveString(value.productName ?? value.product_name),
    productImage: resolveOptionalString(value.productImage ?? value.product_image)
      ? resolveBackendAssetUrl(
          resolveString(value.productImage ?? value.product_image),
        )
      : undefined,
    customerName,
    customerEmail: resolveOptionalString(value.customerEmail ?? value.customer_email),
    rating,
    comment,
    status: normalizeProductReviewStatus(value.status),
    adminNote: resolveOptionalString(value.adminNote ?? value.admin_note),
    adminReply: normalizeProductReviewAdminReply(value.adminReply ?? value.admin_reply),
    photo: normalizeProductReviewPhoto(
      value.photo ??
        value.reviewPhoto ??
        value.review_photo ??
        value.reviewImage ??
        value.review_image ??
        value.image ??
        value.imageUrl ??
        value.image_url,
    ),
    createdAt,
    updatedAt,
    moderatedAt: resolveOptionalString(value.moderatedAt ?? value.moderated_at),
  };

  return review;
}

export function normalizeProductReviews(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ProductReview[];
  }

  return value
    .map((entry) => normalizeProductReview(entry))
    .filter((entry): entry is ProductReview => !!entry);
}

export function withProductReviewPhoto(
  review: ProductReview,
  photo: ProductReviewPhoto | null | undefined,
) {
  if (!photo) {
    return review;
  }

  return {
    ...review,
    photo,
  } satisfies ProductReview;
}
