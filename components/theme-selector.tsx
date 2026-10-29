"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-selector" role="radiogroup" aria-label="Color theme">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={(theme ?? "system") === value}
          title={`${label} theme`}
          onClick={() => setTheme(value)}
        >
          <Icon aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
