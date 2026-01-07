import { TIMETABLE } from "@/data/timetable";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ScheduleViewProps {
    onBack: () => void;
}

export function ScheduleView({ onBack }: ScheduleViewProps) {
    // Determine current day's applicable slots (simplified logic, just showing all for now as user just asked for "1 day schedule")
    // Ideally we should show the schedule relevant to the selected course, but TIMETABLE is currently static for "a day".
    // I will display the standard TIMETABLE defined in data.

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 space-y-6"
        >
            <div className="w-full flex items-center justify-start">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="gap-2 pl-0 hover:bg-transparent hover:text-foreground/80"
                >
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-lg">戻る</span>
                </Button>
            </div>

            <div className="w-full space-y-4">
                <h2 className="text-2xl font-bold tracking-tight mb-6">本日のスケジュール</h2>

                <div className="space-y-3">
                    {TIMETABLE.map((slot, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-xl border",
                                slot.type === "BREAK" ? "bg-muted/30 border-muted" : "bg-card border-border"
                                // Highlight if current time is within slot? Maybe future improvement.
                            )}
                        >
                            <div className="flex flex-col">
                                <span
                                    className={cn(
                                        "font-bold text-lg",
                                        slot.type === "BREAK" && "text-muted-foreground font-medium"
                                    )}
                                >
                                    {slot.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono mt-1">
                                    {slot.type === "CLASS" ? "授業" : slot.type === "BREAK" ? "休憩" : "その他"}
                                </span>
                            </div>
                            <div className="font-mono text-xl tracking-widest opacity-80">
                                {slot.start} <span className="text-muted-foreground text-sm mx-1">-</span> {slot.end}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
