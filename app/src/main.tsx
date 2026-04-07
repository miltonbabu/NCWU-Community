import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import AppRouter from "./AppRouter.tsx";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="ncwu-theme">
      <AppRouter />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  </StrictMode>,
);
