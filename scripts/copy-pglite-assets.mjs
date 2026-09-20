#!/usr/bin/env node
/**
 * Copies PGLite wasm, data, and extension binaries into Nitro / Vercel server output
 * directories so serverless functions can boot PGLite when DATABASE_URL is unset.
 */
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pgliteDist = join(root, "node_modules", "@electric-sql", "pglite", "dist");

export function copyPgliteAssets() {
  if (!existsSync(pgliteDist)) {
    console.log("[copy-pglite] @electric-sql/pglite not found, skipping.");
    return;
  }

  const pgliteFiles = readdirSync(pgliteDist).filter((f) =>
    f.endsWith(".data") || f.endsWith(".wasm") || f.endsWith(".tar.gz")
  );

  if (pgliteFiles.length === 0) {
    console.log("[copy-pglite] No binary assets in pglite dist.");
    return;
  }

  // Find all server output directories
  const targetDirs = new Set();

  const vercelFunctionsDir = join(root, ".vercel", "output", "functions");
  if (existsSync(vercelFunctionsDir)) {
    function findFuncDirs(current) {
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        if (statSync(full).isDirectory()) {
          if (entry.endsWith(".func")) {
            targetDirs.add(full);
            targetDirs.add(join(full, "_libs"));
            targetDirs.add(join(full, "_chunks"));
          } else {
            findFuncDirs(full);
          }
        }
      }
    }
    findFuncDirs(vercelFunctionsDir);
  }

  const outputServerDir = join(root, ".output", "server");
  if (existsSync(outputServerDir)) {
    targetDirs.add(outputServerDir);
    targetDirs.add(join(outputServerDir, "_libs"));
    targetDirs.add(join(outputServerDir, "chunks"));
  }

  if (targetDirs.size === 0) {
    // If output dir doesn't exist yet, we still prepare the standard vercel function _libs
    const defaultVercelLibs = join(root, ".vercel", "output", "functions", "__server.func", "_libs");
    targetDirs.add(defaultVercelLibs);
  }

  for (const dir of targetDirs) {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      for (const file of pgliteFiles) {
        const src = join(pgliteDist, file);
        const dest = join(dir, file);
        copyFileSync(src, dest);
      }
    } catch (err) {
      console.warn(`[copy-pglite] Warning copying to ${dir}:`, err?.message || err);
    }
  }

  console.log(`[copy-pglite] Copied ${pgliteFiles.length} PGLite asset(s) to ${targetDirs.size} destination(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  copyPgliteAssets();
}
