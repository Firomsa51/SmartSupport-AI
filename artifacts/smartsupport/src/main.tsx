import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl.replace(/\/+$/, ""));
}

// We set the auth token getter after Clerk loads via App.tsx
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in HTML.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export { setAuthTokenGetter };
