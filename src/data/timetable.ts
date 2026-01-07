import type { TimeSlot } from "@/types";

export const TIMETABLE: TimeSlot[] = [
    { start: "09:00", end: "09:30", name: "キャンパス開館", type: "BEFORE_SCHOOL" },
    { start: "09:30", end: "09:45", name: "朝礼", type: "CLASS" },
    { start: "09:45", end: "10:35", name: "1時間目", type: "CLASS" },
    { start: "10:35", end: "10:45", name: "休憩1", type: "BREAK" },
    { start: "10:45", end: "11:35", name: "2時間目", type: "CLASS" },
    { start: "11:35", end: "11:45", name: "休憩2", type: "BREAK" },
    { start: "11:45", end: "12:35", name: "3時間目", type: "CLASS" },
    { start: "12:35", end: "13:15", name: "昼休憩", type: "BREAK" },
    { start: "13:15", end: "14:05", name: "4時間目", type: "CLASS" },
    { start: "14:05", end: "14:15", name: "休憩4", type: "BREAK" },
    { start: "14:15", end: "15:05", name: "5時間目", type: "CLASS" },
    { start: "15:05", end: "15:15", name: "休憩5", type: "BREAK" },
    { start: "15:15", end: "16:05", name: "6時間目", type: "CLASS" },
    { start: "16:05", end: "16:15", name: "終礼", type: "CLASS" },
    { start: "16:15", end: "17:30", name: "放課後", type: "AFTER_SCHOOL" }, // Special handling might be needed, but listing it here helps
];

export const SCHOOL_START_TIME = "09:00";
export const SCHOOL_END_TIME = "17:30";
