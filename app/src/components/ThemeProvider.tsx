"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useSettingsStore((s) => s.theme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Reset classes
        document.documentElement.classList.remove("dark", "sepia");

        // Apply new theme
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else if (theme === "sepia") {
            document.documentElement.classList.add("sepia");
        }
    }, [theme, mounted]);

    // Prevent flash of incorrect theme during SSR hydration
    if (!mounted) {
        return <>{children}</>;
    }

    return <>{children}</>;
}
