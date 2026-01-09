import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useTimeManager } from "@/hooks/useTimeManager";
import { getCurrentStatus } from "@/lib/school-logic";
import { ClockDisplay } from "@/components/ClockDisplay";
import { ScheduleView } from "@/components/ScheduleView";
import { SettingsDialog } from "@/components/SettingsDialog";

function App() {
    const { settings, updateSettings } = useSettings();
    const { now, status } = useTimeManager(settings.course);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
            {/* Minimal Background */}
            <div className="absolute inset-0 z-0 bg-background" />

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
