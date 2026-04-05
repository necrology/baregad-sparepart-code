export type ProductReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export type ProductReview = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  comment: string;
  status: ProductReviewStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
};
