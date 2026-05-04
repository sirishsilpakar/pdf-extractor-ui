import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Sliders } from "lucide-react";
import type { ProcessingSettings } from "@/types";
import { useState } from "react";

const toggleOptions: {
  key: keyof ProcessingSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "removeHeader",
    label: "Remove Header",
    description: "Strip header text from pages",
  },
  {
    key: "removeFooter",
    label: "Remove Footer",
    description: "Strip footer text from pages",
  },
  {
    key: "removePageNumbers",
    label: "Remove Page Numbers",
    description: "Remove page number markers",
  },
  {
    key: "removeNumericValues",
    label: "Remove Numeric Values",
    description: "Strip years, amounts, etc.",
  },
];

interface Props {
  settings: ProcessingSettings;
  applyAll: boolean;
  onUpdate: <K extends keyof ProcessingSettings>(
    key: K,
    value: ProcessingSettings[K],
  ) => void;
  onAllUpdate;
}

export function SettingsPanel({
  applyAll,
  settings,
  onUpdate,
  onAllUpdate,
}: Props) {
  return (
    <aside className="w-72 border-l border-border/50 glass flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Sliders className="h-4 w-4 text-accent" />
        <h2 className="font-semibold text-sm">Processing Settings</h2>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {toggleOptions.map((opt) => (
          <div key={opt.key} className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
            <Switch
              checked={settings[opt.key] as boolean}
              onCheckedChange={(v) => onUpdate(opt.key, v)}
              className="shrink-0 mt-0.5"
            />
          </div>
        ))}

        <div className="py-4 border-b border-border/50 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-sm">Advance Settings</h2>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Lemmatization</p>
            <p className="text-xs text-muted-foreground">
              Reduce words to base form
            </p>
          </div>
          <Switch
            checked={settings["enableLemmatization"] as boolean}
            onCheckedChange={(v) => onUpdate("enableLemmatization", v)}
            className="shrink-0 mt-0.5"
          />
        </div>

        <div className="py-4 border-b border-border/50 flex items-center gap-2">
          <Settings className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-sm">Global Settings</h2>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Apply All</p>
            <p className="text-xs text-muted-foreground">
              Enable all settings for Batch
            </p>
          </div>
          <Switch
            checked={applyAll}
            onCheckedChange={(v) => onAllUpdate(v)}
            className="shrink-0 mt-0.5"
          />
        </div>
      </div>
    </aside>
  );
}
