#!/bin/bash
set -e

# Push database schema to create tables
cd ../..
npx drizzle-kit push --config=lib/db/drizzle.config.ts
cd artifacts/api-server

# Build the serverless handler
node ./build-vercel.mjs
mkdir -p /vercel/output/functions/api/handler.func
cp api/handler.js /vercel/output/functions/api/handler.func/index.js
echo '{"runtime":"nodejs20.x","handler":"index.js","maxDuration":30}' > /vercel/output/functions/api/handler.func/.vc-config.json
echo '{"version":3,"routes":[{"src":"/(.*)","dest":"/api/handler"}]}' > /vercel/output/config.json
