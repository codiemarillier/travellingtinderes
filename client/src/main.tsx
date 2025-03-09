import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Configure HMR for Replit environment
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    console.log("Updating module...");
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
