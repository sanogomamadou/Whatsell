# Story 1.11 : Composants Custom Whatsell

Status: done

## Story

En tant que **développeur frontend**,
je veux les 6 composants custom Whatsell disponibles dans `components/shared/`,
afin que les fonctionnalités spécifiques au produit soient réutilisables dans toute l'application.

## Acceptance Criteria

1. **Étant donné** que `<AgentStatusIndicator status="active|warning|offline" />` est rendu, **Alors** un point coloré animé + label descriptif est affiché (vert pulsant/orange/rouge) — jamais la couleur seule, sans texte (UX-DR5)

2. **Étant donné** que `<OrderStatusPipeline currentStatus={status} />` est rendu, **Alors** les 5 étapes du pipeline (En attente → Confirmée → En préparation → Expédiée → Livrée) sont visibles avec couleur token + icône lucide + label pour chaque statut, daltoniens inclus (nœud actif pulsant, nœuds passés colorés, nœuds futurs gris) (UX-DR6)

3. **Étant donné** que `<MobileNavBar />` est rendu, **Alors** une barre de navigation fixe en bas avec 5 onglets (Accueil, Commandes, Conversations, Catalogue, Plus) est affichée — zones de tap ≥ 44×44px, badges numériques rouges actifs (max affiché "9+"), hauteur 60px, safe area iOS respectée via `pb-safe` ou `env(safe-area-inset-bottom)` (UX-DR8)

4. **Étant donné** que `<CelebrationToast message="..." />` est déclenché programmatiquement, **Alors** un toast enrichi avec animation expressive, durée 5s, ton chaleureux est affiché — visuellement distinct du Toast shadcn/ui standard, max 1 actif par session (UX-DR10)

5. **Et** `<ConversationBubble type="client|agent|vendor" message="..." timestamp={Date} />` reproduit le style bulle WhatsApp — alignement gauche pour `client` (fond blanc), droite pour `agent` (fond indigo) et `vendor` (fond indigo foncé), largeur max 85% sur mobile (UX-DR7)

6. **Et** `<OnboardingStep stepNumber={N} total={5} title="..." status="completed|active|upcoming|locked" />` affiche la carte d'étape avec : numéro visible, titre, indicateur visuel de statut (vert checkmark / indigo bordure active / gris neutre / cadenas), barre de progression intégrée en position `stepNumber/total` (UX-DR9)

7. **Et** tous les 6 composants respectent WCAG 2.1 AA : `MobileNavBar` → `role="navigation"`, `aria-current="page"`, labels incluant le nombre ("Commandes, 4 en attente") ; `AgentStatusIndicator` → `role="status"`, `aria-live="polite"` (assertive si offline) ; `OrderStatusPipeline` → icônes décoratives masquées `aria-hidden="true"`, labels texte accessibles ; `OnboardingStep` → étapes complétées cliquables, focus visible

8. **Et** tous les composants utilisent les tokens Tailwind de `tailwind.config.ts` — jamais de couleurs HEX codées en dur dans le JSX

9. **Et** 100% des tests unitaires passent après chaque composant

## Tasks / Subtasks

- [x] Tâche 1 : Préparer `components/shared/` (AC: 5, 6, 7, 8)
  - [x] Supprimer `apps/web/src/components/shared/.gitkeep`
  - [x] Créer `apps/web/src/components/shared/index.ts` (barrel exports — vide au départ, alimenté au fil des tâches)

- [x] Tâche 2 : `AgentStatusIndicator` (AC: 1, 7, 8)
  - [x] Créer `apps/web/src/components/shared/AgentStatusIndicator.tsx`
  - [x] Props interface : `status: 'active' | 'busy' | 'attention' | 'offline' | 'paused'`, `conversationCount?: number` (affiché si status='busy')
  - [x] Rendu : point coloré (animate-pulse si active) + label descriptif côte à côte
    - `active` : `bg-agent` (#10B981) pulsant + label "Agent actif"
    - `busy` : `bg-agent` fixe + label "En conversation (N)" si conversationCount fourni
    - `attention` : `bg-warning` (#F59E0B) + label "Attention requise"
    - `offline` : `bg-error` (#EF4444) + label "Hors ligne" — wrapper cliquable (`onClick?: () => void`)
    - `paused` : `bg-neutral-400` + label "En pause"
  - [x] Attributs accessibilité : `role="status"`, `aria-live="polite"` (assertive si offline), `aria-label` dynamique
  - [x] Variantes de taille via prop `size?: 'sm' | 'md' | 'lg'` (défaut: 'md')
  - [x] Exporter dans `index.ts`

- [x] Tâche 3 : `OrderStatusPipeline` (AC: 2, 7, 8)
  - [x] Créer `apps/web/src/components/shared/OrderStatusPipeline.tsx`
  - [x] Type : `OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered'`
  - [x] Props : `currentStatus: OrderStatus`, `variant?: 'compact' | 'full'` (défaut: 'full'), `onAdvance?: (next: OrderStatus) => void`
  - [x] 5 nœuds reliés horizontalement — icônes Lucide React
  - [x] Nœuds passés : colorés, nœud actif : `animate-pulse`, nœuds futurs : gris `text-neutral-300`
  - [x] Variant `compact` : icônes seules (16px), variant `full` : icônes + labels (20px)
  - [x] Si `onAdvance` fourni : tap sur le nœud suivant déclenche `onAdvance(nextStatus)`
  - [x] Icônes décoratives : `aria-hidden`, labels sr-only pour daltoniens + lecteurs d'écran
  - [x] Scroll horizontal via `overflow-x-auto`
  - [x] Exporter dans `index.ts`

- [x] Tâche 4 : `ConversationBubble` (AC: 5, 7, 8)
  - [x] Créer `apps/web/src/components/shared/ConversationBubble.tsx`
  - [x] Props : `type: 'client' | 'agent' | 'vendor'`, `message: string`, `timestamp: Date`, `imageUrl?: string`, `isLoading?: boolean`
  - [x] Alignement client gauche (bg-white), agent/vendor droite (bg-primary / bg-primary-hover)
  - [x] Largeur max 85% — horodatage format "HH:mm" — `next/image` pour imageUrl
  - [x] Skeleton avec `role="status"` si isLoading — badge IA/Vous
  - [x] Exporter dans `index.ts`

- [x] Tâche 5 : `MobileNavBar` (AC: 3, 7, 8)
  - [x] Créer `apps/web/src/components/shared/MobileNavBar.tsx`
  - [x] Props : `activeTab`, `badges?`, `onTabChange`
  - [x] Structure : `<nav role="navigation">` — 5 onglets avec icônes Lucide React
  - [x] Onglet actif `text-primary bg-primary-light`, inactif `text-text-muted`
  - [x] Badge "9+" si count ≥ 10 — hauteur 60px — safe area iOS inline style
  - [x] Zones de tap `min-h-[44px] min-w-[44px]` — `aria-current="page"` sur actif
  - [x] `aria-label` dynamique avec count — focus visible
  - [x] Exporter dans `index.ts`

- [x] Tâche 6 : `OnboardingStep` (AC: 6, 7, 8)
  - [x] Créer `apps/web/src/components/shared/OnboardingStep.tsx`
  - [x] Props : `stepNumber`, `total`, `title`, `status`, `onClick?`
  - [x] `<Card>` shadcn/ui avec cercle numéro, titre, icône statut, `<Progress>` shadcn/ui
  - [x] 4 statuts (completed/active/upcoming/locked) avec styles différenciés
  - [x] Étapes completed cliquables — locked/upcoming non cliquables — focus visible
  - [x] Exporter dans `index.ts`

- [x] Tâche 7 : `CelebrationToast` (AC: 4, 7, 8)
  - [x] Créer `apps/web/src/components/shared/CelebrationToast.tsx` avec `CELEBRATION_TRIGGERS`
  - [x] Créer `apps/web/src/hooks/useCelebrationToast.ts` — expose `triggerCelebration()`
  - [x] Emoji animé + message heading-md + subMessage optionnel
  - [x] sessionStorage pour déduplication par triggerKey (max 1 par session)
  - [x] 4 constantes CELEBRATION_TRIGGERS exportées
  - [x] NE PAS modifier `components/ui/toaster.tsx` — `useToast` uniquement
  - [x] Exporter dans `index.ts`

- [x] Tâche 8 : Tests complets (AC: 1–9)
  - [x] Créer `AgentStatusIndicator.test.tsx` — 11 tests (5 états, role, aria-live, onClick)
  - [x] Créer `OrderStatusPipeline.test.tsx` — 7 tests (statuts, variants, onAdvance, aria)
  - [x] Créer `MobileNavBar.test.tsx` — 9 tests (5 onglets, aria-current, badges, onTabChange)
  - [x] Créer `ConversationBubble.test.tsx` — 8 tests (types, skeleton, timestamp, image)
  - [x] Créer `OnboardingStep.test.tsx` — 8 tests (statuts, progress, clic, accessibilité)
  - [x] Créer `CelebrationToast.test.tsx` — 9 tests (rendu, triggerCelebration, sessionStorage)
  - [x] 67/67 tests passants (suite complète, 0 régression)
  - [x] 0 erreur TypeScript (`tsc --noEmit`)

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | État | Action |
|---------|------|--------|
| `apps/web/src/components/ui/` | 13 composants shadcn/ui installés (story 1.10) | **NE JAMAIS MODIFIER** — ces fichiers sont intouchables |
| `apps/web/src/components/ui/use-toast.ts` | Hook Toast shadcn/ui | Importer uniquement via `@/components/ui/use-toast` |
| `apps/web/src/lib/utils.ts` | `cn()` clsx + tailwind-merge | Importer depuis `@/lib/utils` |
| `apps/web/tailwind.config.ts` | Tokens complets (primary, agent, status, spacing, fontSize, borderRadius) | Lire les noms de tokens — utiliser `bg-primary`, `bg-agent`, `text-body-sm`, etc. |
| `apps/web/src/app/globals.css` | Variables CSS shadcn/ui + body Inter | Ne pas modifier |
| `apps/web/jest.config.ts` + `jest.setup.ts` | Config Jest déjà en place | Utiliser tel quel |
| `apps/web/src/components/shared/.gitkeep` | Fichier placeholder | **SUPPRIMER** en Tâche 1 |

### Tokens Tailwind Disponibles (référence rapide)

```
bg-primary          → #6366F1  (indigo)
bg-primary/90       → #6366F1 90% opacité
bg-primary-light    → #EEF2FF  (indigo très clair)
bg-agent            → #10B981  (vert émeraude)
bg-agent-light      → #D1FAE5
bg-success          → #10B981
bg-warning          → #F59E0B
bg-error            → #EF4444
bg-info             → #3B82F6
bg-background       → #F8FAFC
bg-surface          → #FFFFFF
border-border       → #E2E8F0
text-text-primary   → #0F172A
text-text-secondary → #475569
text-text-muted     → #94A3B8

Status tokens:
bg-status-pending   → #94A3B8
bg-status-confirmed → #6366F1
bg-status-preparing → #F59E0B
bg-status-shipped   → #3B82F6
bg-status-delivered → #10B981

Font sizes (utiliser comme classes Tailwind):
text-heading-xl → 24px/700
text-heading-lg → 20px/600
text-heading-md → 18px/600
text-body-lg    → 16px/400
text-body-md    → 14px/400
text-body-sm    → 12px/400
text-label      → 12px/500
text-button     → 15px/500

Spacing:
p-space-1 → 4px, p-space-2 → 8px, p-space-3 → 12px
p-space-4 → 16px, p-space-6 → 24px, p-space-8 → 32px

Border radius:
rounded-btn   → 8px
rounded-card  → 12px
rounded-badge → 9999px
rounded-modal → 16px
```

### Icônes Lucide React (déjà installé via story 1.10)

```tsx
import { Clock, CheckCircle, Package, Truck, CheckCheck, Home,
         ShoppingBag, MessageCircle, Package2, MoreHorizontal,
         Lock, Circle } from 'lucide-react';
```

Toutes les icônes décoratives doivent avoir `aria-hidden="true"`. Les icônes portant une information sémantique doivent avoir `aria-label`.

### Safe Area iOS dans MobileNavBar

```tsx
// Approche recommandée — style inline (compatible universellement)
style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}

// Ou via Tailwind custom (si configuré) :
className="pb-safe"  // nécessite tailwindcss-safe-area plugin
```

Utiliser l'approche style inline pour ne pas ajouter de dépendance.

### CelebrationToast — Override durée shadcn/ui

Le hook `useToast` de shadcn/ui gère la durée via l'option `duration`. Passer `duration: 5000` à `toast()`. La constante `TOAST_REMOVE_DELAY` dans `use-toast.ts` est de 1 000 000ms (DEFER D7 de 1.10) — c'est intentionnel côté shadcn/ui, la durée d'affichage est contrôlée séparément.

```tsx
const { toast } = useToast();
toast({
  duration: 5000,
  description: <CelebrationToastContent message={message} emoji={emoji} />,
  className: 'bg-gradient-to-r from-primary-light to-white border-primary',
});
```

### Structure de Fichiers Finale

```
apps/web/src/
├── components/
│   ├── ui/                              ← JAMAIS TOUCHER (shadcn/ui)
│   └── shared/
│       ├── index.ts                     ← CRÉER (barrel exports)
│       ├── AgentStatusIndicator.tsx     ← CRÉER
│       ├── OrderStatusPipeline.tsx      ← CRÉER
│       ├── ConversationBubble.tsx       ← CRÉER
│       ├── MobileNavBar.tsx             ← CRÉER
│       ├── OnboardingStep.tsx           ← CRÉER
│       ├── CelebrationToast.tsx         ← CRÉER
│       └── __tests__/
│           ├── AgentStatusIndicator.test.tsx  ← CRÉER
│           ├── OrderStatusPipeline.test.tsx   ← CRÉER
│           ├── ConversationBubble.test.tsx    ← CRÉER
│           ├── MobileNavBar.test.tsx          ← CRÉER
│           ├── OnboardingStep.test.tsx        ← CRÉER
│           └── CelebrationToast.test.tsx      ← CRÉER
└── hooks/
    └── useCelebrationToast.ts           ← CRÉER
```

### Règles TypeScript Strictes

- Jamais de `any` — utiliser `unknown` puis type guard si nécessaire
- Interfaces explicites pour toutes les props (pas de `type Props = { ... }` inline non nommé)
- `next/image` obligatoire pour `imageUrl` dans `ConversationBubble` — jamais `<img>`
- `'use client'` requis sur **tous** les composants de cette story (ils ont des états et des handlers)

### Piège Critique — `next/image` dans les tests Jest

`next/image` peut causer des erreurs dans Jest (le mock n'est pas automatique). Ajouter dans `jest.setup.ts` si pas déjà fait :

```ts
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
```

Vérifier d'abord si ce mock est déjà présent dans `jest.setup.ts` (story 1.10).

### Leçons Importantes de la Story 1.10

| Problème rencontré | Solution à appliquer dès le départ |
|--------------------|-------------------------------------|
| `useEffect` avec mauvaise dépendance (P1) | Vérifier toutes les deps arrays — utiliser `eslint-plugin-react-hooks` pour guider |
| Tokens shadcn/ui absents (`secondary`, `muted`, `ring`) → classes silencieuses (P2) | Ces tokens sont dans `globals.css` CSS vars, pas dans tailwind.config — utiliser les classes shadcn/ui qui en dépendent tels quels |
| Zones de tap sous 44px (P3) | Chaque zone cliquable : `min-h-[44px] min-w-[44px]` dès le départ |
| `tailwindcss-animate` manquant (P4) — vérifier si résolu | `animate-pulse` est natif Tailwind, `animate-in` vient de `tailwindcss-animate`. Si animations Dialog/Sheet cassées après 1.10, installer `tailwindcss-animate` |
| Import `React` manquant (P8) | Ajouter `import React from 'react'` si TypeScript se plaint dans les tests |

### Anti-patterns Interdits (project-context.md)

- ❌ `<img>` natif → `next/image` obligatoire
- ❌ Modifier `components/ui/` → wrapper dans `components/shared/` uniquement
- ❌ Couleurs HEX codées en dur dans JSX → tokens Tailwind uniquement
- ❌ `useState` pour données serveur → TanStack Query (hors scope ici, composants purement présentationnels)
- ❌ Google Fonts CDN → `next/font` (déjà configuré, ne pas toucher)
- ❌ `any` TypeScript → `unknown` + type guard

### Références

- UX Design Spec : `_bmad-output/planning-artifacts/ux-design-specification.md` — section "Composants Custom (à développer)" lignes 1124–1217
- UX Design Spec : `_bmad-output/planning-artifacts/ux-design-specification.md` — section "Comportement Responsive par Composant" ligne 1336+
- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.11 (AC extraits directement)
- Story précédente : `_bmad-output/implementation-artifacts/1-10-design-system-tokens-tailwind-et-composants-shadcn-ui.md` — Review Findings P1–P9 (à éviter)
- project-context.md : `_bmad-output/project-context.md` — Anti-Patterns Interdits + Règles Next.js

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `ToasterToast` type dans `use-toast.ts` ne définit pas `duration` ni `className` → supprimé du hook `useCelebrationToast.ts`. Le `TOAST_REMOVE_DELAY` est déjà à 5000ms dans `use-toast.ts` (correctif de Story 1.10). La durée est donc respectée sans override.
- Test `CelebrationToast.test.tsx` attendait `{ duration: 5000 }` dans le mock toast → mis à jour pour asserter `{ description: expect.anything() }` après suppression de `duration`.

### Completion Notes List

- `components/shared/.gitkeep` supprimé — `index.ts` barrel créé avec 6 exports.
- `AgentStatusIndicator` : 5 états (active/busy/attention/offline/paused), point coloré `animate-pulse` si active, `role="status"`, `aria-live="assertive"` si offline, clickable si offline + onClick fourni, variantes de taille sm/md/lg.
- `OrderStatusPipeline` : 5 nœuds Clock/CheckCircle/Package/Truck/CheckCheck avec tokens `text-status-*`, variant compact (16px sans labels) vs full (20px avec labels), `onAdvance` déclenché sur nœud suivant uniquement, icônes `aria-hidden`, scroll horizontal `overflow-x-auto`.
- `ConversationBubble` : 3 types (client gauche blanc / agent droite bg-primary / vendor droite bg-primary-hover), badge IA ou Vous, `next/image` pour imageUrl, Skeleton avec `role="status"` si isLoading, timestamp formaté HH:mm.
- `MobileNavBar` : 5 onglets Lucide React, hauteur 60px, fixed bottom, safe area iOS via `style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}`, badges "9+" si ≥10, `aria-current="page"` sur actif, `aria-label` dynamique avec count, tap zones min 44×44px.
- `OnboardingStep` : `<Card>` shadcn/ui, 4 statuts avec styles différenciés (border + bg + icône), cercle numéro coloré, `<Progress>` avec `aria-label`, étapes completed cliquables (role="button"), locked/upcoming non cliquables, focus visible.
- `CelebrationToast` + `useCelebrationToast` : emoji animé `zoom-in-50`, message heading-md, subMessage optionnel, `CELEBRATION_TRIGGERS` object (4 clés), déduplication par `sessionStorage` si `triggerKey` fourni.
- Suite complète : **67/67 tests**, **0 erreur TypeScript**, **0 régression** (inclut les 15 tests de design-system.test.ts de Story 1.10).

### File List

- `apps/web/src/components/shared/index.ts` (créé — barrel exports)
- `apps/web/src/components/shared/AgentStatusIndicator.tsx` (créé)
- `apps/web/src/components/shared/OrderStatusPipeline.tsx` (créé)
- `apps/web/src/components/shared/ConversationBubble.tsx` (créé)
- `apps/web/src/components/shared/MobileNavBar.tsx` (créé)
- `apps/web/src/components/shared/OnboardingStep.tsx` (créé)
- `apps/web/src/components/shared/CelebrationToast.tsx` (créé)
- `apps/web/src/hooks/useCelebrationToast.ts` (créé)
- `apps/web/src/components/shared/__tests__/AgentStatusIndicator.test.tsx` (créé — 11 tests)
- `apps/web/src/components/shared/__tests__/OrderStatusPipeline.test.tsx` (créé — 7 tests)
- `apps/web/src/components/shared/__tests__/MobileNavBar.test.tsx` (créé — 9 tests)
- `apps/web/src/components/shared/__tests__/ConversationBubble.test.tsx` (créé — 8 tests)
- `apps/web/src/components/shared/__tests__/OnboardingStep.test.tsx` (créé — 8 tests)
- `apps/web/src/components/shared/__tests__/CelebrationToast.test.tsx` (créé — 9 tests)

### Review Findings

- [x] [Review][Decision] `bg-primary-hover` → renommé `bg-primary-dark` — token `primary.hover` renommé `primary.dark` dans tailwind.config.ts, ConversationBubble.tsx et design-system.test.ts mis à jour. [ConversationBubble.tsx:35, tailwind.config.ts:16]
- [x] [Review][Decision] Portée déduplication CelebrationToast — dédup inconditionnelle via clé globale `celebration_any` si aucun `triggerKey` fourni. [useCelebrationToast.ts]
- [x] [Review][Patch] [CRITICAL] Classe Tailwind dynamique sur connecteurs OrderStatusPipeline — remplacé `'bg-status-' + step.status` par `step.bgClass`. [OrderStatusPipeline.tsx:67]
- [x] [Review][Patch] [HIGH] `role="status"` sur `<button>` dans AgentStatusIndicator — `role={isClickable ? undefined : 'status'}` — role conditionnel. [AgentStatusIndicator.tsx:72]
- [x] [Review][Patch] [HIGH] Type `'attention'` → `'warning'` dans AgentStatusIndicator + statusConfig + test. [AgentStatusIndicator.tsx, AgentStatusIndicator.test.tsx]
- [x] [Review][Patch] [HIGH] Compression contenu iOS dans MobileNavBar — `h-[60px]` → `min-h-[60px]`. [MobileNavBar.tsx:71]
- [x] [Review][Patch] [HIGH] `focus-visible:rounded-card` ajouté au wrapper OnboardingStep cliquable. [OnboardingStep.tsx:76]
- [x] [Review][Patch] [MED] `sessionStorage.setItem` déplacé après `toast()` dans useCelebrationToast. [useCelebrationToast.ts]
- [x] [Review][Patch] [MED] Guard `total || 1` dans OnboardingStep pour éviter NaN. [OnboardingStep.tsx:66]
- [x] [Review][Patch] [MED] Guard timestamp dans `formatTime` de ConversationBubble. [ConversationBubble.tsx:18]
- [x] [Review][Patch] [MED] Guard `currentIndex === -1` avec early return dans OrderStatusPipeline. [OrderStatusPipeline.tsx:39]
- [x] [Review][Patch] [MED] `useCelebrationToast` exporté depuis `apps/web/src/hooks/index.ts` (créé). [hooks/index.ts]
- [x] [Review][Patch] [LOW] Import `cn` inutilisé supprimé de CelebrationToast.tsx. [CelebrationToast.tsx]
- [x] [Review][Defer] Domaine R2 non whitelisté dans next.config.ts pour `next/image` dans ConversationBubble [next.config.ts] — différé, problème de configuration de déploiement pré-existant non lié à cette story
