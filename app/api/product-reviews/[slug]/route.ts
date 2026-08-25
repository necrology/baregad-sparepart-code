import {
  normalizeProductReview,
  normalizeProductReviews,
} from "@/entities/product-review/model/normalize-product-review";
import { validateProductReviewImageFile } from "@/entities/product-review/model/review-photo";
import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";

export const runtime = "nodejs";

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof BackendRequestError) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status },
    );
  }

  return Response.json(
    {
      success: false,
      message:
        error instanceof Error && error.message.trim()
          ? error.message
          : fallbackMessage,
    },
    { status: 500 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const trimmedSlug = slug.trim();

  if (!trimmedSlug) {
    return Response.json({ data: [] });
  }

  try {
    const response = await backendFetchJson<unknown>(
      `/catalog/products/${encodeURIComponent(trimmedSlug)}/reviews`,
      {
        trackActivity: false,
      },
    );
    return Response.json({ data: normalizeProductReviews(response) });
  } catch (error) {
    return toErrorResponse(error, "Ulasan produk belum bisa dimuat.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const trimmedSlug = slug.trim();

  if (!trimmedSlug) {
    return Response.json(
      {
        success: false,
        message: "Produk tujuan ulasan belum dipilih.",
      },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const imageEntry = formData.get("image");
  const imageFile = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;
  const imageValidationMessage = validateProductReviewImageFile(imageFile);

  if (imageValidationMessage) {
    return Response.json(
      {
        success: false,
        message: imageValidationMessage,
      },
      { status: 400 },
    );
  }

  try {
    const backendFormData = new FormData();
    backendFormData.set("customerName", String(formData.get("customerName") ?? ""));
    backendFormData.set("customerEmail", String(formData.get("customerEmail") ?? ""));
    backendFormData.set("rating", String(formData.get("rating") ?? 0));
    backendFormData.set("comment", String(formData.get("comment") ?? ""));

    if (imageFile) {
      backendFormData.set("image", imageFile);
    }

    const response = await backendFetchJson<unknown>(
      `/catalog/products/${encodeURIComponent(trimmedSlug)}/reviews`,
      {
        method: "POST",
        trackActivity: false,
        formData: backendFormData,
      },
    );
    const createdReview = normalizeProductReview(response);

    if (!createdReview) {
      throw new Error("Respons ulasan dari backend tidak valid.");
    }

    return Response.json(
      {
        success: true,
        message: "Review produk berhasil dikirim dan menunggu moderasi admin.",
        data: createdReview,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "Ulasan belum bisa dikirim.");
  }
}
