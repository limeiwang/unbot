"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AI_PHRASE_CATEGORIES } from "@/lib/humanizer/categories";
import type { HumanizerConfig } from "@/lib/humanizer/pipeline";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  config: HumanizerConfig;
  onChange: (config: HumanizerConfig) => void;
}

export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const toggles = config.enabledCategories ?? {};

  const handleToggle = (categoryId: string, enabled: boolean) => {
    onChange({
      ...config,
      enabledCategories: { ...toggles, [categoryId]: enabled },
    });
  };

  const handleReset = () => {
    onChange({});
  };

  return (
    <Sheet>
      <SheetTrigger className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
        <Settings className="w-4 h-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-base">优化设置</SheetTitle>
          <p className="text-xs text-muted-foreground font-normal">
            选择要去除的 AI 套话类型
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1 pb-6">
          <div className="space-y-1">
            {AI_PHRASE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={cat.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {cat.name}
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <Switch
                  id={cat.id}
                  checked={toggles[cat.id] !== false}
                  onCheckedChange={(checked) => handleToggle(cat.id, checked)}
                  className="ml-3 shrink-0"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 px-3">
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              恢复默认设置
            </button>
          </div>

          {/* Shorten config */}
          <div className="mt-8 border-t border-border pt-6 px-3 space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              高级
            </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="maxChars" className="text-sm">
              每段最大字数
            </Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    shortener: {
                      ...config.shortener,
                      maxCharsPerSegment: Math.max(
                        15,
                        (config.shortener?.maxCharsPerSegment ?? 35) - 5
                      ),
                    },
                  })
                }
                className="w-6 h-6 rounded bg-muted text-xs text-muted-foreground hover:text-foreground"
              >
                -
              </button>
              <span className="text-sm font-mono w-8 text-center tabular-nums">
                {config.shortener?.maxCharsPerSegment ?? 35}
              </span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    shortener: {
                      ...config.shortener,
                      maxCharsPerSegment: Math.min(
                        80,
                        (config.shortener?.maxCharsPerSegment ?? 35) + 5
                      ),
                    },
                  })
                }
                className="w-6 h-6 rounded bg-muted text-xs text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="maxLines" className="text-sm">
              每段最多行数
            </Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    shortener: {
                      ...config.shortener,
                      maxLines: Math.max(
                        1,
                        (config.shortener?.maxLines ?? 3) - 1
                      ),
                    },
                  })
                }
                className="w-6 h-6 rounded bg-muted text-xs text-muted-foreground hover:text-foreground"
              >
                -
              </button>
              <span className="text-sm font-mono w-8 text-center tabular-nums">
                {config.shortener?.maxLines ?? 3}
              </span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    shortener: {
                      ...config.shortener,
                      maxLines: Math.min(
                        10,
                        (config.shortener?.maxLines ?? 3) + 1
                      ),
                    },
                  })
                }
                className="w-6 h-6 rounded bg-muted text-xs text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
