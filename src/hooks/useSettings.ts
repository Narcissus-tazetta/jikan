import { useState, useEffect, useLayoutEffect } from "react";
import type { AppSettings } from "@/types";

const STORAGE_KEY = "school_timer_settings";

const DEFAULT_SETTINGS: AppSettings = {
    theme: "system", // Default to follow OS setting
    font: "normal",
    course: "WEEK_5",
    showMilliseconds: false,
    tabTitleCountdownEnabled: true,
    dateDisplay: {
        enabled: true,
        yearFormat: "gregorian",
        dateFormat: "slash",
        weekdayFormat: "en",
    },
    currentTimeDisplay: {
        enabled: false,
        showHundredths: false,
    },
    progressBar: {
        enabled: true,
        color: "#3b82f6", // blue-500
        mode: "modeA",
        thickness: "normal",
        width: 40,
    },
    timerFontSize: 3,
};

export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            return item ? { ...DEFAULT_SETTINGS, ...JSON.parse(item) } : DEFAULT_SETTINGS;
        } catch (error) {
            console.error(error);
            return DEFAULT_SETTINGS;
        }
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...newSettings };
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    // Effect to apply theme. If 'system', follow prefers-color-scheme and listen for changes.
    useLayoutEffect(() => {
        const root = document.documentElement;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const updateTheme = () => {
            const isDark = settings.theme === "system" ? mq.matches : settings.theme === "dark";

            root.classList.remove("light", "dark");
            root.classList.add(isDark ? "dark" : "light");
        };

        updateTheme();
        if (settings.theme === "system") {
            mq.addEventListener("change", updateTheme);
            return () => mq.removeEventListener("change", updateTheme);
        }
    }, [settings.theme]);

    // Effect to apply font
    useEffect(() => {
        // Apply to body to override CSS defaults
        const target = window.document.body;

        if (settings.font === "normal") {
            target.style.fontFamily = "'Noto Sans JP', sans-serif";
        } else if (settings.font === "round") {
            target.style.fontFamily = "'Zen Maru Gothic', sans-serif";
        } else if (settings.font === "shodo") {
            target.style.fontFamily = "'Yuji Syuku', serif";
        }
    }, [settings.font]);

    return { settings, updateSettings };
};
