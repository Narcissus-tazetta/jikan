import JapaneseHolidays from 'japanese-holidays';

// Helper to expand ranges
const expand = (year: number, month: number, dates: (number | [number, number])[]) => {
    const result: string[] = [];
    const y = year;
    const m = month.toString().padStart(2, '0');

    dates.forEach(d => {
        if (Array.isArray(d)) {
            for (let i = d[0]; i <= d[1]; i++) {
                result.push(`${y}-${m}-${i.toString().padStart(2, '0')}`);
            }
        } else {
            result.push(`${y}-${m}-${d.toString().padStart(2, '0')}`);
        }
    });
    return result;
};

// 2025-2026 Holiday Data
const RAW_HOLIDAYS = [
    ...expand(2025, 4, [[1, 7], 12, 13, 19, 20, [26, 30]]),
    ...expand(2025, 5, [[1, 6], 10, 11, 17, 18, 24, 25, 30, 31]),
    ...expand(2025, 6, [1, 7, 8, 14, 15, 21, 22, 28, 29]),
    ...expand(2025, 7, [[1, 2], [5, 6], 12, 13, [19, 21], 26, 27, [28, 31]]),
    ...expand(2025, 8, [[1, 31]]),
    ...expand(2025, 9, [6, 7, [13, 15], [21, 23], 26, 27, 28]),
    ...expand(2025, 10, [1, 2, 4, 5, [11, 13], 18, 19, 25, 26]),
    ...expand(2025, 11, [[1, 3], 8, 9, 15, 16, [22, 24], 29, 30]),
    ...expand(2025, 12, [6, 7, 13, 14, [20, 31]]),
    ...expand(2026, 1, [[1, 4], 5, 6, [10, 12], 17, 18, 23, [24, 25], 31]),
    ...expand(2026, 2, [1, 7, 8, 11, [14, 15], [21, 23], 28]),
    ...expand(2026, 3, [1, 7, 8, 14, 15, [21, 31]]),
];

const SPECIAL_HOLIDAYS = new Set(RAW_HOLIDAYS);
const DATA_END_DATE = new Date('2026-03-31T23:59:59');

export const isHoliday = (date: Date): boolean => {
    // Reset time to avoid timezone issues affecting comparison if not careful, 
    // but we prefer string comparison YYYY-MM-DD
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // Check if within data range
    if (date <= DATA_END_DATE) {
        return SPECIAL_HOLIDAYS.has(dateStr);
    }

    // Fallback Logic
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Sat/Sun
    if (JapaneseHolidays.isHoliday(date)) return true; // National Holiday

    return false;
};
