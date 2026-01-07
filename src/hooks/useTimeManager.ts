import { useState, useEffect } from "react";
import { getCurrentStatus, type CurrentStatus } from "@/lib/school-logic";
import type { CourseType } from "@/types";

export const useTimeManager = (course: CourseType) => {
    const [now, setNow] = useState(new Date());
    const [status, setStatus] = useState<CurrentStatus>(getCurrentStatus(new Date(), course));

    useEffect(() => {
        let animationFrameId: number;

        const tick = () => {
            const d = new Date();
            setNow(d);
            setStatus(getCurrentStatus(d, course));
            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrameId);
    }, [course]);

    return {
        now,
        status,
    };
};
