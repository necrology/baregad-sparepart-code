import { readStoredReviewPhotoFile } from "@/shared/server/review-photo-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  const storedPhoto = await readStoredReviewPhotoFile(reviewId);

  if (!storedPhoto) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(storedPhoto.fileBuffer, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(storedPhoto.size),
      "Content-Type": storedPhoto.contentType,
    },
  });
}
