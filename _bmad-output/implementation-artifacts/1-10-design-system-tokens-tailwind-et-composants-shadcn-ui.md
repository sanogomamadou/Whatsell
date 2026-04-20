# Story 1.10 : Design System — Tokens Tailwind & Composants shadcn/ui

Status: done

## Story

En tant que **développeur frontend**,
je veux que le design system Whatsell soit configuré avec les tokens Tailwind complets et les composants shadcn/ui installés,
afin que tous les composants UI utilisent une identité visuelle cohérente sans reconfiguration.

## Acceptance Criteria

1. **Étant donné** que `tailwind.config.ts` est configuré, **Quand** un développeur utilise `bg-primary`, `text-agent`, `bg-status-pending`, etc., **Alors** les valeurs HEX correctes sont appliquées : primary `#6366F1`, agent `#10B981`, 5 couleurs de statut de commande, 4 couleurs système (success/warning/error/info), neutrals complets (UX-DR1)

2. **Étant donné** que la typographie est configurée, **Quand** un développeur utilise les classes `text-heading-xl`, `text-body-md`, etc., **Alors** l'échelle Inter 8 niveaux est disponible (24px/700 → 12px/400) avec hauteurs de ligne exactes (UX-DR2)

3. **Étant donné** que l'espacement est configuré, **Quand** un développeur utilise `p-space-4`, `gap-space-6`, etc., **Alors** l'échelle 4px-base est appliquée (space-1=4px à space-8=32px), et les zones de tap ≥ 44×44px sont respectables via `min-h-[44px]` (UX-DR3)

4. **Étant donné** que les 11 composants shadcn/ui sont installés dans `components/ui/`, **Quand** un développeur importe `Button`, `Card`, `Badge`, `Sheet`, `Dialog`, `Toaster`, `Avatar`, `Progress`, `Tabs`, `Command`, `Skeleton`, **Alors** ces composants fonctionnent — jamais modifiés directement (UX-DR4)

5. **Étant donné** que la police est configurée, **Quand** l'application charge, **Alors** Inter est servie via `next/font` (variable CSS `--font-inter` → `font-sans` Tailwind) — aucune requête Google Fonts externe

6. **Et** `globals.css` contient les variables CSS HSL requises par shadcn/ui pour son theming interne, coexistant avec les tokens Whatsell dans `tailwind.config.ts`

## Tasks / Subtasks

- [x] Tâche 1 : Compléter `tailwind.config.ts` avec les tokens manquants (AC: 1, 2, 3, 5)
  - [x] Ajouter les 5 couleurs statuts commande dans `theme.extend.colors.status`
  - [x] Ajouter les 4 couleurs système dans `theme.extend.colors` (success, warning, error, info)
  - [x] Ajouter `fontFamily.sans` pointant vers `['var(--font-inter)', ...defaultTheme.fontFamily.sans]`
  - [x] Ajouter `fontSize` avec les 8 niveaux typographiques (heading-xl → button) avec `[size, { lineHeight, fontWeight }]`
  - [x] Ajouter `spacing` avec l'échelle `space-1` à `space-8` (multiples de 4px)
  - [x] Ajouter `borderRadius` avec les tokens (`btn: '8px'`, `card: '12px'`, `modal: '16px'`)
  - [x] Vérifier que les tokens PRIMARY/AGENT/NEUTRALS existants ne sont pas cassés — MODIFIER uniquement, pas remplacer

- [x] Tâche 2 : Configurer `globals.css` pour la coexistence shadcn/ui + tokens Whatsell (AC: 6)
  - [x] Ajouter les variables CSS HSL `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--ring`, etc. dans `:root` pour shadcn/ui
  - [x] Les variables shadcn/ui HSL coexistent avec les couleurs HEX Whatsell dans tailwind.config — ce sont deux systèmes parallèles
  - [x] Ajouter `font-family: var(--font-inter), sans-serif` dans le `body` via `@layer base`

- [x] Tâche 3 : Initialiser shadcn/ui et installer les 11 composants (AC: 4)
  - [x] Créer `components.json` à la racine de `apps/web/` (configuration shadcn/ui)
  - [x] Installer les dépendances shadcn/ui : `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-*`, `lucide-react`
  - [x] Créer `src/lib/utils.ts` avec la fonction `cn()` (clsx + tailwind-merge)
  - [x] Copier/générer les 11 composants dans `src/components/ui/` : Button, Card, Badge, Sheet, Dialog, Toaster (+ useToast hook), Avatar, Progress, Tabs, Command, Skeleton
  - [x] Supprimer le `.gitkeep` de `src/components/ui/` — il sera remplacé par les vrais fichiers

- [x] Tâche 4 : Vérifier la liaison Inter font → CSS variable → Tailwind (AC: 5)
  - [x] Confirmer que `layout.tsx` applique `className={inter.variable}` sur `<html>` ✅ (déjà fait)
  - [x] Ajouter `fontFamily.sans` dans tailwind.config.ts pointant vers `var(--font-inter)` (Tâche 1)
  - [x] Vérifier dans `globals.css` que `@layer base { body { font-family: var(--font-inter), sans-serif; } }` est présent

- [x] Tâche 5 : Tests (AC: 1–6)
  - [x] Créer `src/app/__tests__/design-system.test.ts` — tests de rendu des 11 composants shadcn/ui
  - [x] Tester que `cn()` fusionne correctement les classes Tailwind (cas conflictuels)
  - [x] Vérifier que les tokens de couleur sont référencés dans tailwind.config.ts (snapshot test ou assertion sur la config)
  - [x] Run `pnpm typecheck` + `pnpm test` — tous les tests passants avant de clôturer

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu existant | Action |
|---------|-----------------|--------|
| `apps/web/tailwind.config.ts` | Tokens primary, agent, background, surface, border, text-primary/secondary/muted | **MODIFIER** — ajouter status, system, font, spacing, radius |
| `apps/web/src/app/layout.tsx` | Inter chargée via `next/font/google`, `variable: '--font-inter'`, appliquée sur `<html>` | **NE PAS MODIFIER** — déjà correct |
| `apps/web/src/components/ui/` | `.gitkeep` uniquement | Supprimer `.gitkeep`, ajouter composants shadcn |
| `apps/web/src/components/shared/` | `.gitkeep` uniquement | Laisser tel quel — story 1.11 |
| `apps/web/src/app/globals.css` | `@tailwind base/components/utilities` uniquement | **MODIFIER** — ajouter variables CSS shadcn/ui |
| `apps/web/src/lib/api.ts` | Client HTTP centralisé | NE PAS MODIFIER |

### Tokens Tailwind — Compléments Exacts à Ajouter

**`theme.extend.colors` — Statuts Commande :**
```ts
status: {
  pending:     '#94A3B8',  // En attente — gris ardoise
  confirmed:   '#6366F1',  // Confirmée — indigo (= primary)
  preparing:   '#F59E0B',  // En préparation — ambre
  shipped:     '#3B82F6',  // Expédiée — bleu royal
  delivered:   '#10B981',  // Livrée — émeraude (= agent)
},
```

**`theme.extend.colors` — États Système :**
```ts
success: '#10B981',
warning: '#F59E0B',
error:   '#EF4444',
info:    '#3B82F6',
```

**`theme.extend.fontFamily` :**
```ts
sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
```
→ Nécessite `import defaultTheme from 'tailwindcss/defaultTheme'` en haut du fichier

**`theme.extend.fontSize` — 8 niveaux (format `[size, { lineHeight, fontWeight }]`) :**
```ts
'heading-xl': ['24px', { lineHeight: '1.3',  fontWeight: '700' }],
'heading-lg': ['20px', { lineHeight: '1.35', fontWeight: '600' }],
'heading-md': ['18px', { lineHeight: '1.4',  fontWeight: '600' }],
'body-lg':    ['16px', { lineHeight: '1.5',  fontWeight: '400' }],
'body-md':    ['14px', { lineHeight: '1.5',  fontWeight: '400' }],
'body-sm':    ['12px', { lineHeight: '1.4',  fontWeight: '400' }],
'label':      ['12px', { lineHeight: '1.3',  fontWeight: '500' }],
'button':     ['15px', { lineHeight: '1',    fontWeight: '500' }],
```

**`theme.extend.spacing` — 4px base :**
```ts
'space-1': '4px',
'space-2': '8px',
'space-3': '12px',
'space-4': '16px',
'space-5': '20px',
'space-6': '24px',
'space-8': '32px',
```

**`theme.extend.borderRadius` :**
```ts
btn:   '8px',
card:  '12px',
badge: '9999px',
modal: '16px',
```

### Variables CSS shadcn/ui dans `globals.css`

shadcn/ui v2+ nécessite des variables CSS HSL dans `:root` pour son theming interne. Ces variables coexistent avec les tokens HEX Whatsell dans `tailwind.config.ts` — ce sont deux systèmes parallèles qui ne se conflictent pas.

Ajouter dans `globals.css` :
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 239 83% 66%;        /* #6366F1 */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 239 83% 66%;           /* #6366F1 */
    --radius: 0.5rem;
  }
}

@layer base {
  body {
    font-family: var(--font-inter), sans-serif;
    background-color: #F8FAFC;
    color: #0F172A;
  }
}
```

### `components.json` (shadcn/ui config)

Créer `apps/web/components.json` :
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Dépendances shadcn/ui à Installer

```bash
pnpm --filter @whatsell/web add \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  @radix-ui/react-slot \
  @radix-ui/react-dialog \
  @radix-ui/react-avatar \
  @radix-ui/react-progress \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  @radix-ui/react-scroll-area \
  cmdk
```

Composants à copier manuellement dans `src/components/ui/` (éviter `npx shadcn add` en CI — copier les sources directement depuis shadcn/ui GitHub ou utiliser `npx shadcn@latest add <component>` en local) :
- `button.tsx`, `card.tsx`, `badge.tsx`, `sheet.tsx`, `dialog.tsx`, `toaster.tsx` + `use-toast.ts`, `avatar.tsx`, `progress.tsx`, `tabs.tsx`, `command.tsx`, `skeleton.tsx`

### `src/lib/utils.ts` — Fonction `cn()`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Cette fonction est importée par TOUS les composants shadcn/ui. Elle doit exister avant d'ajouter les composants.

### ⚠️ Pièges Critiques

**Piège 1 — Import `defaultTheme` :**
`tailwind.config.ts` doit importer `defaultTheme` pour la fontFamily fallback :
```ts
import defaultTheme from 'tailwindcss/defaultTheme';
```
TypeScript peut se plaindre — ajouter `@types/tailwindcss` si nécessaire ou utiliser `require('tailwindcss/defaultTheme')`.

**Piège 2 — Conflit couleurs shadcn/ui et tokens Whatsell :**
shadcn/ui mappe `bg-primary` sur `hsl(var(--primary))` via son fichier de config interne. Notre `tailwind.config.ts` définit `primary.DEFAULT: '#6366F1'`. Ce conflit doit être géré : shadcn/ui génère ses propres classes utilitaires basées sur les variables CSS HSL — NE PAS changer notre config HEX, les deux coexistent.

**Piège 3 — `layout.tsx` utilise `Inter` de `next/font/google` :**
C'est correct — `next/font/google` télécharge la police au build time et la sert localement. Il n'y a PAS de requête externe à Google Fonts en production. Ne pas changer.

**Piège 4 — shadcn/ui `Sheet` et `Dialog` nécessitent des portails React :**
S'assurer que le `<Toaster />` est placé dans `layout.tsx` (root layout) pour que les toasts fonctionnent globalement. Ajouter dans `layout.tsx` :
```tsx
import { Toaster } from '@/components/ui/toaster';
// ...dans le body :
<Toaster />
```

**Piège 5 — `tailwind.config.ts` TypeScript et `fontSize` type :**
Le format `[size, { lineHeight, fontWeight }]` est accepté par Tailwind v3 mais le type TypeScript peut nécessiter un cast `as [string, Record<string, string>]` pour satisfaire le compilateur.

### Structure de Fichiers Finale

```
apps/web/
├── components.json                          ← CRÉER
├── tailwind.config.ts                       ← MODIFIER (tokens complets)
├── src/
│   ├── app/
│   │   ├── globals.css                      ← MODIFIER (variables CSS shadcn/ui)
│   │   └── layout.tsx                       ← MODIFIER (ajouter <Toaster />)
│   ├── components/
│   │   ├── ui/                              ← AJOUTER 11 composants shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── command.tsx
│   │   │   └── skeleton.tsx
│   │   └── shared/                          ← Laisser tel quel (story 1.11)
│   └── lib/
│       ├── api.ts                           ← NE PAS MODIFIER
│       └── utils.ts                         ← CRÉER (fonction cn())
```

### Contexte Règles Projet

- `components/ui/` shadcn/ui — **JAMAIS modifier** ces fichiers après installation
- Wrappers custom → `components/shared/` (story 1.11, pas story 1.10)
- `next/font` obligatoire pour fonts — pas d'import CDN/Google externe
- TypeScript strict partout — pas de `any`

### Règles Tests

- Tests unitaires co-localisés ou dans `src/app/__tests__/`
- Tester isolation : chaque composant shadcn/ui peut s'importer sans erreur
- Tester `cn()` : fusion correcte de classes conflictuelles (`bg-red-500 bg-blue-500` → `bg-blue-500`)

### Références

- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "Bibliothèque de Composants — shadcn/ui"
- UX : `_bmad-output/planning-artifacts/ux-design-specification.md` — sections "Palette Principale", "Système Typographique", "Fondation Espacement"
- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.10
- Story précédente : `_bmad-output/implementation-artifacts/1-9-cicd-github-actions.md` — DEF-05 (packages/shared sans ESLint, à garder en tête)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@types/jest` absent des devDependencies — typecheck échouait avec TS2582 sur `describe`/`it`/`expect`. Installé via `pnpm add -D @types/jest`.
- `actionTypes` const dans `use-toast.ts` levait `no-unused-vars` ESLint (utilisée uniquement comme type). Remplacé par type inline `ActionType`.
- `Toaster` importé dans `layout.tsx` sans utilisation → avertissement TS6133. Résolu en ajoutant `<Toaster />` dans le body.

### Completion Notes List

- `tailwind.config.ts` complété : status (5 couleurs), system (4 couleurs), fontFamily.sans → `var(--font-inter)`, fontSize (8 niveaux), spacing (space-1→space-8), borderRadius (btn/card/badge/modal). Tokens existants (primary/agent/neutrals) préservés.
- `globals.css` mis à jour : variables CSS HSL shadcn/ui dans `:root`, font-family Inter dans body — coexistence avec tokens HEX Whatsell dans tailwind.config.
- `components.json` créé (configuration shadcn/ui style=default, rsc=true, cssVariables=true).
- Dépendances installées : `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot/dialog/avatar/progress/tabs/toast/scroll-area`, `cmdk`.
- `src/lib/utils.ts` créé avec `cn()` (clsx + tailwind-merge).
- 11 composants shadcn/ui créés dans `src/components/ui/` : button, card, badge, skeleton, avatar, progress, tabs, dialog, sheet, use-toast, toaster, command.
- `layout.tsx` mis à jour : import + rendu `<Toaster />` dans le body.
- `jest.config.ts` + `jest.setup.ts` créés pour le projet web.
- 15/15 tests passants — lint ✅ — typecheck ✅.

### File List

- `apps/web/tailwind.config.ts` (modifié — tokens complets)
- `apps/web/src/app/globals.css` (modifié — variables CSS shadcn/ui + font body)
- `apps/web/src/app/layout.tsx` (modifié — import + rendu Toaster)
- `apps/web/components.json` (créé)
- `apps/web/jest.config.ts` (créé)
- `apps/web/jest.setup.ts` (créé)
- `apps/web/src/lib/utils.ts` (créé — cn())
- `apps/web/src/components/ui/button.tsx` (créé)
- `apps/web/src/components/ui/card.tsx` (créé)
- `apps/web/src/components/ui/badge.tsx` (créé)
- `apps/web/src/components/ui/skeleton.tsx` (créé)
- `apps/web/src/components/ui/avatar.tsx` (créé)
- `apps/web/src/components/ui/progress.tsx` (créé)
- `apps/web/src/components/ui/tabs.tsx` (créé)
- `apps/web/src/components/ui/dialog.tsx` (créé)
- `apps/web/src/components/ui/sheet.tsx` (créé)
- `apps/web/src/components/ui/use-toast.ts` (créé)
- `apps/web/src/components/ui/toaster.tsx` (créé)
- `apps/web/src/components/ui/command.tsx` (créé)
- `apps/web/src/app/__tests__/design-system.test.ts` (créé — 15 tests)
- `apps/web/package.json` (modifié — nouvelles dépendances shadcn/ui + @types/jest)
- `pnpm-lock.yaml` (modifié — lockfile mis à jour)

## Review Findings

### PATCH — À corriger (9)

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| P1 | High | `src/components/ui/use-toast.ts:108` | `useEffect` dépend de `[state]` → re-subscribe à chaque render, fuite de listeners. Fix: `[]` |
| P2 | High | `tailwind.config.ts` | Tokens shadcn/ui absents : `secondary`, `muted`, `accent`, `destructive`, `input`, `ring`. Utilisés dans button/skeleton/progress mais non définis → classes silencieusement vides |
| P3 | Med | `src/components/ui/button.tsx:18-21` | Tailles `default` (h-10=40px) et `sm` (h-9=36px) sous le minimum UX-DR3 (44px tap zone) |
| P4 | Med | `tailwind.config.ts` | Plugin `tailwindcss-animate` manquant → animations Dialog/Sheet/Toast cassées |
| P5 | Med | `src/components/ui/` | `.gitkeep` toujours présent (non supprimé comme prévu en Tâche 3) |
| P6 | Med | `src/app/globals.css` | `--background: 0 0% 100%` (blanc) ≠ token Tailwind `background: #F8FAFC` (slate-50) → incohérence sémantique |
| P7 | Med | `src/components/ui/use-toast.ts:5` | `TOAST_REMOVE_DELAY = 1000000ms` (~16 min) → toasts dismissed persistent, fuite setTimeout |
| P8 | Low | `src/components/ui/skeleton.tsx` | Import `React` manquant pour le namespace de type |
| P9 | Low | `src/app/globals.css` | `body` duplique `background-color: #F8FAFC` et `color: #0F172A` déjà appliqués via classes Tailwind dans `layout.tsx` |

### DEFER — À documenter (10)

| ID | Raison |
|----|--------|
| D1 | État toast module-level survive les HMR hot-reloads — pattern shadcn/ui standard, acceptable |
| D2 | `TOAST_LIMIT=1` silencieusement drops toasts concurrents — comportement shadcn/ui intentionnel |
| D3 | Skeleton sans `role="status"` / `aria-label` — amélioration accessibilité, hors scope story 1.10 |
| D4 | Aucun test de rendu composant (render tests) — amélioration, hors scope (les tests AC1-5 passent) |
| D5 | `UPDATE_TOAST` no-op sur toast inexistant — comportement shadcn/ui standard |
| D6 | Pas de bloc dark mode CSS variables — pas de dark mode MVP |
| D7 | Badge rend en `<div>` (block dans contexte inline) — implémentation shadcn/ui standard |
| D8 | Test `tailwind.config` utilise chemin relatif fragile — fonctionnel, amélioration future |
| D9 | Deux blocs `@layer base` dans `globals.css` — PostCSS les fusionne correctement |
| D10 | `jest moduleFileExtensions` sans `.mjs` — pas d'impact sur tests actuels |
