interface Props {
    label: string;
    date: Date;
}

export function NextSchoolDayCard({ label, date }: Props) {
    return (
        <div className="bg-background rounded-none p-6 border border-foreground/10">
            <div className="text-lg font-light tracking-wider text-muted-foreground mb-3 uppercase">次の登校日</div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground pb-2">{label}</div>
            <div className="text-base text-muted-foreground mt-3 font-mono">
                {date.toLocaleDateString("ja-JP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
        </div>
    );
}
