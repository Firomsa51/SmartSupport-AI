/**
 * Build script for Vercel deployment.
 *
 * Bundles src/handler.ts into ../../api/handler.js — a self-contained
 * CommonJS file that Vercel's Node.js runtime invokes directly as a
 * serverless function.
 *
 * Key differences from build.mjs (the regular dev/prod build):
 *   - Entry:   src/handler.ts  (exports Express app, no app.listen())
 *   - Output:  ../../api/handler.js  (CJS, single file at workspace root)
 *   - No esbuild-plugin-pino: Vercel sets NODE_ENV=production so pino
 *     never activates worker transports — no separate worker files needed.
 *   - No ESM banner: CJS output already has require() available globally.
 *   - No sourcemaps: reduces bundle size for faster cold starts.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, mkdir } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(artifactDir, "..", "..");
const apiDir = path.resolve(artifactDir, "api");
const outfile = path.resolve(apiDir, "handler.js");

async function buildVercelHandler() {
  await rm(outfile, { force: true });
  await rm(`${outfile}.map`, { force: true });
  await mkdir(apiDir, { recursive: true });

  console.log("Building Vercel serverless handler…");

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/handler.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile,
    logLevel: "info",
    sourcemap: false,
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      // "@opentelemetry/*" <-- REMOVED: was excluding @opentelemetry/api from
      //   the bundle, causing "Cannot find module" crashes at Vercel runtime.
      //   @opentelemetry/api is pure JS with no native bindings — bundle it.
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
  });

  console.log(`\nVercel handler written to: ${outfile}`);
}

buildVercelHandler().catch((err) => {
  console.error(err);
  process.exit(1);
});
