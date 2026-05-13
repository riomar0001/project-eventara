import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border, oklch(0.86 0.01 150))',
        background: 'var(--background, oklch(1 0 0))',
        foreground: 'var(--foreground, oklch(0.145 0 0))',
        primary: {
          DEFAULT: 'var(--primary, oklch(0.841 0.238 128.85))',
          foreground: 'var(--primary-foreground, oklch(0.405 0.101 131.063))'
        },
        secondary: {
          DEFAULT: 'var(--secondary, oklch(0.967 0.001 286.375))',
          foreground: 'var(--secondary-foreground, oklch(0.21 0.006 285.885))'
        },
        destructive: {
          DEFAULT: 'var(--destructive, oklch(0.7 0.2 25))',
          foreground: 'var(--destructive-foreground, #fff)'
        },
        muted: {
          DEFAULT: 'var(--muted, oklch(0.97 0 0))',
          foreground: 'var(--muted-foreground, oklch(0.556 0 0))'
        },
        accent: {
          DEFAULT: 'var(--accent, oklch(0.7 0.2 130))',
          foreground: 'var(--accent-foreground, oklch(1 0 0))'
        },
        popover: {
          DEFAULT: 'var(--popover, oklch(1 0 0))',
          foreground: 'var(--popover-foreground, oklch(0.145 0 0))'
        },
        card: {
          DEFAULT: 'var(--card, oklch(1 0 0))',
          foreground: 'var(--card-foreground, oklch(0.145 0 0))'
        },
        input: 'var(--input, oklch(0.9 0 0))',
        ring: 'var(--ring, oklch(0.841 0.238 128.85))'
      },
      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) * 0.8)',
        sm: 'calc(var(--radius, 0.5rem) * 0.6)'
      }
    }
  },
  plugins: []
};

export default config;
