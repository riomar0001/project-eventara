'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_PRESETS = [
  {
    name: 'Default',
    lime: 'oklch(0.9 0.22 128)',
    amber: 'oklch(0.82 0.17 75)'
  },
  {
    name: 'Chill',
    lime: 'oklch(0.85 0.18 200)',
    amber: 'oklch(0.75 0.15 250)'
  },
  {
    name: 'Fire',
    lime: 'oklch(0.88 0.22 25)',
    amber: 'oklch(0.80 0.20 45)'
  },
  {
    name: 'Lavender',
    lime: 'oklch(0.82 0.18 290)',
    amber: 'oklch(0.75 0.15 320)'
  }
];

export function TweaksPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(0);

  const applyTheme = (themeIndex: number) => {
    const theme = THEME_PRESETS[themeIndex];
    document.documentElement.style.setProperty('--lime', theme.lime);
    document.documentElement.style.setProperty('--amber', theme.amber);
    setCurrentTheme(themeIndex);
  };

  return (
    <div className="fixed right-8 bottom-8 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-lg transition-all hover:border-[var(--lime)] hover:shadow-[0_0_24px_-6px_var(--lime-glow)]"
      >
        <Settings className="h-5 w-5 text-[var(--lime)]" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 bottom-16 w-56 space-y-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-lg">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
            Theme Presets
          </h4>

          <div className="space-y-2">
            {THEME_PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyTheme(index)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
                  currentTheme === index ? 'bg-[var(--lime)] text-[#0a1005]' : 'border border-[var(--line-soft)] text-[var(--text)] hover:border-[var(--lime)]'
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--line-soft)] pt-3 text-xs text-[var(--text-mute)]">Click to change theme colors. Refresh to reset.</div>
        </div>
      )}
    </div>
  );
}
