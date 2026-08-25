import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductReviewPhoto } from "@/entities/product-review/model/types";
import {
  productReviewMaxImageSizeBytes,
  validateProductReviewImageFile,
} from "@/entities/product-review/model/review-photo";

type StoredReviewPhotoRecord = {
  reviewId: string;
  filePath: string;
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

type StoredReviewPhotoIndex = Record<string, StoredReviewPhotoRecord>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getReviewPhotoStorageRoot() {
  const configuredStoragePath = process.env.REVIEW_MEDIA_STORAGE_DIR?.trim();

  if (configuredStoragePath) {
    return path.resolve(configuredStoragePath);
  }

  return path.resolve(process.cwd(), ".review-media");
}

function getReviewPhotoFilesDirectory() {
  return path.join(getReviewPhotoStorageRoot(), "files");
}

function getReviewPhotoIndexFilePath() {
  return path.join(getReviewPhotoStorageRoot(), "index.json");
}

async function ensureReviewPhotoStorage() {
  await mkdir(getReviewPhotoFilesDirectory(), { recursive: true });
}

async function readReviewPhotoIndex() {
  try {
    const rawValue = await readFile(getReviewPhotoIndexFilePath(), "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsedValue)) {
      return {} as StoredReviewPhotoIndex;
    }

    return Object.fromEntries(
      Object.entries(parsedValue).filter((entry): entry is [string, StoredReviewPhotoRecord] => {
        const record = entry[1];
        return (
          isRecord(record) &&
          typeof record.reviewId === "string" &&
          typeof record.filePath === "string" &&
          typeof record.fileName === "string" &&
          typeof record.originalName === "string" &&
          typeof record.contentType === "string" &&
          typeof record.size === "number" &&
          typeof record.uploadedAt === "string"
        );
      }),
    );
  } catch {
    return {} as StoredReviewPhotoIndex;
  }
}

async function writeReviewPhotoIndex(index: StoredReviewPhotoIndex) {
  await ensureReviewPhotoStorage();
  await writeFile(
    getReviewPhotoIndexFilePath(),
    JSON.stringify(index, null, 2),
    "utf8",
  );
}

function resolveFileExtension(file: File) {
  const normalizedExtension = path.extname(file.name || "").trim().toLowerCase();

  if (normalizedExtension) {
    return normalizedExtension;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
    default:
      return ".jpg";
  }
}

function toReviewPhoto(record: StoredReviewPhotoRecord) {
  return {
    url: `/review-api/review-photos/${encodeURIComponent(record.reviewId)}?v=${encodeURIComponent(record.uploadedAt)}`,
    fileName: record.originalName || record.fileName,
    contentType: record.contentType,
    size: record.size,
    uploadedAt: record.uploadedAt,
  } satisfies ProductReviewPhoto;
}

async function readStoredReviewPhotoRecord(reviewId: string) {
  const index = await readReviewPhotoIndex();
  const record = index[reviewId];

  if (!record) {
    return null;
  }

  try {
    await stat(record.filePath);
    return record;
  } catch {
    delete index[reviewId];
    await writeReviewPhotoIndex(index);
    return null;
  }
}

export async function getStoredReviewPhoto(reviewId: string) {
  const record = await readStoredReviewPhotoRecord(reviewId);
  return record ? toReviewPhoto(record) : undefined;
}

export async function saveStoredReviewPhoto(reviewId: string, file: File) {
  const validationMessage = validateProductReviewImageFile(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  if (file.size > productReviewMaxImageSizeBytes) {
    throw new Error("Ukuran foto ulasan melebihi batas yang diizinkan.");
  }

  await ensureReviewPhotoStorage();

  const previousRecord = await readStoredReviewPhotoRecord(reviewId);
  const fileName = `${reviewId}-${randomUUID()}${resolveFileExtension(file)}`;
  const filePath = path.join(getReviewPhotoFilesDirectory(), fileName);

  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const nextRecord: StoredReviewPhotoRecord = {
    reviewId,
    filePath,
    fileName,
    originalName: file.name || fileName,
    contentType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
  const index = await readReviewPhotoIndex();
  index[reviewId] = nextRecord;
  await writeReviewPhotoIndex(index);

  if (previousRecord && previousRecord.filePath !== filePath) {
    await unlink(previousRecord.filePath).catch(() => undefined);
  }

  return toReviewPhoto(nextRecord);
}

export async function readStoredReviewPhotoFile(reviewId: string) {
  const record = await readStoredReviewPhotoRecord(reviewId);

  if (!record) {
    return null;
  }

  try {
    const fileBuffer = await readFile(record.filePath);

    return {
      photo: toReviewPhoto(record),
      contentType: record.contentType,
      size: record.size,
      fileBuffer,
    };
  } catch {
    return null;
  }
}

export async function deleteStoredReviewPhoto(reviewId: string) {
  const index = await readReviewPhotoIndex();
  const record = index[reviewId];

  if (!record) {
    return;
  }

  delete index[reviewId];
  await writeReviewPhotoIndex(index);
  await unlink(record.filePath).catch(() => undefined);
}
