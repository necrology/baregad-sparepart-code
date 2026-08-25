import { normalizeProductReviews } from "@/entities/product-review/model/normalize-product-review";
import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";

export const runtime = "nodejs";

function readBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization")?.trim();

  if (!authorizationHeader) {
    return "";
  }

  if (/^Bearer\s+/i.test(authorizationHeader)) {
    return authorizationHeader.replace(/^Bearer\s+/i, "").trim();
  }

  return authorizationHeader;
}

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

export async function GET(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    return Response.json(
      {
        success: false,
        message: "Sesi login tidak ditemukan.",
      },
      { status: 401 },
    );
  }

  try {
    const response = await backendFetchJson<unknown>("/admin/product-reviews", {
      token,
      trackActivity: false,
    });
    return Response.json({
      data: normalizeProductReviews(response),
    });
  } catch (error) {
    return toErrorResponse(error, "Daftar ulasan admin belum bisa dimuat.");
  }
}
