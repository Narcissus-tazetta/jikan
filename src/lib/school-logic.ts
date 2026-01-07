import { TIMETABLE, SCHOOL_START_TIME, SCHOOL_END_TIME } from "@/data/timetable";
import { isHoliday } from "@/data/holidays";
import type { CourseType, TimeSlot } from "@/types";

// Helper to check course day
export const isCourseDay = (date: Date, course: CourseType): boolean => {
    const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    switch (course) {
        case "WEEK_1":
            return day === 4; // Thu
        case "WEEK_3":
            return day === 1 || day === 3 || day === 5; // Mon, Wed, Fri
        case "WEEK_5":
            return day >= 1 && day <= 5; // Mon-Fri
        default:
            return false;
    }
};

export const getNextSchoolDay = (baseDate: Date, course: CourseType): { date: Date; daysDiff: number } => {
    const d = new Date(baseDate);
    d.setHours(0, 0, 0, 0);

    // Start from tomorrow
    d.setDate(d.getDate() + 1);
    let daysDiff = 1;

    while (true) {
        if (!isHoliday(d) && isCourseDay(d, course)) {
            return { date: new Date(d), daysDiff };
        }
        d.setDate(d.getDate() + 1);
        daysDiff++;
        // Safety break to prevent infinite loop (e.g. 2 years)
        if (daysDiff > 730) {
            throw new Error("No school day found in 2 years");
        }
    }
};

export const formatNextDayLabel = (target: { date: Date; daysDiff: number }): string => {
    const { date, daysDiff } = target;
    if (daysDiff === 1) return "明日";
    if (daysDiff === 2) return "明後日";

    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayName = days[date.getDay()];

    if (daysDiff <= 7) {
        return `${dayName}曜日（${daysDiff}日後）`;
    }

    return `${date.getMonth() + 1}月${date.getDate()}日（${daysDiff}日後）`;
};

// Time Logic
export interface CurrentStatus {
    state: "BEFORE_SCHOOL" | "IN_SESSION" | "AFTER_SCHOOL";
    period?: TimeSlot;
    nextPeriod?: TimeSlot;
    remainingMs: number;
    progressPercent: number; // 0-100
    label: string;
}

export const getCurrentStatus = (now: Date, course: CourseType): CurrentStatus => {
    // Check if today is a school day first
    if (isHoliday(now) || !isCourseDay(now, course)) {
        // Not a school day, show next school day
        return {
            state: "AFTER_SCHOOL",
            remainingMs: 0,
            period: undefined,
            nextPeriod: undefined,
            progressPercent: 100,
            label: "休校日",
        };
    }

    const nowTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseTime(SCHOOL_START_TIME); // 9:00 -> 540
    const endTime = parseTime(SCHOOL_END_TIME); // 17:30 -> 1050

    // Before School
    if (nowTime < startTime) {
        const diff = (startTime - nowTime) * 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds());
        const firstSlot = TIMETABLE[0];
        return {
            state: "BEFORE_SCHOOL",
            period: undefined,
            nextPeriod: firstSlot,
            remainingMs: diff,
            progressPercent: 0,
            label: "始業まで",
        };
    }

    // After School
    if (nowTime >= endTime) {
        return {
            state: "AFTER_SCHOOL",
            remainingMs: 0,
            period: undefined,
            nextPeriod: undefined,
            progressPercent: 100,
            label: "放課後",
        };
    }

    // In Session
    // Find current slot index
    const currentIndex = TIMETABLE.findIndex((slot) => {
        const start = parseTime(slot.start);
        const end = parseTime(slot.end);
        return nowTime >= start && nowTime < end;
    });

    if (currentIndex !== -1) {
        const currentSlot = TIMETABLE[currentIndex];
        const nextSlot = TIMETABLE[currentIndex + 1];

        const start = parseTime(currentSlot.start) * 60 * 1000;
        const end = parseTime(currentSlot.end) * 60 * 1000;
        const current = nowTime * 60 * 1000 + now.getSeconds() * 1000 + now.getMilliseconds();

        // Period Total Duration
        const total = end - start;
        // Elapsed
        const elapsed = current - start;
        const remaining = end - current;

        const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

        return {
            state: "IN_SESSION",
            period: currentSlot,
            nextPeriod: nextSlot,
            remainingMs: remaining,
            progressPercent: percent,
            label: currentSlot.name,
        };
    }

    return {
        state: "IN_SESSION", // Fallback
        remainingMs: 0,
        progressPercent: 100,
        label: "時間外",
    };
};

function parseTime(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
