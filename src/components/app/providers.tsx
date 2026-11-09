"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children, dir }: { children: ReactNode; dir: "ltr" | "rtl" }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster dir={dir} />
    </ThemeProvider>
  );
}
