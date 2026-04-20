# Story 1.12 : Web Push Notifications — PWA Service Worker

Status: done

## Story

En tant que **vendeur**,
je veux recevoir des notifications sur mon téléphone même quand le dashboard est fermé,
afin d'être alerté d'une nouvelle commande même la nuit ou quand je ne suis pas devant mon écran.

## Acceptance Criteria

1. **Étant donné** que le vendeur visite le dashboard pour la première fois,
   **Quand** le navigateur demande la permission de notifications,
   **Alors** une explication claire est affichée : "Activez les notifications pour ne manquer aucune commande" — le vendeur peut accepter ou refuser.
   **Et** si accepté, la `PushSubscription` est envoyée à `POST /api/v1/notifications/register-push` et stockée en base avec `tenantId` (endpoint + keys chiffrés AES-256-GCM).

2. **Étant donné** qu'un événement `order.created` se produit côté serveur,
   **Quand** le processor envoie la notification Push,
   **Alors** la notification arrive sur le téléphone du vendeur en ≤ 30 secondes même si le navigateur est fermé (FR16, NFR3).
   **Et** le titre de la notification est "Nouvelle commande 🎉" avec le nom du produit et le montant en FCFA.
   **Et** un tap sur la notification ouvre directement la fiche commande (deep link `UX-DR11` : `/orders/{orderId}`).

3. **Étant donné** que le dashboard est ouvert ET une notification Push arrive,
   **Quand** le Service Worker reçoit le push event,
   **Alors** la notification système est supprimée — `clients.matchAll()` détecte l'app ouverte (SSE a déjà affiché l'event).

4. **Et** le Service Worker est configuré via `@ducanh2912/next-pwa` (workbox-based), bundle en `apps/web/public/sw.js`.

5. **Et** le manifest PWA (`apps/web/public/manifest.json`) est configuré : `name: "Whatsell"`, `short_name: "Whatsell"`, `display: "standalone"`, `start_url: "/"`, `theme_color: "#6366F1"`, icône 192×192 et 512×512.

6. **Et** les tokens Push (endpoint, p256dh, auth) sont chiffrés AES-256-GCM avant stockage — supprimés si le vendeur révoque la permission (`DELETE /api/v1/notifications/unregister-push`).

7. **Et** les 3 événements qui déclenchent une Web Push : `order.created`, `conversation.handoff_required`, `stock.alert` (NFR3).

## Tasks / Subtasks

- [x] Tâche 1 : Prisma — modèle `PushToken` (AC: 1, 6)
  - [ ] Ajouter modèle `PushToken` dans `apps/api/prisma/schema.prisma` :
    ```prisma
    model PushToken {
      id               String   @id @default(uuid())
      tenantId         String
      userId           String
      endpointEncrypted String
      p256dhEncrypted  String
      authEncrypted    String
      userAgent        String?
      createdAt        DateTime @default(now())
      updatedAt        DateTime @updatedAt

      tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
      user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@unique([tenantId, endpointEncrypted])
      @@index([tenantId])
      @@map("push_tokens")
    }
    ```
  - [x] Ajouter `pushTokens PushToken[]` sur les modèles `Tenant` et `User`
  - [x] Générer et appliquer la migration : `pnpm --filter @whatsell/api prisma migrate dev --name add_push_tokens`

- [x] Tâche 2 : `EncryptionService` dans `common/services/` (AC: 6)
  - [x] Créer `apps/api/src/common/services/encryption.service.ts`
    ```typescript
    // AES-256-GCM — utilise ConfigService pour ENCRYPTION_KEY (32 chars)
    @Injectable()
    export class EncryptionService {
      encrypt(plaintext: string): string  // retourne "{iv}:{tag}:{ciphertext}" en base64
      decrypt(encrypted: string): string  // inverse
    }
    ```
  - [x] Ajouter `EncryptionService` aux `providers` ET `exports` de `CommonModule`
  - [x] Créer `apps/api/src/common/services/encryption.service.spec.ts` (5 tests : encrypt/decrypt round-trip, différent IV par appel, decrypt invalide throw, clé manquante throw)

- [x] Tâche 3 : Config VAPID — env vars et configuration (AC: 2, 7)
  - [x] Ajouter dans `apps/api/src/config/configuration.ts` :
    ```typescript
    webPush: {
      vapidPublicKey: process.env['VAPID_PUBLIC_KEY'] ?? '',
      vapidPrivateKey: process.env['VAPID_PRIVATE_KEY'] ?? '',
      vapidSubject: process.env['VAPID_SUBJECT'] ?? 'mailto:admin@whatsell.io',
    }
    ```
  - [x] Ajouter dans `apps/api/src/config/env.validation.ts` (optional avec default vide — obligatoire seulement si notifications activées) :
    ```typescript
    VAPID_PUBLIC_KEY: z.string().optional().default(''),
    VAPID_PRIVATE_KEY: z.string().optional().default(''),
    VAPID_SUBJECT: z.string().optional().default('mailto:admin@whatsell.io'),
    ```
  - [x] Ajouter `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` dans `apps/api/.env.example`
  - [x] Ajouter `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dans `apps/web/.env.example`
  - [x] Installer `web-push` côté API : `pnpm --filter @whatsell/api add web-push` + `pnpm --filter @whatsell/api add -D @types/web-push`

- [x] Tâche 4 : Module `notifications` — backend NestJS (AC: 1, 2, 6, 7)
  - [x] Créer `apps/api/src/modules/notifications/notifications.module.ts`
    ```typescript
    @Module({
      imports: [EventsModule],  // pour s'abonner au stream
      controllers: [NotificationsController],
      providers: [NotificationsService, NotificationsRepository],
    })
    export class NotificationsModule {}
    ```
  - [x] Créer `apps/api/src/modules/notifications/notifications.repository.ts`
    - `storeToken(tenantId, userId, subscription)` — chiffre endpoint/p256dh/auth avant INSERT, upsert sur `[tenantId, endpointEncrypted]`
    - `deleteToken(tenantId, endpoint)` — chiffre endpoint, DELETE
    - `getTokensByTenant(tenantId)` — SELECT + déchiffre avant retour
  - [x] Créer `apps/api/src/modules/notifications/notifications.service.ts`
    - `registerPush(tenantId, userId, subscription)` → appelle repository
    - `unregisterPush(tenantId, endpoint)` → appelle repository
    - `sendPushToTenant(tenantId, event, payload)` → récupère tokens → envoie via `webpush.sendNotification()`
    - `onModuleInit()` — s'abonne à `eventsService.subscribeToAll()` pour les 3 événements déclencheurs
  - [x] Créer `apps/api/src/modules/notifications/notifications.controller.ts`
    - `POST /notifications/register-push` — body: `{ endpoint, keys: { p256dh, auth } }`, extrait `tenantId` via `@CurrentTenant()` et userId via `@CurrentUser()`
    - `DELETE /notifications/unregister-push` — body: `{ endpoint }`
  - [x] Créer DTOs dans `apps/api/src/modules/notifications/dto/` :
    - `register-push.dto.ts` : valide avec `ZodValidationPipe` (schéma Zod dans `packages/shared/schemas/`)
  - [x] Ajouter `NotificationsModule` dans les imports d'`AppModule`

- [x] Tâche 5 : Exposer `subscribeToAll()` dans `EventsService` (AC: 7)
  - [x] Modifier `apps/api/src/modules/events/events.service.ts` : ajouter méthode publique
    ```typescript
    subscribeToAll(): Observable<InternalEvent> {
      return this.stream$.asObservable();
    }
    ```
  - [x] Note : `stream$` doit passer de `Subject` à `Subject` (pas de changement de type, juste exposer `.asObservable()`)

- [x] Tâche 6 : Payload Web Push structuré (AC: 2, 3, 7)
  - [x] Payload JSON envoyé via `webpush.sendNotification()` :
    ```typescript
    interface PushPayload {
      title: string;       // "Nouvelle commande 🎉"
      body: string;        // "{product} — {amount} FCFA"
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: string;       // "/orders/{orderId}"
        event: AgentEventType;
      }
    }
    ```
  - [x] Mapping des events vers titres :
    - `order.created` → "Nouvelle commande 🎉"
    - `conversation.handoff_required` → "Intervention requise ⚠️"
    - `stock.alert` → "Stock bas 📦"

- [x] Tâche 7 : Service Worker frontend — PWA setup (AC: 3, 4, 5)
  - [x] Installer `@ducanh2912/next-pwa` : `pnpm --filter @whatsell/web add @ducanh2912/next-pwa`
  - [x] Modifier `apps/web/next.config.ts` :
    ```typescript
    import withPWA from '@ducanh2912/next-pwa';
    const nextConfig = withPWA({
      dest: 'public',
      disable: process.env.NODE_ENV === 'development',
      customWorkerSrc: 'worker',  // dossier pour code SW custom
    })({
      // ... config existante inchangée
    });
    ```
  - [x] Créer `apps/web/public/manifest.json` :
    ```json
    {
      "name": "Whatsell",
      "short_name": "Whatsell",
      "description": "Gérez vos ventes WhatsApp",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#F8FAFC",
      "theme_color": "#6366F1",
      "icons": [
        { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
      ]
    }
    ```
  - [x] Créer `apps/web/public/icons/` avec icônes placeholder 192×192 et 512×512 (PNG transparent avec fond indigo)
  - [x] Ajouter lien manifest dans `apps/web/src/app/layout.tsx` :
    ```tsx
    export const metadata: Metadata = {
      // ... existant
      manifest: '/manifest.json',
    };
    ```
  - [x] Créer `apps/web/worker/push-events.ts` (fichier SW custom compilé par next-pwa) :
    ```typescript
    // Push event handler — déduplication si app ouverte
    declare const self: ServiceWorkerGlobalScope;
    
    self.addEventListener('push', (event) => {
      if (!event.data) return;
      const payload = event.data.json() as PushPayload;
      event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clients => {
            if (clients.length > 0) return; // App ouverte — SSE gère déjà
            return self.registration.showNotification(payload.title, {
              body: payload.body,
              icon: payload.icon,
              badge: payload.badge,
              data: payload.data,
            });
          })
      );
    });
    
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const url = (event.notification.data as { url: string }).url;
      event.waitUntil(
        self.clients.matchAll({ type: 'window' })
          .then(clients => {
            const existing = clients.find(c => c.url.includes(url));
            if (existing) return existing.focus();
            return self.clients.openWindow(url);
          })
      );
    });
    ```

- [x] Tâche 8 : Hook `useNotificationPermission` (AC: 1, 3)
  - [x] Créer `apps/web/src/hooks/useNotificationPermission.ts`
    ```typescript
    interface UseNotificationPermissionReturn {
      permission: NotificationPermission | 'unsupported';
      requestPermission: () => Promise<void>;
      isRegistering: boolean;
    }
    ```
    - Vérifie support Notification + serviceWorker
    - `requestPermission()` : appelle `Notification.requestPermission()`, si accordé → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY })` → POST vers `lib/api.ts`
    - Stocke le statut dans `localStorage` pour ne pas redemander
    - Gère la révocation : écoute `navigator.permissions.query({name: 'notifications'}).onchange`
  - [x] Exporter depuis `apps/web/src/hooks/index.ts`

- [x] Tâche 9 : Composant `NotificationPermissionPrompt` (AC: 1)
  - [x] Créer `apps/web/src/components/shared/NotificationPermissionPrompt.tsx`
    - Affiche uniquement si `permission === 'default'` (jamais demandé)
    - `'use client'` requis
    - Card sticky ou Toast avec message : "Activez les notifications pour ne manquer aucune commande"
    - Bouton "Activer" (appelle `requestPermission()`) + bouton "Plus tard" (dismiss, stocke en localStorage)
    - Utiliser tokens Tailwind : `bg-surface`, `border-border`, `text-text-primary`
  - [x] Intégrer dans `apps/web/src/app/layout.tsx` (au niveau global — chargement lazy côté client)
  - [x] Exporter depuis `apps/web/src/components/shared/index.ts`

- [x] Tâche 10 : Tests (AC: 1–7)
  - [x] `apps/api/src/common/services/encryption.service.spec.ts` — 5 tests
  - [x] `apps/api/src/modules/notifications/notifications.service.spec.ts` — 8 tests :
    - [x] `registerPush` stocke token chiffré
    - [x] `unregisterPush` supprime token
    - [x] `sendPushToTenant` appelle webpush pour chaque token du tenant
    - [x] `sendPushToTenant` ne plante pas si aucun token
    - [x] `onModuleInit` s'abonne aux 3 events (mock EventsService)
    - [x] Seuls `order.created`, `conversation.handoff_required`, `stock.alert` déclenchent un push (pas `order.status_changed`)
    - [x] Payload `order.created` contient "Nouvelle commande 🎉"
    - [x] Erreur webpush individuelle (token expiré) → log + continue (pas de crash)
  - [x] `apps/api/src/modules/notifications/notifications.repository.spec.ts` — 5 tests :
    - [x] `storeToken` upsert sur conflit endpoint
    - [x] `getTokensByTenant` déchiffre correctement
    - [x] `deleteToken` supprime uniquement le token du bon tenant (isolation)
  - [x] `apps/web/src/components/shared/__tests__/NotificationPermissionPrompt.test.tsx` — 6 tests :
    - [x] Affichage uniquement si permission === 'default'
    - [x] Bouton "Activer" appelle requestPermission
    - [x] Bouton "Plus tard" dismiss + localStorage
    - [x] Invisible si permission === 'granted' ou 'denied'
    - [x] Invisible si Notification non supporté
  - [x] `apps/web/src/hooks/__tests__/useNotificationPermission.test.ts` — 6 tests :
    - [x] `permission` retourne 'unsupported' si pas de Notification
    - [x] `requestPermission` POSTe vers API si accordé
    - [x] `requestPermission` ne POSTe pas si refusé
    - [x] Stocke statut dans localStorage

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | État | Action |
|---------|------|--------|
| `apps/api/src/modules/events/events.service.ts` | SSE Subject + `emit()` + `getStream()` | Ajouter seulement `subscribeToAll()` — ne rien changer d'existant |
| `apps/api/src/modules/events/events.module.ts` | Module exportant EventsService | Importer dans NotificationsModule — ne pas modifier |
| `apps/api/src/common/common.module.ts` | Global, exporte TenantContextService, StorageService | Ajouter EncryptionService aux providers ET exports uniquement |
| `apps/api/src/config/configuration.ts` | Config centralisée | Ajouter seulement la section `webPush:` |
| `apps/api/src/config/env.validation.ts` | Validation Zod au démarrage | Ajouter 3 vars VAPID optional |
| `apps/web/next.config.ts` | Next.js config avec transpilePackages | Wrapper avec withPWA — préserver `transpilePackages: ['@whatsell/shared']` |
| `apps/web/src/app/layout.tsx` | RootLayout avec Inter + Toaster | Ajouter `manifest` dans metadata + `<NotificationPermissionPrompt />` lazy |
| `packages/shared/src/types/events.types.ts` | `AgentEventType` union type | Réutiliser — NE PAS dupliquer |
| `apps/web/src/hooks/index.ts` | Barrel exports hooks | Ajouter export `useNotificationPermission` |
| `apps/web/src/components/shared/index.ts` | Barrel exports composants | Ajouter export `NotificationPermissionPrompt` |

### EncryptionService — Implémentation AES-256-GCM

```typescript
// apps/api/src/common/services/encryption.service.ts
import * as crypto from 'node:crypto';

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  private get key(): Buffer {
    const k = this.configService.get<string>('encryption.key', '');
    if (k.length !== 32) throw new Error('ENCRYPTION_KEY doit être 32 caractères');
    return Buffer.from(k, 'utf-8');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: iv(base64):tag(base64):ciphertext(base64)
    return [iv, tag, encrypted].map(b => b.toString('base64')).join(':');
  }

  decrypt(encoded: string): string {
    const [ivB64, tagB64, ciphertextB64] = encoded.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf-8');
  }
}
```

**Note :** `ENCRYPTION_KEY` existe déjà dans env.validation.ts (32 chars). Réutiliser la même clé — ne pas créer une nouvelle variable d'environnement.

### web-push — Utilisation correcte

```typescript
// Installation: pnpm --filter @whatsell/api add web-push @types/web-push
import * as webpush from 'web-push';

// Init dans onModuleInit ou constructor
webpush.setVapidDetails(
  this.configService.get('webPush.vapidSubject'),
  this.configService.get('webPush.vapidPublicKey'),
  this.configService.get('webPush.vapidPrivateKey'),
);

// Envoi
await webpush.sendNotification(
  { endpoint, keys: { p256dh, auth } },
  JSON.stringify(payload),
);
```

**Générer les clés VAPID (à faire une fois) :**
```bash
node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"
```
Résultat à mettre dans `.env` : `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`.

**Gestion token expiré (410/404) :**
```typescript
try {
  await webpush.sendNotification(...);
} catch (err) {
  if (err.statusCode === 410 || err.statusCode === 404) {
    // Token révoqué — supprimer de la BDD silencieusement
    await this.notificationsRepository.deleteByEndpoint(tenantId, decryptedEndpoint);
  } else {
    this.logger.warn({ err, tenantId }, 'Push notification failed');
  }
}
```

### Frontend — Clé publique VAPID dans le SW

```typescript
// Dans useNotificationPermission.ts
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
});
```

### Turbopack en dev — Compatibilité next-pwa

`@ducanh2912/next-pwa` v5 avec `disable: process.env.NODE_ENV === 'development'` est la config correcte. Le SW n'est **pas généré** en dev Turbopack — c'est intentionnel et voulu. Tester les push notifications nécessite un build de production (`pnpm build && pnpm start`).

### Structure de Fichiers Finale

```
apps/api/src/
├── common/
│   └── services/
│       ├── encryption.service.ts          ← CRÉER
│       └── encryption.service.spec.ts     ← CRÉER
├── config/
│   ├── configuration.ts                   ← MODIFIER (ajouter webPush)
│   └── env.validation.ts                  ← MODIFIER (ajouter VAPID vars)
└── modules/
    └── notifications/
        ├── notifications.module.ts         ← CRÉER
        ├── notifications.controller.ts     ← CRÉER
        ├── notifications.service.ts        ← CRÉER
        ├── notifications.repository.ts     ← CRÉER
        └── dto/
            └── register-push.dto.ts        ← CRÉER

apps/api/prisma/
└── schema.prisma                           ← MODIFIER (ajouter PushToken)

apps/web/
├── next.config.ts                          ← MODIFIER (wrapper withPWA)
├── public/
│   ├── manifest.json                       ← CRÉER
│   └── icons/
│       ├── icon-192x192.png               ← CRÉER
│       └── icon-512x512.png               ← CRÉER
├── worker/
│   └── push-events.ts                      ← CRÉER
└── src/
    ├── app/
    │   └── layout.tsx                      ← MODIFIER (manifest + Prompt)
    ├── components/shared/
    │   ├── index.ts                        ← MODIFIER (ajouter export)
    │   ├── NotificationPermissionPrompt.tsx ← CRÉER
    │   └── __tests__/
    │       └── NotificationPermissionPrompt.test.tsx ← CRÉER
    └── hooks/
        ├── index.ts                        ← MODIFIER (ajouter export)
        ├── useNotificationPermission.ts    ← CRÉER
        └── __tests__/
            └── useNotificationPermission.test.ts ← CRÉER

packages/shared/src/schemas/
└── notifications.schema.ts                 ← CRÉER (RegisterPushSchema Zod)
```

### Schéma Zod partagé pour le DTO

```typescript
// packages/shared/src/schemas/notifications.schema.ts
import { z } from 'zod';

export const RegisterPushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type RegisterPushDto = z.infer<typeof RegisterPushSchema>;
```

Exporter depuis `packages/shared/src/schemas/index.ts`.

### Anti-Patterns Interdits (project-context.md)

- ❌ `process.env.VAPID_*` dans un service → via `ConfigService.get('webPush.vapidPublicKey')`
- ❌ Prisma dans NotificationsController → `NotificationsRepository` uniquement
- ❌ `tenantId` en paramètre → `@CurrentTenant()` décorateur
- ❌ `throw new Error()` → `throw new BadRequestException(...)` ou `NotFoundException`
- ❌ `useState` pour subscription → TanStack Query (`useMutation`)
- ❌ Modifier `components/ui/` → wrapper dans `components/shared/`
- ❌ Fetch sans `credentials: 'include'` → toujours via `lib/api.ts`

### Règle Isolation Multi-Tenant

`NotificationsRepository.getTokensByTenant(tenantId)` **doit** avoir `where: { tenantId }` — jamais retourner des tokens cross-tenant. Ajouter un test d'isolation explicite dans `notifications.repository.spec.ts`.

### Leçons de la Story 1.11 (précédente)

| Problème (1.11) | Application ici |
|-----------------|-----------------|
| Classes Tailwind dynamiques (`bg-status-` + var) → non compilées (P3) | Ne pas construire de classes dynamiques — utiliser des maps d'objets |
| `role` conflictuel sur élément interactif (P2) | `NotificationPermissionPrompt` : si cliquable, pas de `role="status"` |
| Focus visible manquant sur boutons (P4) | Tous les boutons → `focus-visible:ring-2 focus-visible:ring-primary` |
| Import inutilisé (P14) | Vérifier avec `tsc --noEmit` avant de marquer une tâche complète |

### Références

- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.12, lignes 603–630
- Architecture : `_bmad-output/planning-artifacts/architecture.md` — SSE section lignes 246–251, NFR3 ligne 40
- project-context.md : `_bmad-output/project-context.md` — NestJS Rules, Anti-Patterns
- EventsService existant : `apps/api/src/modules/events/events.service.ts`
- EventsModule : `apps/api/src/modules/events/events.module.ts`
- Configuration : `apps/api/src/config/configuration.ts`
- Env validation : `apps/api/src/config/env.validation.ts`
- Schéma Prisma : `apps/api/prisma/schema.prisma`
- SharedTypes AgentEventType : `packages/shared/src/types/events.types.ts`
- Story 1.11 Review : `_bmad-output/implementation-artifacts/1-11-composants-custom-whatsell.md` — Review Findings

## Review Findings

### Decision Needed

- [x] [Review][Decision] D1 — Résolu → Patch P8 : changer `DELETE /unregister-push` en `POST /unregister-push` pour robustesse proxy
- [x] [Review][Decision] D2 — Déféré : SW supprime la notification si app ouverte même si SSE déconnecté — à adresser avec heartbeat SSE dans une story dédiée

### Patches

- [x] [Review][Patch] P8 — Changer `DELETE /unregister-push` en `POST /unregister-push` (robustesse proxies) ✅
- [x] [Review][Patch] P1 — SSE subscription : `OnModuleDestroy` + stockage de la subscription RxJS ✅
- [x] [Review][Patch] P2 — `handleActivate` : `setDismissed(true)` uniquement si permission `denied` ✅
- [x] [Review][Patch] P3 — Clé AES : `Buffer.from(k, 'utf-8').length !== 32` ✅
- [x] [Review][Patch] P4 — `notificationclick` : `new URL(c.url).pathname === url` (match exact) ✅
- [x] [Review][Patch] P5 — `vapidSubject` vide : erreur explicite si subject absent quand clés configurées ✅
- [x] [Review][Patch] P6 — `serviceWorker.ready` : timeout 10s via `Promise.race` ✅
- [x] [Review][Patch] P7 — DISMISSED : JwtAuthGuard global via APP_GUARD dans app.module.ts

### Deferred

- [x] [Review][Defer] D-A — `sendPushToTenant` charge tous les tokens sans pagination ni limite de concurrence `Promise.all` — deferred, optimisation perf future
- [x] [Review][Defer] D-B — `unregisterCurrentSubscription` : token auth potentiellement expiré, API call silencieusement ignoré — deferred, backstop 410 acceptable
- [x] [Review][Defer] D-C — `deleteByEndpointHash` sans garde `userId` (non exploitable via API actuellement) — deferred, à protéger si exposé
- [x] [Review][Defer] D-D — Payload push : longueur `productName`/`customerPhone` non tronquée (limite 4KB push service) — deferred
- [x] [Review][Defer] D-E — `apple-touch-icon` absent du `layout.tsx` (iOS) — deferred, hors scope AC5
- [x] [Review][Defer] D-F — Orientation `portrait-primary` dans manifest — deferred, UX tablette

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
