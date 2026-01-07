import { useState, useEffect } from "react";
import { Settings, Sliders, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { AppSettings, CourseType } from "@/types";

interface SettingsDialogProps {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export function SettingsDialog({ settings, updateSettings }: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Handlers
    const handleThemeChange = (val: "light" | "dark" | "system") => updateSettings({ theme: val });
    const handleFontChange = (val: AppSettings["font"]) => updateSettings({ font: val });
    const handleCourseChange = (val: CourseType) => updateSettings({ course: val });
    const handleProgressToggle = (val: boolean) =>
        updateSettings({ progressBar: { ...settings.progressBar, enabled: val } });
    const handleProgressModeChange = (val: "modeA" | "modeB") =>
        updateSettings({ progressBar: { ...settings.progressBar, mode: val } });

    // Local text state for color input so users can freely type before committing
    const [colorText, setColorText] = useState(settings.progressBar.color);
    useEffect(() => setColorText(settings.progressBar.color), [settings.progressBar.color]);

    const normalizeColor = (v: string) => {
        const raw = v.trim();
        if (!raw) return settings.progressBar.color;
        let val = raw.startsWith("#") ? raw.slice(1) : raw;
        if (/^[0-9a-fA-F]{3}$/.test(val)) {
            val = val
                .split("")
                .map((c) => c + c)
                .join("");
        }
        if (/^[0-9a-fA-F]{6}$/.test(val)) {
            return `#${val.toLowerCase()}`;
        }
        return settings.progressBar.color;
    };

    const handleProgressColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = normalizeColor(e.target.value);
        setColorText(newColor);
        updateSettings({ progressBar: { ...settings.progressBar, color: newColor } });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-4 right-4 z-50 rounded-full bg-background/50 backdrop-blur-sm border shadow-sm hover:bg-background/80 transition-all"
                >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">設定</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px] text-sm">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <Sliders className="w-5 h-5" />
                        設定
                    </SheetTitle>
                    <SheetDescription>アプリの表示や動作をカスタマイズします。</SheetDescription>
                </SheetHeader>

                <div className="grid gap-8 py-6">
                    {/* Theme */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">表示テーマ</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={settings.theme === "light" ? "default" : "outline"}
                                onClick={() => handleThemeChange("light")}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Sun className="w-4 h-4" />
                                <span>ライト</span>
                            </Button>
                            <Button
                                variant={settings.theme === "system" ? "default" : "outline"}
                                onClick={() => handleThemeChange("system")}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Monitor className="w-4 h-4" />
                                <span>システム</span>
                            </Button>
                            <Button
                                variant={settings.theme === "dark" ? "default" : "outline"}
                                onClick={() => handleThemeChange("dark")}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Moon className="w-4 h-4" />
                                <span>ダーク</span>
                            </Button>
                        </div>
                    </div>

                    {/* Font */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">フォント</Label>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    { id: "normal", label: "通常" },
                                    { id: "round", label: "丸ゴシック" },
                                    { id: "shodo", label: "書道" },
                                ] as { id: AppSettings["font"]; label: string }[]
                            ).map((font) => (
                                <Button
                                    key={font.id}
                                    variant={settings.font === font.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleFontChange(font.id)}
                                    className="flex-1"
                                >
                                    {font.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Course */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">登校コース</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.course}
                            onChange={(e) => handleCourseChange(e.target.value as CourseType)}
                        >
                            <option value="WEEK_1">週1コース（木曜）</option>
                            <option value="WEEK_3">週3コース（月・水・金）</option>
                            <option value="WEEK_5">週5コース（月～金）</option>
                        </select>
                    </div>

                    {/* Milliseconds */}
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-ms" className="text-sm font-semibold">
                            ミリ秒表示
                        </Label>
                        <Switch
                            id="show-ms"
                            checked={settings.showMilliseconds}
                            onCheckedChange={(val) => updateSettings({ showMilliseconds: val })}
                        />
                    </div>

                    {/* Timer Font Size */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">タイマー文字サイズ</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((size) => (
                                <Button
                                    key={size}
                                    variant={settings.timerFontSize === size ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        updateSettings({ timerFontSize: size as AppSettings["timerFontSize"] })
                                    }
                                    className="flex-1 h-10 font-mono text-lg"
                                >
                                    {size}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">プログレスバー</Label>
                            <Switch checked={settings.progressBar.enabled} onCheckedChange={handleProgressToggle} />
                        </div>

                        {settings.progressBar.enabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>表示モード</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={settings.progressBar.mode === "modeA" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => handleProgressModeChange("modeA")}
                                            className="text-xs justify-start"
                                        >
                                            積み上げ (0 → 100%)
                                        </Button>
                                        <Button
                                            variant={settings.progressBar.mode === "modeB" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => handleProgressModeChange("modeB")}
                                            className="text-xs justify-start"
                                        >
                                            減少 (100 → 0%)
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>太さ</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={settings.progressBar.thickness === "thin" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() =>
                                                updateSettings({
                                                    progressBar: { ...settings.progressBar, thickness: "thin" },
                                                })
                                            }
                                            className="flex-1 text-xs"
                                        >
                                            細い
                                        </Button>
                                        <Button
                                            variant={
                                                settings.progressBar.thickness === "normal" ? "secondary" : "ghost"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                updateSettings({
                                                    progressBar: { ...settings.progressBar, thickness: "normal" },
                                                })
                                            }
                                            className="flex-1 text-xs"
                                        >
                                            普通
                                        </Button>
                                        <Button
                                            variant={settings.progressBar.thickness === "thick" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() =>
                                                updateSettings({
                                                    progressBar: { ...settings.progressBar, thickness: "thick" },
                                                })
                                            }
                                            className="flex-1 text-xs"
                                        >
                                            太い
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>バーの色</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="color"
                                            value={settings.progressBar.color}
                                            onChange={handleProgressColorChange}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={colorText}
                                            onChange={(e) => setColorText(e.target.value)}
                                            onBlur={() => {
                                                const val = normalizeColor(colorText);
                                                setColorText(val);
                                                updateSettings({
                                                    progressBar: { ...settings.progressBar, color: val },
                                                });
                                            }}
                                            className="text-sm font-mono opacity-70 w-24 text-center bg-transparent border rounded px-2 py-1"
                                            aria-label="バーの色コード"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>バーの幅</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={settings.progressBar.width}
                                            onChange={(e) =>
                                                updateSettings({
                                                    progressBar: {
                                                        ...settings.progressBar,
                                                        width: Number(e.target.value),
                                                    },
                                                })
                                            }
                                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                                        />

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={settings.progressBar.width}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    if (Number.isNaN(v)) return;
                                                    const clamped = Math.max(1, Math.min(100, Math.round(v)));
                                                    updateSettings({
                                                        progressBar: { ...settings.progressBar, width: clamped },
                                                    });
                                                }}
                                                onBlur={(e) => {
                                                    const v = Number(e.target.value);
                                                    const clamped = Number.isNaN(v)
                                                        ? 10
                                                        : Math.max(1, Math.min(100, Math.round(v)));
                                                    updateSettings({
                                                        progressBar: { ...settings.progressBar, width: clamped },
                                                    });
                                                }}
                                                className="w-16 text-sm font-mono text-right bg-transparent border rounded px-2 py-1"
                                            />
                                            <span className="text-sm font-mono opacity-70">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
