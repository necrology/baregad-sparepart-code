import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductSpecification } from "@/entities/product/model/types";

const managedProductImagePrefix = "/uploads/products/";
const managedProductImageDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products",
);
const maxProductImageSizeInBytes = 5 * 1024 * 1024;

const mimeExtensionMap = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

type ProductPayload = {
  name: string;
  slug: string;
  sku: string;
  image: string;
  brand: string;
  category: string;
  vehicle: string;
  motorCodes: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  compatibility: string[];
  specifications: ProductSpecification[];
  tags: string[];
  badges: string[];
  leadTime: string;
  location: string;
  soldCount: number;
  accentFrom: string;
  accentTo: string;
  accentGlow: string;
};

function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseNumberValue(formData: FormData, key: string, fallback = 0) {
  const rawValue = readFormValue(formData, key);
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumberValue(formData: FormData, key: string) {
  const rawValue = readFormValue(formData, key);
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseListValue(formData: FormData, key: string) {
  return Array.from(
    new Set(
      readFormValue(formData, key)
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function parseSpecificationsValue(formData: FormData, key: string) {
  return readFormValue(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return {
          label: line,
          value: "",
        };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((item) => item.label && item.value);
}

function resolveUploadedImageExtension(file: File) {
  const mimeExtension = mimeExtensionMap.get(file.type);
  if (mimeExtension) {
    return mimeExtension;
  }

  const fileName = file.name.trim().toLowerCase();
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  if (extension && [...mimeExtensionMap.values()].includes(extension)) {
    return extension;
  }

  return "";
}

export async function saveUploadedProductImage(formData: FormData) {
  const imageEntry = formData.get("imageFile");
  if (!(imageEntry instanceof File) || imageEntry.size === 0) {
    return null;
  }

  if (imageEntry.size > maxProductImageSizeInBytes) {
    throw new Error("Ukuran foto produk maksimal 5 MB.");
  }

  const extension = resolveUploadedImageExtension(imageEntry);
  if (!extension) {
    throw new Error("Format foto produk harus JPG, PNG, WEBP, atau GIF.");
  }

  await mkdir(managedProductImageDirectory, { recursive: true });

  const fileName = `product-${randomUUID()}.${extension}`;
  const filePath = path.join(managedProductImageDirectory, fileName);
  const arrayBuffer = await imageEntry.arrayBuffer();

  await writeFile(filePath, Buffer.from(arrayBuffer));

  return `${managedProductImagePrefix}${fileName}`;
}

export async function deleteManagedProductImage(
  imagePath: string | null | undefined,
) {
  const trimmedPath = imagePath?.trim();
  if (!trimmedPath || !trimmedPath.startsWith(managedProductImagePrefix)) {
    return;
  }

  const fileName = path.basename(trimmedPath);
  const targetPath = path.join(managedProductImageDirectory, fileName);

  await unlink(targetPath).catch(() => undefined);
}

export function buildProductPayload(
  formData: FormData,
  imagePath: string,
): ProductPayload {
  const compareAtPrice = parseOptionalNumberValue(formData, "compareAtPrice");

  return {
    name: readFormValue(formData, "name"),
    slug: readFormValue(formData, "slug"),
    sku: readFormValue(formData, "sku"),
    image: imagePath,
    brand: readFormValue(formData, "brand"),
    category: readFormValue(formData, "category"),
    vehicle: readFormValue(formData, "vehicle"),
    motorCodes: parseListValue(formData, "motorCodes"),
    price: parseNumberValue(formData, "price"),
    compareAtPrice,
    stock: parseNumberValue(formData, "stock"),
    rating: parseNumberValue(formData, "rating"),
    reviewCount: parseNumberValue(formData, "reviewCount"),
    shortDescription: readFormValue(formData, "shortDescription"),
    description: readFormValue(formData, "description"),
    compatibility: parseListValue(formData, "compatibility"),
    specifications: parseSpecificationsValue(formData, "specifications"),
    tags: parseListValue(formData, "tags"),
    badges: parseListValue(formData, "badges"),
    leadTime: readFormValue(formData, "leadTime"),
    location: readFormValue(formData, "location"),
    soldCount: parseNumberValue(formData, "soldCount"),
    accentFrom: readFormValue(formData, "accentFrom"),
    accentTo: readFormValue(formData, "accentTo"),
    accentGlow: readFormValue(formData, "accentGlow"),
  };
}

export function resolveProductImagePath(
  formData: FormData,
  uploadedImagePath: string | null,
) {
  const existingImagePath = readFormValue(formData, "existingImage");
  const removeImage = formData.get("removeImage") === "on";

  if (uploadedImagePath) {
    return {
      imagePath: uploadedImagePath,
      existingImagePath,
      shouldDeletePreviousImage:
        !!existingImagePath && existingImagePath !== uploadedImagePath,
    };
  }

  if (removeImage) {
    return {
      imagePath: "",
      existingImagePath,
      shouldDeletePreviousImage: !!existingImagePath,
    };
  }

  return {
    imagePath: existingImagePath,
    existingImagePath,
    shouldDeletePreviousImage: false,
  };
}
