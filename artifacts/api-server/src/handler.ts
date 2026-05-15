// Vercel serverless entry point.
// Re-exports the Express app without calling app.listen() so that
// Vercel's Node.js runtime can invoke it directly as a request handler.
export { default } from "./app";
