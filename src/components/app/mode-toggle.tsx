"use client";

import { CheckIcon, LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateThemeAction } from "@/app/[locale]/(app)/account/actions";

const OPTIONS = [
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
  { value: "system", icon: LaptopIcon },
] as const;

/** Light / dark switch in the header (shadcn "mode toggle"). Saved in the profile. */
export function ModeToggle() {
  const t = useTranslations("account.preferences");
  const { theme, setTheme } = useTheme();
  const choose = (value: (typeof OPTIONS)[number]["value"]) => {
    setTheme(value);
    void updateThemeAction(value);
  };
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("theme")} title={t("theme")} className="relative text-muted-foreground hover:text-foreground" data-testid="mode-toggle">
          <SunIcon className="size-5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" aria-hidden />
          <MoonIcon className="absolute size-5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {OPTIONS.map(({ value, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => choose(value)}>
            <Icon aria-hidden />
            <span className="flex-1">{t(value)}</span>
            {theme === value ? <CheckIcon className="text-primary!" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
