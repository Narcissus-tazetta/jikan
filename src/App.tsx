import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useTimeManager } from "@/hooks/useTimeManager";
import { getCurrentStatus } from "@/lib/school-logic";
import { getBackgroundBlob } from "@/lib/background-idb";
import { ClockDisplay } from "@/components/ClockDisplay";
import { ScheduleView } from "@/components/ScheduleView";
import { SettingsDialog } from "@/components/SettingsDialog";

function App() {
    const { settings, updateSettings } = useSettings();
    const { now, status } = useTimeManager(settings.course);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    const [resolvedBackgroundUrl, setResolvedBackgroundUrl] = useState<string | null>(null);

    useEffect(() => {
        let disposed = false;
        let createdObjectUrl: string | null = null;

        const isAllowedImageUrl = (v: string) => {
            const raw = v.trim();
            if (!raw) return false;
            if (raw.startsWith("data:image/")) return true;
            try {
                const url = new URL(raw);
                return url.protocol === "http:" || url.protocol === "https:";
            } catch {
                return false;
            }
        };

        const run = async () => {
            if (!settings.backgroundEnabled) {
                setResolvedBackgroundUrl(null);
                return;
            }

            if (settings.backgroundSource === "url") {
                const raw = settings.backgroundUrl.trim();
                setResolvedBackgroundUrl(raw && isAllowedImageUrl(raw) ? raw : null);
                return;
            }

            const key = settings.backgroundIdbKey;
            if (!key) {
                setResolvedBackgroundUrl(null);
                return;
            }

            try {
                const blob = await getBackgroundBlob(key);
                if (disposed) return;
                if (!blob) {
                    setResolvedBackgroundUrl(null);
                    return;
                }
                createdObjectUrl = URL.createObjectURL(blob);
                setResolvedBackgroundUrl(createdObjectUrl);
            } catch (err) {
                console.error(err);
                setResolvedBackgroundUrl(null);
            }
        };

        run();

        return () => {
            disposed = true;
            if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
        };
    }, [settings.backgroundEnabled, settings.backgroundSource, settings.backgroundUrl, settings.backgroundIdbKey]);

    useEffect(() => {
        const original = document.title;

        if (!settings.tabTitleCountdownEnabled) {
            document.title = original;
            return () => {
                document.title = original;
            };
        }

        const formatRemaining = (ms: number) => {
            if (ms <= 0) return null;
            const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${String(seconds).padStart(2, "0")}`;
        };

        const tick = () => {
            const current = getCurrentStatus(new Date(), settings.course);
            const shouldShowCountdown =
                (current.state === "IN_SESSION" || current.state === "BEFORE_SCHOOL") && current.remainingMs > 0;

            document.title = shouldShowCountdown ? formatRemaining(current.remainingMs) ?? original : original;
        };

        tick();
        const timerId = window.setInterval(tick, 1000);

        return () => {
            clearInterval(timerId);
            document.title = original;
        };
    }, [settings.course, settings.tabTitleCountdownEnabled]);

    const openSchedule = () => setIsScheduleOpen(true);
    const closeSchedule = () => setIsScheduleOpen(false);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-background text-foreground selection:bg-primary/20">
            {/* Background Image (optional) */}
            {resolvedBackgroundUrl && (
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${JSON.stringify(resolvedBackgroundUrl)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                />
            )}

            {/* Minimal Background overlay (keeps readability) */}
            <div
                className={
                    resolvedBackgroundUrl
                        ? settings.backgroundBlurEnabled
                            ? "absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95 backdrop-blur-md"
                            : "absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95"
                        : "absolute inset-0 z-0 bg-background"
                }
            />

            {/* Main Content */}
            <main className="relative z-10 w-full px-4 flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {isScheduleOpen ? (
                        <ScheduleView key="schedule-view" onBack={closeSchedule} />
                    ) : (
                        <ClockDisplay
                            key="clock-display"
                            now={now}
                            status={status}
                            settings={settings}
                            onStatusClick={openSchedule}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* Settings Button (Top Right) */}
            <SettingsDialog settings={settings} updateSettings={updateSettings} />
        </div>
    );
}

export default App;
