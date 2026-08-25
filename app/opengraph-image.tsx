import {
  createSocialPreviewImageResponse,
  socialPreviewAlt,
  socialPreviewContentType,
  socialPreviewSize,
} from "@/shared/seo/social-preview-image";

export const runtime = "nodejs";
export const alt = socialPreviewAlt;
export const size = socialPreviewSize;
export const contentType = socialPreviewContentType;

export default async function Image() {
  return createSocialPreviewImageResponse();
}
