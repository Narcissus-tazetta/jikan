import { useState, useEffect, useRef } from "react";
import { Settings, Sliders, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { AppSettings, CourseType } from "@/types";
import { putBackgroundBlob, getBackgroundBlob, deleteBackgroundBlob } from "@/lib/background-idb";

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

    const [bgUrlText, setBgUrlText] = useState(settings.backgroundUrl);
    useEffect(() => setBgUrlText(settings.backgroundUrl), [settings.backgroundUrl]);

    const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
    const [bgError, setBgError] = useState<string | null>(null);
    const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isAllowedImageUrl = (v: string) => {
        const raw = v.trim();
        if (!raw) return false;
        if (raw.startsWith("data:image/")) return true;
        try {
            const url = new URL(raw);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch {
            return false;
        }
    };

    const applyBackgroundUrl = () => {
        const raw = bgUrlText.trim();
        if (!raw) {
            setBgError(null);
            updateSettings({ backgroundUrl: "" });
            return;
        }
        if (!isAllowedImageUrl(raw)) {
            setBgError("URLが無効です（http(s) または data:image/* のみ）");
            return;
        }
        setBgError(null);
        updateSettings({ backgroundUrl: raw, backgroundSource: "url" });
    };

    const handleBackgroundFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setBgError("画像ファイルを選択してください");
            return;
        }

        // 10MB: Safari等のクォータで事故りにくい上限
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            setBgError("画像が大きすぎます（最大10MB）");
            return;
        }

        setBgError(null);

        const uuid =
            typeof crypto !== "undefined"
                ? (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
                  Math.random().toString(16).slice(2)
                : Math.random().toString(16).slice(2);
        const newKey = `bg-${Date.now()}-${uuid}`;

        try {
            if (settings.backgroundIdbKey) {
                // best-effort cleanup to avoid orphaned blobs
                await deleteBackgroundBlob(settings.backgroundIdbKey);
            }
            await putBackgroundBlob(newKey, file);

            updateSettings({
                backgroundEnabled: true,
                backgroundSource: "file",
                backgroundIdbKey: newKey,
            });
        } catch (err) {
            console.error(err);
            setBgError("画像の保存に失敗しました（ブラウザの保存容量が不足している可能性があります）");
        }
    };

    const handleBackgroundDelete = async () => {
        setBgError(null);
        try {
            if (settings.backgroundIdbKey) {
                await deleteBackgroundBlob(settings.backgroundIdbKey);
            }
        } catch (err) {
            console.error(err);
        } finally {
            updateSettings({
                backgroundEnabled: false,
                backgroundUrl: "",
                backgroundIdbKey: null,
                backgroundSource: "url",
            });
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        let disposed = false;
        let objectUrl: string | null = null;

        const run = async () => {
            setBgError(null);

            if (!settings.backgroundEnabled) {
                setBgPreviewUrl(null);
                return;
            }

            if (settings.backgroundSource === "url") {
                const raw = settings.backgroundUrl.trim();
                setBgPreviewUrl(raw && isAllowedImageUrl(raw) ? raw : null);
                return;
            }

            const key = settings.backgroundIdbKey;
            if (!key) {
                setBgPreviewUrl(null);
                return;
            }

            try {
                const blob = await getBackgroundBlob(key);
                if (disposed) return;
                if (!blob) {
                    setBgPreviewUrl(null);
                    return;
                }
                objectUrl = URL.createObjectURL(blob);
                setBgPreviewUrl(objectUrl);
            } catch (err) {
                console.error(err);
                setBgPreviewUrl(null);
                setBgError("背景画像の読み込みに失敗しました");
            }
        };

        run();

        return () => {
            disposed = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [
        isOpen,
        settings.backgroundEnabled,
        settings.backgroundSource,
        settings.backgroundUrl,
        settings.backgroundIdbKey,
    ]);

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

                    {/* Tab Title */}
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="tab-title-countdown" className="text-sm font-semibold">
                            タブ名を残り時間にする
                        </Label>
                        <Switch
                            id="tab-title-countdown"
                            checked={settings.tabTitleCountdownEnabled}
                            onCheckedChange={(val) => updateSettings({ tabTitleCountdownEnabled: val })}
                        />
                    </div>

                    {/* Date Display */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="date-display" className="text-sm font-semibold">
                                日付表示（例: 2026/01/09 (Fri)）
                            </Label>
                            <Switch
                                id="date-display"
                                checked={settings.dateDisplay.enabled}
                                onCheckedChange={(val) =>
                                    updateSettings({ dateDisplay: { ...settings.dateDisplay, enabled: val } })
                                }
                            />
                        </div>

                        {settings.dateDisplay.enabled && (
                            <div className="space-y-3 pl-0">
                                <div className="space-y-2">
                                    <Label className="text-sm">年号</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={settings.dateDisplay.yearFormat}
                                        onChange={(e) =>
                                            updateSettings({
                                                dateDisplay: {
                                                    ...settings.dateDisplay,
                                                    yearFormat: e.target
                                                        .value as AppSettings["dateDisplay"]["yearFormat"],
                                                },
                                            })
                                        }
                                    >
                                        <option value="gregorian">西暦 </option>
                                        <option value="reiwa">令和 </option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">日付の表記</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={settings.dateDisplay.dateFormat}
                                        onChange={(e) =>
                                            updateSettings({
                                                dateDisplay: {
                                                    ...settings.dateDisplay,
                                                    dateFormat: e.target
                                                        .value as AppSettings["dateDisplay"]["dateFormat"],
                                                },
                                            })
                                        }
                                    >
                                        <option value="slash">YYYY/MM/DD</option>
                                        <option value="kanji">YYYY年MM月DD日</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">曜日</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={settings.dateDisplay.weekdayFormat}
                                        onChange={(e) =>
                                            updateSettings({
                                                dateDisplay: {
                                                    ...settings.dateDisplay,
                                                    weekdayFormat: e.target
                                                        .value as AppSettings["dateDisplay"]["weekdayFormat"],
                                                },
                                            })
                                        }
                                    >
                                        <option value="en">英語</option>
                                        <option value="ja">日本語</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Time */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="current-time" className="text-sm font-semibold">
                                現在時刻を表示
                            </Label>
                            <Switch
                                id="current-time"
                                checked={settings.currentTimeDisplay.enabled}
                                onCheckedChange={(val) =>
                                    updateSettings({
                                        currentTimeDisplay: { ...settings.currentTimeDisplay, enabled: val },
                                    })
                                }
                            />
                        </div>

                        {settings.currentTimeDisplay.enabled && (
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="current-time-hundredths" className="text-sm font-semibold">
                                    .00 まで表示
                                </Label>
                                <Switch
                                    id="current-time-hundredths"
                                    checked={settings.currentTimeDisplay.showHundredths}
                                    onCheckedChange={(val) =>
                                        updateSettings({
                                            currentTimeDisplay: {
                                                ...settings.currentTimeDisplay,
                                                showHundredths: val,
                                            },
                                        })
                                    }
                                />
                            </div>
                        )}
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

                    {/* Background */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">背景画像</Label>
                            <Switch
                                checked={settings.backgroundEnabled}
                                onCheckedChange={(val) => updateSettings({ backgroundEnabled: val })}
                            />
                        </div>

                        {settings.backgroundEnabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">背景をぼかす</Label>
                                    <Switch
                                        checked={settings.backgroundBlurEnabled}
                                        onCheckedChange={(val) => updateSettings({ backgroundBlurEnabled: val })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>取得元</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={settings.backgroundSource === "url" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => updateSettings({ backgroundSource: "url" })}
                                            className="text-xs justify-start"
                                        >
                                            公開URL
                                        </Button>
                                        <Button
                                            variant={settings.backgroundSource === "file" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => updateSettings({ backgroundSource: "file" })}
                                            className="text-xs justify-start"
                                        >
                                            PCから選択
                                        </Button>
                                    </div>
                                </div>

                                {settings.backgroundSource === "url" ? (
                                    <div className="space-y-2">
                                        <Label>画像URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="url"
                                                placeholder="https://example.com/bg.jpg"
                                                value={bgUrlText}
                                                onChange={(e) => setBgUrlText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") applyBackgroundUrl();
                                                }}
                                            />
                                            <Button type="button" variant="secondary" onClick={applyBackgroundUrl}>
                                                適用
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            http(s) または data:image/* を指定できます。
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>画像ファイル</Label>

                                        <div className="relative">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    handleBackgroundFilePick(e);
                                                    const f = e.target.files?.[0];
                                                    setSelectedFilename(f ? f.name : null);
                                                }}
                                                className="sr-only"
                                                aria-label="背景画像ファイル"
                                            />

                                            <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3">
                                                <div className="flex-1 flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 rounded-md bg-muted/70 text-foreground hover:bg-muted/80"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        ファイルを選択
                                                    </button>
                                                </div>
                                                <div className="pl-4">
                                                    <span className="text-sm opacity-70">
                                                        {selectedFilename ?? "選択されていません"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground mt-2">
                                                ローカル画像はブラウザ内に保存されます（最大10MB）。
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bgError && <p className="text-xs text-destructive">{bgError}</p>}

                                {bgPreviewUrl && (
                                    <div className="space-y-2">
                                        <Label>プレビュー</Label>
                                        <div
                                            className="h-28 w-full rounded-md border border-border/70 bg-muted/40"
                                            style={{
                                                backgroundImage: `url(${JSON.stringify(bgPreviewUrl)})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                backgroundRepeat: "no-repeat",
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button type="button" variant="destructive" onClick={handleBackgroundDelete}>
                                        背景を削除
                                    </Button>
                                </div>
                            </div>
                        )}
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
