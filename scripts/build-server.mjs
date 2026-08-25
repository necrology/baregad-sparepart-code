import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
const standalonePublicDir = path.join(standaloneDir, "public");

function runNextBuild(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd,
      env: {
        ...process.env,
        NEXT_STATIC_EXPORT: "",
        NEXT_PUBLIC_STATIC_EXPORT: "",
      },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Server build failed with exit code ${code ?? "unknown"}.`));
    });

    child.on("error", reject);
  });
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function syncStandaloneAssets() {
  const staticSourceDir = path.join(rootDir, ".next", "static");
  const publicSourceDir = path.join(rootDir, "public");

  await rm(standaloneStaticDir, { recursive: true, force: true });
  await mkdir(path.dirname(standaloneStaticDir), { recursive: true });
  await cp(staticSourceDir, standaloneStaticDir, { recursive: true, force: true });

  if (await pathExists(publicSourceDir)) {
    await rm(standalonePublicDir, { recursive: true, force: true });
    await cp(publicSourceDir, standalonePublicDir, { recursive: true, force: true });
  }
}

async function main() {
  await runNextBuild(rootDir);
  await syncStandaloneAssets();
  console.log(`Standalone server build is ready in ${standaloneDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
