import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
    statusLabel: string;
    statusState: string;
    timeString: string;
    onStatusClick?: () => void;
    baseSize: string;
    nextPeriodName?: string;
    periodName?: string;
}

export function TimerView({
    statusLabel,
    statusState,
    timeString,
    onStatusClick,
    baseSize,
    nextPeriodName,
    periodName,
}: Props) {
    const targetLabel =
        statusState === "BEFORE_SCHOOL"
            ? "始業まで"
            : nextPeriodName
            ? `${nextPeriodName}まで`
            : periodName === "放課後"
            ? "完全下校まで"
            : "終了まで";

    return (
        <>
            <motion.button
                key={statusLabel}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onStatusClick?.()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 border border-foreground/20 rounded-full text-xs font-medium tracking-widest uppercase bg-background hover:bg-muted/50 cursor-pointer"
            >
                {statusState === "BEFORE_SCHOOL" ? "始業前" : `現在は${statusLabel}`}
            </motion.button>

            <div className="text-lg sm:text-xl text-muted-foreground font-light tracking-wide">{targetLabel}</div>

            <div className={cn("font-bold tracking-tighter tabular-nums leading-none", baseSize, "text-foreground")}>
                {timeString}
            </div>
        </>
    );
}
