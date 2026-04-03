import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Sliders } from 'lucide-react';
import type { ProcessingSettings } from '@/types';
import { useState } from 'react';

const toggleOptions: { key: keyof ProcessingSettings; label: string; description: string }[] = [
  { key: 'removeHeader', label: 'Remove Header', description: 'Strip header text from pages' },
  { key: 'removeFooter', label: 'Remove Footer', description: 'Strip footer text from pages' },
  { key: 'removePageNumbers', label: 'Remove Page Numbers', description: 'Remove page number markers' },
  { key: 'removeNumericValues', label: 'Remove Numeric Values', description: 'Strip years, amounts, etc.' },
  { key: 'enableLemmatization', label: 'Enable Lemmatization', description: 'Reduce words to base form' },
];

interface Props {
  settings: ProcessingSettings;
  onUpdate: <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => void;
}

export function SettingsPanel({ settings, onUpdate }: Props) {
  const [presetName, setPresetName] = useState('');

  return (
    <aside className="w-72 border-l border-border/50 glass flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Sliders className="h-4 w-4 text-accent" />
        <h2 className="font-semibold text-sm">Processing Settings</h2>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {toggleOptions.map(opt => (
          <div key={opt.key} className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
            <Switch
              checked={settings[opt.key] as boolean}
              onCheckedChange={v => onUpdate(opt.key, v)}
              className="shrink-0 mt-0.5"
            />
          </div>
        ))}

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Apply to All Files</p>
              <p className="text-xs text-muted-foreground">Use same settings for batch</p>
            </div>
            <Switch
              checked={settings.applyToAll}
              onCheckedChange={v => onUpdate('applyToAll', v)}
              className="shrink-0 mt-0.5"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-sm font-medium">Save Preset</p>
          <Input
            placeholder="Preset name..."
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            className="rounded-xl text-sm h-9"
          />
          <Button variant="outline" size="sm" className="w-full rounded-xl gap-1.5 text-xs" disabled={!presetName}>
            <Save className="h-3.5 w-3.5" /> Save Preset
          </Button>
        </div>
      </div>
    </aside>
  );
}
