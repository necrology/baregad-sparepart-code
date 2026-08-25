import {
  GET as ProductReviewsGet,
  POST as ProductReviewsPost,
} from "@/app/api/product-reviews/[slug]/route";

export const runtime = "nodejs";
export const GET = ProductReviewsGet;
export const POST = ProductReviewsPost;
