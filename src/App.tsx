import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useTimeManager } from "@/hooks/useTimeManager";
import { ClockDisplay } from "@/components/ClockDisplay";
import { ScheduleView } from "@/components/ScheduleView";
import { SettingsDialog } from "@/components/SettingsDialog";

function App() {
    const { settings, updateSettings } = useSettings();
    const { now, status } = useTimeManager(settings.course);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
