"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History, Trash2 } from "lucide-react";
import { loadHistory, clearHistory, type HistoryEntry } from "@/lib/history";

interface HistoryPanelProps {
  onSelect: (entry: HistoryEntry) => void;
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function EntryRow({
  entry,
  onSelect,
}: {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
}) {
  const preview =
    entry.input.length > 50
      ? entry.input.slice(0, 50) + "…"
      : entry.input;

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
          {formatTime(entry.timestamp)}
        </span>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {entry.inputChars} → {entry.outputChars} 字
        </span>
      </div>
      <p className="text-sm text-foreground mt-1 leading-relaxed line-clamp-2">
        {preview}
      </p>
    </button>
  );
}

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) setEntries(loadHistory());
  }, [open]);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
        <History className="w-4 h-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-base">历史记录</SheetTitle>
            {entries.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清空
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              暂无优化记录
            </p>
          ) : (
            entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
