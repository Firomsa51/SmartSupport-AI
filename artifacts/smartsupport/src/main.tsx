import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clerk: use the new package
import { ClerkProvider } from "@clerk/react";

// API client setup
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl.replace(/\/+$/, ""));
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in HTML.");
}

createRoot(rootElement).render(
  <StrictMode>
    {/* Wrap the app in ClerkProvider */}
    <ClerkProvider>
      <App />
    </ClerkProvider>
  </StrictMode>
);

export { setAuthTokenGetter };
