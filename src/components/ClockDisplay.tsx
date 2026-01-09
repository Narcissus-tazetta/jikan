import { getNextSchoolDay, formatNextDayLabel, type CurrentStatus } from "@/lib/school-logic";
import type { AppSettings } from "@/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { NextSchoolDayCard } from "@/components/ClockDisplay/NextSchoolDayCard";
import { TimerView } from "@/components/ClockDisplay/TimerView";

// Constants & small helpers extracted for clarity and testability
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

const formatYear = (d: Date, yearFormat: AppSettings["dateDisplay"]["yearFormat"]) => {
    const y = d.getFullYear();
    if (yearFormat === "reiwa") {
        const reiwa = y - 2018; // 2019 => 1
        if (reiwa >= 1) return `令和${String(reiwa).padStart(2, "0")}年`;
    }
    return `${y}`;
};

const formatDateString = (d: Date, settings: AppSettings) => {
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");

    const weekday = settings.dateDisplay.weekdayFormat === "ja" ? DAYS_JA[d.getDay()] : DAYS[d.getDay()];

    const yearPart = formatYear(d, settings.dateDisplay.yearFormat);
    const datePart =
        settings.dateDisplay.dateFormat === "kanji" ? `${yearPart}${mm}月${dd}日` : `${d.getFullYear()}/${mm}/${dd}`;

    return `${datePart} (${weekday})`;
};

const formatCurrentTime = (d: Date, showHundredths: boolean) => {
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    if (!showHundredths) return `${hh}:${mm}:${ss}`;
    const cs = Math.floor(d.getMilliseconds() / 10)
        .toString()
        .padStart(2, "0");
    return `${hh}:${mm}:${ss}.${cs}`;
};

export interface ClockDisplayProps {
    now: Date;
    status: CurrentStatus;
    settings: AppSettings;
    onStatusClick?: () => void;
}

export function ClockDisplay({ now, status, settings, onStatusClick }: ClockDisplayProps) {
    // Compute Next School Day when appropriate (derived from props/state)
    const nextSchoolDay = (() => {
        if (status.state !== "AFTER_SCHOOL") return null;
        try {
            const next = getNextSchoolDay(now, settings.course);
            return { date: next.date, label: formatNextDayLabel(next) };
        } catch (e) {
            console.error(e);
            return null;
        }
    })();

    // Format Time Remaining
    const showMs = settings.showMilliseconds;
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        let base = "";
        if (m > 59) {
            const h = Math.floor(m / 60);
            const remM = m % 60;
            base = `${h}:${remM.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        } else {
            base = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }

        if (showMs) {
            const centis = Math.floor((ms % 1000) / 10); // 2 digits
            return `${base}.${centis.toString().padStart(2, "0")}`;
        }
        return base;
    };

    const timeString = formatTime(status.remainingMs);

    // Progress Value
    let progressValue = status.progressPercent;
    if (settings.progressBar.mode === "modeB") {
        progressValue = 100 - status.progressPercent;
    }

    // Visual variants for Mode
    const isAfterSchool = status.state === "AFTER_SCHOOL";

    // Font Size Helper
    const getFontSizeClass = () => {
        if (!settings.timerFontSize) return "text-7xl sm:text-9xl"; // fallback or default
        switch (settings.timerFontSize) {
            case 1:
                return "text-3xl sm:text-5xl";
            case 2:
                return "text-5xl sm:text-7xl";
            case 3:
                return "text-7xl sm:text-9xl"; // current Default
            case 4:
                return "text-8xl sm:text-[10rem]";
            case 5:
                return "text-9xl sm:text-[12rem]";
            default:
                return "text-7xl sm:text-9xl";
        }
    };
    const baseSize = getFontSizeClass();

    return (
        <div className="flex flex-col items-center justify-center w-full p-6 space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-2xl mx-auto space-y-8">
                {/* Date Display */}
                {settings.dateDisplay.enabled && (
                    <div className="text-lg sm:text-xl font-mono text-muted-foreground tracking-widest opacity-80">
                        {formatDateString(now, settings)}
                    </div>
                )}

                {settings.currentTimeDisplay.enabled && (
                    <div className="text-lg sm:text-xl font-mono text-muted-foreground tracking-widest opacity-80">
                        {formatCurrentTime(now, settings.currentTimeDisplay.showHundredths)}
                    </div>
                )}

                {/* Main Content */}
                <div className="relative z-10 py-4 w-full">
                    <AnimatePresence mode="wait">
                        {isAfterSchool && nextSchoolDay ? (
                            <motion.div
                                key="next-day"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <NextSchoolDayCard label={nextSchoolDay.label} date={nextSchoolDay.date} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="timer"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center space-y-6"
                            >
                                <TimerView
                                    statusLabel={status.label}
                                    statusState={status.state}
                                    timeString={timeString}
                                    onStatusClick={onStatusClick}
                                    baseSize={baseSize}
                                    nextPeriodName={status.nextPeriod?.name}
                                    periodName={status.period?.name}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Bar Area */}
            {settings.progressBar.enabled && !isAfterSchool && (
                <div
                    className="w-full mx-auto space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-100"
                    style={{ maxWidth: `${settings.progressBar.width}%` }}
                >
                    <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-mono uppercase tracking-wider">
                        <span>{status.period?.start || "START"}</span>
                        <span>{Math.round(progressValue)}%</span>
                        <span>{status.period?.end || "END"}</span>
                    </div>
                    <Progress
                        value={progressValue}
                        className={cn(
                            "bg-muted/50",
                            settings.progressBar.thickness === "thin"
                                ? "h-1"
                                : settings.progressBar.thickness === "thick"
                                ? "h-6 sm:h-8"
                                : "h-3 sm:h-4"
                        )}
                        indicatorColor={settings.progressBar.color}
                    />
                </div>
            )}
        </div>
    );
}
