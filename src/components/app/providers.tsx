"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";

// Our Content-Security-Policy forbids eval(): tell zod not to try its eval-based speed-up.
z.config({ jitless: true });

export function Providers({ children, dir }: { children: ReactNode; dir: "ltr" | "rtl" }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster dir={dir} />
    </ThemeProvider>
  );
}
