import "server-only";
import type { StorefrontWhatsAppAdmin } from "@/entities/user/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getBackendRuntimeConfig } from "@/shared/config/env";
import { buildWhatsAppUrl } from "@/shared/lib/whatsapp";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeWhatsAppAdmin(value: unknown): StorefrontWhatsAppAdmin | null {
  if (!isRecord(value)) {
    return null;
  }

  const fullName = String(value.fullName ?? "").trim();
  const phone = String(value.phone ?? "").trim();
  const whatsAppUrl = buildWhatsAppUrl(phone);

  if (
    typeof value.id !== "string" ||
    fullName === "" ||
    phone === "" ||
    whatsAppUrl === ""
  ) {
    return null;
  }

  return {
    id: value.id,
    fullName,
    phone,
    levelName: String(value.levelName ?? ""),
    levelCode: String(value.levelCode ?? ""),
    whatsAppUrl,
  };
}

export async function getStorefrontWhatsAppAdmins() {
  const config = getBackendRuntimeConfig();

  if (!config.enabled) {
    return [] as StorefrontWhatsAppAdmin[];
  }

  try {
    const response = await backendFetchJson<unknown[]>("/users/whatsapp-admins");
    return response
      .map(normalizeWhatsAppAdmin)
      .filter((item): item is StorefrontWhatsAppAdmin => !!item);
  } catch {
    return [] as StorefrontWhatsAppAdmin[];
  }
}
