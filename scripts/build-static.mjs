import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const tempDir = path.join(rootDir, ".next-static-workspace");
const tempAppDir = path.join(tempDir, "app");
const tempStorefrontAppDir = path.join(tempAppDir, "(storefront)");
const outputDir = path.join(rootDir, "out-static");

const rootFilesToCopy = [
  "package.json",
  "tsconfig.json",
  "postcss.config.mjs",
  "next.config.ts",
  "next-env.d.ts",
];

const rootDirsToCopy = ["public", "entities", "features", "shared", "widgets"];
const appFilesToCopy = ["layout.tsx", "globals.css", "not-found.tsx"];

async function copyIfExists(sourcePath, targetPath) {
  try {
    await cp(sourcePath, targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

function parseEnvFile(content) {
  const values = new Map();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values.set(key, value.replace(/^['"]|['"]$/g, ""));
  }

  return values;
}

async function fetchStaticProductSlugs() {
  let envValues = new Map();

  try {
    const envContent = await readFile(path.join(rootDir, ".env.local"), "utf8");
    envValues = parseEnvFile(envContent);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const baseUrl =
    process.env.BACKEND_API_BASE_URL ??
    envValues.get("BACKEND_API_BASE_URL") ??
    "";
  const token =
    process.env.BACKEND_API_TOKEN ??
    envValues.get("BACKEND_API_TOKEN") ??
    "";

  if (!baseUrl.trim()) {
    return [];
  }

  const url = new URL("catalog/products", `${baseUrl.replace(/\/+$/, "")}/`);
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}),
      },
    });
  } catch {
    console.warn(
      `Skipping static product detail generation because ${url} is not reachable.`,
    );
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch product slugs for static export (${response.status}).`,
    );
  }

  const payload = await response.json().catch(() => null);
  const data =
    payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
  const rawItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];

  return rawItems
    .map((item) =>
      item && typeof item === "object" && typeof item.slug === "string"
        ? item.slug
        : null,
    )
    .filter((slug) => typeof slug === "string");
}

async function createStaticProductPages() {
  const templateTargetDir = path.join(tempDir, "static-templates");
  const templateFilePath = path.join(templateTargetDir, "product-detail-page.tsx");
  const dynamicProductDir = path.join(tempStorefrontAppDir, "produk", "[slug]");
  const dynamicProductPagePath = path.join(dynamicProductDir, "page.tsx");
  const slugs = await fetchStaticProductSlugs();

  await mkdir(templateTargetDir, { recursive: true });
  await copyIfExists(dynamicProductPagePath, templateFilePath);
  await rm(dynamicProductDir, { recursive: true, force: true });

  for (const slug of slugs) {
    const targetDir = path.join(tempStorefrontAppDir, "produk", slug);
    const targetFile = path.join(targetDir, "page.tsx");
    const slugLiteral = JSON.stringify(slug);

    await mkdir(targetDir, { recursive: true });
    await writeFile(
      targetFile,
      `import type { Metadata } from "next";
import ProductDetailPageRoute, {
  generateMetadata as generateRouteMetadata,
} from "@/static-templates/product-detail-page";

const params = Promise.resolve({ slug: ${slugLiteral} });

export async function generateMetadata(): Promise<Metadata> {
  return generateRouteMetadata({ params });
}

export default async function ProductDetailPage() {
  return <ProductDetailPageRoute params={params} />;
}
`,
      "utf8",
    );
  }
}

async function createStaticAdminLoginPage() {
  const adminLoginDir = path.join(tempStorefrontAppDir, "admin-login");
  const adminLoginPagePath = path.join(adminLoginDir, "page.tsx");

  await rm(adminLoginDir, { recursive: true, force: true });
  await mkdir(adminLoginDir, { recursive: true });
  await writeFile(
    adminLoginPagePath,
    `import { StaticAdminLoginBridge } from "@/shared/ui/static-admin-login-bridge";

export default function StaticAdminLoginPage() {
  return <StaticAdminLoginBridge />;
}
`,
    "utf8",
  );
}

function runNextBuild(cwd) {
  const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd,
      env: {
        ...process.env,
        NEXT_STATIC_EXPORT: "true",
        NEXT_PUBLIC_STATIC_EXPORT: "true",
      },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Static export build failed with exit code ${code ?? "unknown"}.`));
    });

    child.on("error", reject);
  });
}

async function createTempWorkspace() {
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempAppDir, { recursive: true });

  for (const file of rootFilesToCopy) {
    await copyIfExists(path.join(rootDir, file), path.join(tempDir, file));
  }

  for (const directory of rootDirsToCopy) {
    await copyIfExists(path.join(rootDir, directory), path.join(tempDir, directory));
  }

  await copyIfExists(path.join(rootDir, ".env.local"), path.join(tempDir, ".env.local"));

  for (const file of appFilesToCopy) {
    await copyIfExists(path.join(rootDir, "app", file), path.join(tempAppDir, file));
  }

  await copyIfExists(
    path.join(rootDir, "app", "(storefront)"),
    tempStorefrontAppDir,
  );
  await createStaticProductPages();
  await createStaticAdminLoginPage();

  await symlink(
    path.join(rootDir, "node_modules"),
    path.join(tempDir, "node_modules"),
    "junction",
  );
}

async function main() {
  await createTempWorkspace();
  await runNextBuild(tempDir);
  await rm(outputDir, { recursive: true, force: true });
  await cp(path.join(tempDir, "out"), outputDir, { recursive: true, force: true });
  await rm(tempDir, { recursive: true, force: true });
  console.log(`Static storefront exported to ${outputDir}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
