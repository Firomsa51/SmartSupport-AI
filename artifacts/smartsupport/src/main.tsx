import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// On Vercel (or any deployment where the API lives on a different origin),
// set VITE_API_URL to the backend URL (e.g. https://my-api.railway.app).
// On Replit, the shared proxy routes /api/* to the Express server automatically,
// so no base URL override is needed — relative paths work out of the box.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl.replace(/\/+$/, ""));
}

createRoot(document.getElementById("root")!).render(<App />);
