import type { AppParameter } from "@/entities/app-parameter/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import {
  defaultPublicAppConfig,
  type PublicAppConfig,
} from "@/shared/config/app";
import { withBasePath } from "@/shared/config/base-path";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

function normalizeParameterKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "-");
}

function createParameterMap(parameters: AppParameter[]) {
  return new Map(
    parameters.map((parameter) => [
      normalizeParameterKey(parameter.key),
      parameter,
    ]),
  );
}

function readParameterItem(
  parameterMap: Map<string, AppParameter>,
  key: string,
) {
  return parameterMap.get(normalizeParameterKey(key)) ?? null;
}

function readParameter(
  parameterMap: Map<string, AppParameter>,
  key: string,
  fallback: string,
) {
  const value = readParameterItem(parameterMap, key)?.value?.trim();
  return value ? value : fallback;
}

function appendAssetVersion(value: string, updatedAt: string) {
  const version = Date.parse(updatedAt);
  if (!Number.isFinite(version)) {
    return value;
  }

  if (value.startsWith("/")) {
    try {
      const url = new URL(value, "http://baregad.local");
      url.searchParams.set("v", String(version));
      return `${url.pathname}${url.search}`;
    } catch {
      return `${value}${value.includes("?") ? "&" : "?"}v=${version}`;
    }
  }

  try {
    const url = new URL(value);
    url.searchParams.set("v", String(version));
    return url.toString();
  } catch {
    return `${value}${value.includes("?") ? "&" : "?"}v=${version}`;
  }
}

function resolveBackendAssetPath(value: string) {
  if (!value.startsWith("/api/") && !value.startsWith("/uploads/")) {
    return value;
  }

  const backendBaseUrl = getPublicBackendBaseUrl();

  if (!backendBaseUrl) {
    return value;
  }

  try {
    return new URL(value, `${new URL(backendBaseUrl).origin}/`).toString();
  } catch {
    return value;
  }
}

function readAssetParameter(
  parameterMap: Map<string, AppParameter>,
  key: string,
  fallback: string,
) {
  const parameter = readParameterItem(parameterMap, key);
  if (!parameter) {
    return fallback;
  }

  const value = parameter.value.trim();
  if (!value) {
    return fallback;
  }

  return withBasePath(
    appendAssetVersion(resolveBackendAssetPath(value), parameter.updatedAt),
  );
}

function readKeywords(parameterMap: Map<string, AppParameter>) {
  const rawValue = readParameterItem(
    parameterMap,
    "seo_keywords",
  )?.value?.trim();

  if (!rawValue) {
    return defaultPublicAppConfig.seoKeywords;
  }

  const keywords = rawValue
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : defaultPublicAppConfig.seoKeywords;
}

function readMetadataBaseUrl(parameterMap: Map<string, AppParameter>) {
  const fallback = defaultPublicAppConfig.metadataBaseUrl;
  const value = readParameterItem(
    parameterMap,
    "metadata_base_url",
  )?.value?.trim();

  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    return fallback;
  }
}

function buildPublicAppConfig(parameters: AppParameter[]): PublicAppConfig {
  const parameterMap = createParameterMap(parameters);

  return {
    appName: readParameter(
      parameterMap,
      "app_name",
      defaultPublicAppConfig.appName,
    ),
    appShortName: readParameter(
      parameterMap,
      "app_short_name",
      defaultPublicAppConfig.appShortName,
    ),
    appDescription: readParameter(
      parameterMap,
      "app_description",
      defaultPublicAppConfig.appDescription,
    ),
    appTagline: readParameter(
      parameterMap,
      "app_tagline",
      defaultPublicAppConfig.appTagline,
    ),
    brandCategoryLabel: readParameter(
      parameterMap,
      "brand_category_label",
      defaultPublicAppConfig.brandCategoryLabel,
    ),
    logoUrl: readAssetParameter(
      parameterMap,
      "logo_url",
      defaultPublicAppConfig.logoUrl,
    ),
    faviconUrl: readAssetParameter(
      parameterMap,
      "favicon_url",
      defaultPublicAppConfig.faviconUrl,
    ),
    metadataBaseUrl: readMetadataBaseUrl(parameterMap),
    seoKeywords: readKeywords(parameterMap),
    adminPanelName: readParameter(
      parameterMap,
      "admin_panel_name",
      defaultPublicAppConfig.adminPanelName,
    ),
    adminPanelSubtitle: readParameter(
      parameterMap,
      "admin_panel_subtitle",
      defaultPublicAppConfig.adminPanelSubtitle,
    ),
    adminWorkspaceLabel: readParameter(
      parameterMap,
      "admin_workspace_label",
      defaultPublicAppConfig.adminWorkspaceLabel,
    ),
    adminWorkspaceTitle: readParameter(
      parameterMap,
      "admin_workspace_title",
      defaultPublicAppConfig.adminWorkspaceTitle,
    ),
    whatsappGreetingLabel: readParameter(
      parameterMap,
      "whatsapp_greeting_label",
      defaultPublicAppConfig.whatsappGreetingLabel,
    ),
    supportTeamLabel: readParameter(
      parameterMap,
      "support_team_label",
      defaultPublicAppConfig.supportTeamLabel,
    ),
  };
}

export async function getPublicAppConfig() {
  if (!getPublicBackendBaseUrl()) {
    return defaultPublicAppConfig;
  }

  try {
    const parameters = await backendFetchJson<AppParameter[]>(
      "/app-parameters/public",
    );
    return buildPublicAppConfig(parameters);
  } catch {
    return defaultPublicAppConfig;
  }
}
