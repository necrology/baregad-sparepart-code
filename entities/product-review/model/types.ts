export type ProductReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export type ProductReviewAdminReply = {
  accountId: string;
  username: string;
  displayName: string;
  message: string;
  repliedAt: string;
};

export type ProductReviewPhoto = {
  url: string;
  fileName: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
};

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
  adminReply?: ProductReviewAdminReply;
  photo?: ProductReviewPhoto;
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
};
