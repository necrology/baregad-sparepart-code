import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";
import { applyToastSearchParams } from "@/shared/lib/toast";
import { redirectAfterPost } from "@/shared/lib/http-redirect";

function buildRedirectUrl(request: Request, slug: string) {
  const trimmedSlug = slug.trim();
  const pathname = trimmedSlug ? `/produk/${encodeURIComponent(trimmedSlug)}` : "/katalog";

  return new URL(pathname, request.url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "");
  const redirectUrl = buildRedirectUrl(request, slug);

  try {
    await backendFetchJson(`/catalog/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: String(formData.get("customerName") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        rating: Number(formData.get("rating") ?? 0),
        comment: String(formData.get("comment") ?? ""),
      }),
    });

    return redirectAfterPost(
      applyToastSearchParams(redirectUrl, {
        message: "Review berhasil dikirim dan akan tampil setelah moderasi admin.",
        tone: "success",
      }),
    );
  } catch (error) {
    const message =
      error instanceof BackendRequestError ? error.message : "Gagal mengirim review produk.";

    return redirectAfterPost(
      applyToastSearchParams(redirectUrl, {
        message,
        tone: "error",
      }),
    );
  }
}


