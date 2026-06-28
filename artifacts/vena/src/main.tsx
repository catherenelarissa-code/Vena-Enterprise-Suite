import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";
import { ThemeProvider } from "@/components/ThemeProvider";

setBaseUrl(import.meta.env.VITE_API_URL ?? "");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
