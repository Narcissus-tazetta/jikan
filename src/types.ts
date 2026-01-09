export type PeriodType = "CLASS" | "BREAK" | "BEFORE_SCHOOL" | "AFTER_SCHOOL" | "HOLIDAY";

export interface TimeSlot {
    start: string; // HH:mm
    end: string; // HH:mm
    name: string;
    type: PeriodType;
}

export type CourseType = "WEEK_1" | "WEEK_3" | "WEEK_5";

export interface AppSettings {
    theme: "light" | "dark" | "system";
    font: "normal" | "round" | "shodo";
    course: CourseType;
    showMilliseconds: boolean;
    tabTitleCountdownEnabled: boolean;
    dateDisplay: {
        enabled: boolean;
        yearFormat: "gregorian" | "reiwa";
        dateFormat: "slash" | "kanji";
        weekdayFormat: "en" | "ja";
    };
    currentTimeDisplay: {
        enabled: boolean;
        showHundredths: boolean;
    };
    progressBar: {
        enabled: boolean;
        color: string;
        mode: "modeA" | "modeB";
        thickness: "thin" | "normal" | "thick";
        width: number; // 1-100 percentage
    };
    timerFontSize: 1 | 2 | 3 | 4 | 5;
}
