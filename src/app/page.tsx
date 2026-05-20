"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { optimize, type OptimizationResult } from "@/lib/optimizer";
import type { HumanizerConfig } from "@/lib/humanizer/pipeline";
import { saveEntry } from "@/lib/history";
import { DEFAULT_INPUT } from "@/lib/defaults";
import { SettingsPanel } from "@/components/settings-panel";
import { HistoryPanel } from "@/components/history-panel";
import type { HistoryEntry } from "@/lib/history";

const SETTINGS_KEY = "unbot-settings";

function loadSettings(): HumanizerConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(config: HumanizerConfig): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
}

export default function Home() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isFirstOptimize, setIsFirstOptimize] = useState(true);
  const [config, setConfig] = useState<HumanizerConfig>(loadSettings);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleOptimize = useCallback(() => {
    if (!input.trim()) return;
    const res = optimize(input, config);
    setResult(res);
    setIsFirstOptimize(false);
    saveEntry({
      input: res.original,
      output: res.optimized,
      inputChars: res.originalChars,
      outputChars: res.optimizedChars,
    });
  }, [input, config]);

  const handleCopy = useCallback(async () => {
    if (!result?.optimized) return;
    try {
      await navigator.clipboard.writeText(result.optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 回退：select 方式
      const textarea = document.createElement("textarea");
      textarea.value = result.optimized;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [result]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleOptimize();
    }
  };

  const handleConfigChange = (newConfig: HumanizerConfig) => {
    setConfig(newConfig);
    saveSettings(newConfig);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setInput(entry.input);
    setResult({
      original: entry.input,
      optimized: entry.output,
      originalChars: entry.inputChars,
      optimizedChars: entry.outputChars,
      blocks: [],
    });
    setIsFirstOptimize(false);
  };

  useEffect(() => {
    if (result && previewRef.current) {
      previewRef.current.scrollTo({
        top: previewRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              AI 微信聊天体验引擎
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI Output Runtime · 让 AI 回复像真人聊天
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <HistoryPanel onSelect={handleHistorySelect} />
            <SettingsPanel config={config} onChange={handleConfigChange} />
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono ml-1">
              v0.2
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                原始 AI 输出
              </h2>
              <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-3">
                <span className="text-[10px] opacity-60 hidden sm:inline">Ctrl+Enter</span>
                {input.length} 字
              </span>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="在此粘贴 AI 的原始输出...（Ctrl+Enter 快速优化）"
                className="w-full h-[320px] lg:h-[520px] p-5 text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-0 bg-transparent font-sans"
              />
            </div>
          </section>

          {/* Right: Preview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                微信优化预览
              </h2>
              {result && (
                <span className="text-[11px] text-[#07c160] font-medium tabular-nums">
                  {result.optimizedChars} 字
                  {result.originalChars > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      (-{Math.round((1 - result.optimizedChars / result.originalChars) * 100)}
                      %)
                    </span>
                  )}
                </span>
              )}
            </div>
            <div
              ref={previewRef}
              className="bg-white rounded-xl border border-border shadow-sm h-[320px] lg:h-[520px] overflow-y-auto"
            >
              {result ? (
                <div className="p-6 min-h-full relative flex items-end">
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 z-10 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-sm"
                  >
                    {copied ? "✓ 已复制" : "复制"}
                  </button>
                  <div className="bg-[#95ec69] rounded-2xl rounded-bl-sm px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap break-words">
                      {result.optimized}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isFirstOptimize
                      ? "点击下方按钮，体验优化效果"
                      : "请在左侧输入 AI 内容"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Optimize Button */}
        <div className="flex justify-center my-6">
          <button
            onClick={handleOptimize}
            disabled={!input.trim()}
            className="px-8 py-3 bg-[#07c160] text-white text-sm font-medium rounded-full hover:bg-[#06ad56] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            优化微信体验
          </button>
        </div>

        {/* Stats */}
        {result && (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-border p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-foreground tabular-nums">
                  {result.originalChars}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  原始字数
                </div>
              </div>
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#07c160] tabular-nums">
                  {result.optimizedChars}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  优化后字数
                </div>
              </div>
              <div className="col-span-3 pt-2 border-t border-border mt-2">
                <div className="text-sm text-muted-foreground">
                  共识别{" "}
                  <span className="font-semibold text-foreground">
                    {result.blocks.length}
                  </span>{" "}
                  个语义块 · 压缩比{" "}
                  <span className="font-semibold text-[#07c160]">
                    {result.originalChars > 0
                      ? Math.round(
                          (1 - result.optimizedChars / result.originalChars) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            所有处理在浏览器本地完成，文本不会上传到服务器
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/limeiwang/unbot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
