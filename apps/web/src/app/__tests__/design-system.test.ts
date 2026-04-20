import tailwindConfig from '../../../tailwind.config';
import { cn } from '@/lib/utils';

describe('Tailwind Design Tokens', () => {
  const colors = tailwindConfig.theme?.extend?.colors as Record<string, unknown>;
  const fontSize = tailwindConfig.theme?.extend?.fontSize as Record<string, unknown>;
  const spacing = tailwindConfig.theme?.extend?.spacing as Record<string, string>;
  const borderRadius = tailwindConfig.theme?.extend?.borderRadius as Record<string, string>;
  const fontFamily = tailwindConfig.theme?.extend?.fontFamily as Record<string, unknown>;

  describe('AC1 — Couleurs tokens complets', () => {
    it('primary tokens existent', () => {
      const primary = colors.primary as Record<string, string>;
      expect(primary.DEFAULT).toBe('#6366F1');
      expect(primary.dark).toBe('#4F46E5');
      expect(primary.light).toBe('#EEF2FF');
    });

    it('agent tokens existent', () => {
      const agent = colors.agent as Record<string, string>;
      expect(agent.DEFAULT).toBe('#10B981');
      expect(agent.light).toBe('#D1FAE5');
    });

    it('neutral tokens existent', () => {
      expect(colors.background).toBe('#F8FAFC');
      expect(colors.surface).toBe('#FFFFFF');
      expect(colors.border).toBe('#E2E8F0');
      expect(colors['text-primary']).toBe('#0F172A');
      expect(colors['text-secondary']).toBe('#475569');
      expect(colors['text-muted']).toBe('#94A3B8');
    });

    it('5 couleurs statuts commande existent', () => {
      const status = colors.status as Record<string, string>;
      expect(status.pending).toBe('#94A3B8');
      expect(status.confirmed).toBe('#6366F1');
      expect(status.preparing).toBe('#F59E0B');
      expect(status.shipped).toBe('#3B82F6');
      expect(status.delivered).toBe('#10B981');
    });

    it('4 couleurs système existent', () => {
      expect(colors.success).toBe('#10B981');
      expect(colors.warning).toBe('#F59E0B');
      expect(colors.error).toBe('#EF4444');
      expect(colors.info).toBe('#3B82F6');
    });
  });

  describe('AC2 — Échelle typographique', () => {
    const levels = ['heading-xl', 'heading-lg', 'heading-md', 'body-lg', 'body-md', 'body-sm', 'label', 'button'] as const;

    it('8 niveaux typographiques existent', () => {
      levels.forEach((level) => {
        expect(fontSize[level]).toBeDefined();
      });
    });

    it('heading-xl = 24px/700/1.3', () => {
      const [size, opts] = fontSize['heading-xl'] as [string, Record<string, string>];
      expect(size).toBe('24px');
      expect(opts.fontWeight).toBe('700');
      expect(opts.lineHeight).toBe('1.3');
    });

    it('body-md = 14px/400/1.5', () => {
      const [size, opts] = fontSize['body-md'] as [string, Record<string, string>];
      expect(size).toBe('14px');
      expect(opts.fontWeight).toBe('400');
      expect(opts.lineHeight).toBe('1.5');
    });
  });

  describe('AC3 — Échelle d\'espacement 4px-base', () => {
    it('7 tokens espacement existent', () => {
      expect(spacing['space-1']).toBe('4px');
      expect(spacing['space-2']).toBe('8px');
      expect(spacing['space-3']).toBe('12px');
      expect(spacing['space-4']).toBe('16px');
      expect(spacing['space-5']).toBe('20px');
      expect(spacing['space-6']).toBe('24px');
      expect(spacing['space-8']).toBe('32px');
    });
  });

  describe('AC3 — Border radius tokens', () => {
    it('tokens borderRadius existent', () => {
      expect(borderRadius.btn).toBe('8px');
      expect(borderRadius.card).toBe('12px');
      expect(borderRadius.badge).toBe('9999px');
      expect(borderRadius.modal).toBe('16px');
    });
  });

  describe('AC5 — Font family Inter', () => {
    it('fontFamily.sans pointe vers var(--font-inter)', () => {
      const sans = fontFamily.sans as string[];
      expect(sans[0]).toBe('var(--font-inter)');
    });
  });
});

describe('cn() — Fusion classes Tailwind', () => {
  it('fusionne des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('résout les conflits Tailwind (dernière classe gagne)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('ignore les valeurs falsy', () => {
    expect(cn('foo', false && 'bar', undefined, null, '')).toBe('foo');
  });

  it('gère les objets conditionnels', () => {
    expect(cn({ 'text-bold': true, 'text-italic': false })).toBe('text-bold');
  });
});
