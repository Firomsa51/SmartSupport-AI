import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";
import { ClerkProvider } from "@clerk/clerk-react";

// ✅ FIX 4: Set your Clerk publishable key from env
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl.replace(/\/+$/, ""));
}

// ✅ FIX 3: Safe root element check
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in HTML. Check your index.html.");
}

// ✅ FIX 1 + 4: StrictMode + ClerkProvider wrapping entire app
createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
