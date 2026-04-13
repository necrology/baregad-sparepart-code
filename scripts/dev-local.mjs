import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const defaultPort = process.env.PORT?.trim() || "3000";
const localBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "/baregad-sparepart";
const defaultSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  `http://localhost:${defaultPort}${localBasePath}`;

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  cwd: rootDir,
  env: {
    ...process.env,
    NEXT_PUBLIC_BASE_PATH: localBasePath,
    NEXT_PUBLIC_SITE_URL: defaultSiteUrl,
  },
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
