import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Palette principale Whatsell ───────────────────────────
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: '#EEF2FF',
        },
        agent: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        // ── Neutrals ─────────────────────────────────────────────
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
        // ── Statuts commande (5 états) ────────────────────────────
        status: {
          pending: '#94A3B8',   // En attente — gris ardoise
          confirmed: '#6366F1', // Confirmée — indigo
          preparing: '#F59E0B', // En préparation — ambre
          shipped: '#3B82F6',   // Expédiée — bleu royal
          delivered: '#10B981', // Livrée — émeraude
        },
        // ── États système ─────────────────────────────────────────
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // ── Tokens shadcn/ui (résolus via variables CSS HSL) ──────
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // ── Typographie Inter — 8 niveaux ─────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        'heading-xl': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-lg': ['20px', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.3', fontWeight: '500' }],
        button: ['15px', { lineHeight: '1', fontWeight: '500' }],
      },
      // ── Espacement 4px-base ───────────────────────────────────
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
      },
      // ── Border radius ─────────────────────────────────────────
      borderRadius: {
        btn: '8px',
        card: '12px',
        badge: '9999px',
        modal: '16px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
