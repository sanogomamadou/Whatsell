# Deferred Work

## Deferred from: code review of 1-1-initialisation-du-monorepo-turborepo (2026-04-15)

- Messages d'erreur apiClient exposent les chemins d'endpoint (status code + path) — concernera davantage les stories futures avec gestion d'erreur UI
- Pas de protection CSRF — couvert par SameSite=Strict sur les cookies JWT en Story 1.3
- LoggerModule lit `process.env['NODE_ENV']` directement — inévitable avec les décorateurs NestJS statiques (evaluated before ConfigService)
- `bufferLogs: true` + crash avant flush pino — résolu dès que `bootstrap().catch()` est ajouté (patch Story 1.1)
- R2 credentials vides par défaut — couvert par la validation ConfigModule (patch Story 1.1)
- apiDelete comportement sur redirections 3xx — edge case mineur, à adresser en Story 1.8 (StorageService)
- Health endpoint `/api/v1/health` non authentifié — intentionnel, standard pour les health checks
- `ApiErrorResponse` type non utilisé dans apiClient pour typer les erreurs — enhancement pour Story 1.3+ (error handling UI)

## Deferred from: code review of 1-2-schema-prisma-et-isolation-multi-tenant (2026-04-16)

- D-01: Migration non vérifiée sur PostgreSQL réel — contrainte d'environnement (pas de DB locale). À exécuter avec Railway ou Docker avant Story 1.3
- D-02: whatsappToken stocké en clair dans Tenant — infrastructure de chiffrement requise, Story 1.3+
- D-03: Pas de révocation JWT / blocklist Redis — Story 1.3 (JwtModule + Redis)
- D-04: Flags sécurité cookie (httpOnly, secure, sameSite) — définis lors du login response, Story 1.3
- D-05: CORS origin configuré en chaîne simple — Story 1.5 infrastructure NestJS commune
- D-06: advanceAmount sans borne supérieure — Story 4 logique métier paiement
- D-07: Race condition compteur ordersUsed — Story 8 abonnements, transaction Prisma nécessaire
- D-08: Pas de config pool de connexions PrismaPg — Story 1.5 infrastructure
- D-09: User.email unique globalement (pas par tenant) — contrainte design multi-tenant, impact étendu, à revoir en Story 2
- D-10: Index @@index([tenantId]) redondant sur Subscription (déjà couvert par PK) — optimisation mineure
- D-11: Customer.segment string libre sans enum — Story 6 CRM segmentation automatique
- D-12: Tenant.slug sans validation format (regex) — Story 2 wizard inscription
- D-13: Logger expose query params dans les logs — Story 1.5 config logging Pino
- D-14: Pas de ValidationPipe global NestJS — Story 1.5 infrastructure NestJS commune
- D-15: Secret JWT par défaut non bloqué par validation — vérifier env.validation.ts (possiblement déjà couvert)

## Deferred from: code review of 1-4-rbac-guards-decorateurs-et-roles (2026-04-17)

- D-02: Enregistrement global de `RolesGuard` non présent — prévu Story 1.5 (`APP_GUARD` global). Sans ça, le guard doit être appliqué manuellement sur chaque controller.
- D-03: Contextes non-HTTP (`switchToHttp()` non conditionnel) — API REST uniquement en V1. Si WebSocket ou GraphQL ajoutés, `canActivate` devra gérer `context.getType()`.
- D-04: Validation de rôle non scopée au `tenantId` — isolation tenant gérée par `TenantMiddleware` séparément. Si un user OWNER d'un tenant A peut accéder à un endpoint d'un tenant B, c'est le TenantMiddleware qui bloque, pas le RolesGuard.
- D-05: Architecture mono-rôle par utilisateur — `AuthUser.role` est un scalaire. Conception V1 délibérée. Si multi-rôles requis (OWNER d'un tenant + SELLER dans un autre), le guard devra être revu.

## Deferred from: code review of 1-3-authentification-jwt-httponly-et-refresh-token (2026-04-16)

- D-01: Race condition refresh token rotation — deux requêtes concurrentes avec le même token peuvent toutes deux passer avant que le hash soit mis à jour. Nécessite Redis (token store) ou Prisma optimistic locking. Risque faible en pratique mais réel.
- D-02: Pas de rate limiting sur les endpoints auth (register, login, refresh) — prévu Story 1.5 (`@nestjs/throttler`). Brute-force possible sans limite.
- D-03: Cookie `secure:true` bloque le développement local HTTP — voulu par spec NFR7. Dev recommandé via Railway staging ou tunnel HTTPS (ngrok/devtunnel).
- D-04: Access token reste valide 15min après logout — pas de blocklist Redis. Token révoqué côté cookie mais utilisable via client non-navigateur. Fix: Redis blocklist ou TTL très court.
- D-05: `GET /auth/me` retourne réponse non-wrappée `{ data }` — `ResponseWrapperInterceptor` global résoudra automatiquement en Story 1.5.

## Deferred from: code review of 1-5-infrastructure-nestjs-commune (2026-04-17)

- D-01: `host.switchToHttp()` non conditionnel dans `AllExceptionsFilter` — crash si contexte non-HTTP (WebSocket/gRPC). API REST V1 uniquement, hors scope.
- D-02: `ResponseWrapperInterceptor` renvoie `{ data: null }` sur retour `null`/`undefined` — casse la sémantique HTTP 204 (No Content). Aucun endpoint 204 en V1, à adresser quand nécessaire.
- D-03: `req['id']` potentiellement `undefined` dans `customProps` pino selon version pino-http — `requestId` absent des logs. À vérifier à l'exécution.
- D-04: `SENTRY_DSN` absent en production → Sentry silencieux sans avertissement au démarrage. Amélioration observabilité, à adresser post-MVP (ajouter un log `warn` au bootstrap si DSN absent en production).
- D-05: `isPaginatedResult` peut bypass le wrapper si un objet domaine possède accidentellement les clés `data` (array) + `meta`. Choix de design, responsabilité de l'appelant de retourner la forme correcte.

## Deferred from: code review of 1-6-queue-bullmq-redis (2026-04-17)

- D-01: Redis unreachable au démarrage bloque le bootstrap — ioredis retry infini par défaut. Nécessite config `maxRetriesPerRequest: 0` ou `enableOfflineQueue: false` dans les options de connexion BullMQ. Concerne l'infrastructure de déploiement Railway, hors scope story 1.6.
- D-02: Pas de déduplication des jobs — même message WhatsApp peut être enqueué plusieurs fois sans `jobId` dérivé du payload. Risque d'envois dupliqués. À adresser en Story 4.x lors de l'implémentation des processors réels.
- D-03: Asymétrie `defaultJobOptions` / `job.opts.attempts` — si une queue future est configurée avec `attempts: 5`, le fallback `?? 3` dans les processors déclenchera le dead-letter trop tôt (à l'attempt 3 au lieu de 5). À corriger quand les processors domaine seront implémentés.
- D-04: `enqueueHealthCheck` enqueue un job one-shot, pas récurrent — BullMQ `repeat` option requise pour le health-check périodique WhatsApp (toutes les 3 min, plage 06h-23h). À implémenter en Story 9.1.
- D-05: Duplicate dead-letter entries sous scaling horizontal — plusieurs instances worker peuvent émettre l'event `failed` en parallèle pour le même job, risque de logs dupliqués et double-alerte. Concerne l'infrastructure multi-instance post-MVP.

## Deferred from: code review of 1-7-sse-notifications-temps-reel (2026-04-17)

- DEF-01: SSE bypass utilise clé metadata interne NestJS 'sse' — fonctionne en NestJS 11.x, risque à surveiller lors d'upgrade majeur vers NestJS 12+
- DEF-02: Pas de backoff exponentiel ni cap de retry dans useAgentEvents — reconnexion fixe 5s sans jitter, thundering herd en cas d'outage. Amélioration UX post-MVP.
- DEF-03: Pas de limite sur les connexions SSE concurrentes — scaling Railway post-MVP, à adresser si >500 tenants actifs
- DEF-04: Pas de @ApiResponse sur le endpoint SSE — documentation Swagger incomplète, non bloquant
- DEF-05: tenantId exposé dans le payload SSE — expose l'identifiant interne au client. Décision d'architecture à prendre séparément.
- DEF-06: Race condition si enabled bascule pendant connect() — cas extrêmement rare (bascule synchrone en cours d'exécution), post-MVP


## Deferred from: code review of 1-8-stockage-cloudflare-r2 (2026-04-18)

- DEF-01: Erreurs réseau S3 (AccessDenied, ServiceUnavailable, timeout) non wrappées en HttpException NestJS — AllExceptionsFilter gère globalement, wrapping granulaire à prévoir en post-MVP pour meilleur diagnostic
- DEF-02: TenantId avec slashes (path traversal potentiel) dans upload() — tenantId vient exclusivement du JWT via TenantMiddleware, surface d'attaque inexistante en V1; à surveiller si le service est exposé hors contexte HTTP
- DEF-03: Buffer vide et limite de taille fichier non validés dans StorageService — validation de taille appartient aux DTOs Zod des contrôleurs (onboarding, invoices) — à implémenter lors des stories 2.2 et 5.6
- DEF-04: Validation MIME type absente dans upload() — responsabilité des DTOs contrôleurs upstream, pas du service partagé
- DEF-05: Pas de logging d'audit sur upload/delete — @AuditLog() sera ajouté aux modules domaine (onboarding, invoices) en stories ultérieures selon architecture
- DEF-06: Noms de buckets R2 sans validation de format Zod — buckets configurés par ops team, pas par utilisateurs; risque de misconfiguration faible
- DEF-07: Comportement R2 optionnel ambigu prod vs dev — à clarifier dans le README déploiement Railway (NODE_ENV=production devrait rendre R2 obligatoire)

## Deferred from: code review of 1-9-cicd-github-actions (2026-04-19)

- DEF-01: Double cast `as unknown as Record<string, unknown>` dans `app.module.ts` — workaround pour typage pino-http, nécessite augmentation d'interface TypeScript ou typage pino-http explicite — à refactorer post-MVP
- DEF-02: Turbo `lint` task sans `inputs` field dans `turbo.json` — cache trop broad, potentiel de faux-positifs de cache — optimisation à faire lors d'une révision CI future
- DEF-03: Cache CI keyed sur `pnpm-lock.yaml` uniquement, pas les sources partagées — stale turbo cache possible si `packages/shared/src` change sans modifier le lockfile — migrer vers Turbo Remote Cache
- DEF-04: Pas de `timeout-minutes` sur les jobs CI et Deploy — timeout GitHub par défaut 6h, gaspillage de minutes CI en cas de hang — à ajouter lors d'une révision CI future
- DEF-05: `packages/shared` n'a pas de config ESLint — `turbo run lint` exécute `tsc --noEmit` pour shared au lieu d'ESLint — à corriger lors d'une story design system ou refactor monorepo
- DEF-06: `deploy.yml` sans step `actions/checkout@v4` — sans conséquence pour un `curl` pur mais fragile pour toute extension future du job deploy

## Deferred from: code review of 1-10-design-system-tokens-tailwind-et-composants-shadcn-ui (2026-04-19)

- D1: État toast module-level survive les HMR hot-reloads — pattern shadcn/ui standard, acceptable en dev
- D2: `TOAST_LIMIT=1` silencieusement drops toasts concurrents — comportement shadcn/ui intentionnel
- D3: Skeleton sans `role="status"` / `aria-label` — amélioration accessibilité, à adresser dans une story accessibilité dédiée
- D4: Aucun test de rendu composant React Testing Library — les tests config AC1-5 passent ; render tests à ajouter si couverture composant requise
- D5: `UPDATE_TOAST` no-op sur toast inexistant — comportement shadcn/ui standard
- D6: Pas de bloc dark mode CSS variables — pas de dark mode MVP V1
- D7: Badge rend en `<div>` (block dans contexte inline) — implémentation shadcn/ui standard
- D8: Test `tailwind.config` utilise chemin relatif — fonctionnel, fragile si fichier déplacé
- D9: Deux blocs `@layer base` dans `globals.css` — PostCSS les fusionne correctement, consolider si gênant
- D10: `jest moduleFileExtensions` sans `.mjs` — pas d'impact sur tests actuels

## Deferred from: code review of 1-11-composants-custom-whatsell (2026-04-19)

- DEF-01: Domaine Cloudflare R2 non whitelisté dans `next.config.ts` pour `next/image` dans ConversationBubble — concerne la configuration de déploiement, à ajouter lors du paramétrage Railway en Story 2+

## Deferred from: code review of 1-12-web-push-notifications-pwa-service-worker (2026-04-20)

- D-A: `sendPushToTenant` charge tous les tokens sans pagination ni `Promise.all` batchée — optimisation perf à adresser si >100 tokens par tenant
- D-B: `unregisterCurrentSubscription` : si le token auth a expiré au moment de la révocation, l'appel API échoue silencieusement — backstop 410 gère les tokens stale à terme
- D-C: `deleteByEndpointHash` sans garde `userId` — non exploitable via API actuellement, à protéger si la méthode est exposée dans un futur endpoint
- D-D: Payload push : longueur `productName`/`customerPhone` non tronquée (limite 4KB push service) — à adresser si push service renvoie des 413
- D-E: `apple-touch-icon` absent du `layout.tsx` — iOS home screen sans icône app, à ajouter en Story 2.1 (onboarding)
- D-F: Orientation `portrait-primary` dans manifest — bloque le landscape tablette, à revisiter en Story 5+ (dashboard analytics)
- D-G: SW supprime la notification si app ouverte même si SSE déconnecté — à adresser avec heartbeat SSE dans une story dédiée

## Deferred from: code review of 2-1-page-inscription-et-creation-de-compte (2026-05-18)

- D-01: Concurrent registration race — same-email concurrent requests pass the `findUserByEmail` check before either commits, the second transaction fails with raw Prisma P2002 (not 409). Fix: unique constraint already on DB, but the service should catch P2002 and convert to ConflictException. Pre-existing in auth.service.ts.
- D-02: `err.message.includes('409'/'401')` fragile — status code detection via substring match on Error.message depends on `apiPost`/`apiGet` error format string. Requires refactoring api.ts to expose a typed `ApiError { status: number }` class. Pre-existing design in api.ts.
- D-03: Cookie `secure: true` hardcoded — silently drops auth cookies in local HTTP dev environments. Should be `secure: process.env.NODE_ENV === 'production'`. Pre-existing from Story 1.3.
- D-04: `isActive` not checked in `findUserById` — `me()` guards on `!user.isActive` but other auth flows using `findUserById` do not. Pre-existing inconsistency.
- D-05: No explicit CSRF token on login/register forms — mitigated by `sameSite: strict` cookies but not fully hardened. Pre-existing design.
- D-06: Tenant slug collision on empty email local part — e.g. `123@example.com` produces slug `123-{suffix}`, which is a leading-hyphen slug if localPart is empty. Pre-existing from Story 1.3.
- D-07: PostgreSQL `@unique` on `User.email` is case-sensitive — Zod lowercases input but the DB column lacks `citext` or a `lower(email)` index. Allows mixed-case duplicate accounts via non-Zod paths. Pre-existing data model.
- D-08: `ordersLimit @default(50)` in Prisma schema is wrong for any tier (FREE=20, PRO=100, BUSINESS=unlimited). Future code paths that omit `ordersLimit` on subscription create will silently use 50. Pre-existing schema default.
- D-09: No integration test for subscription atomicity rollback — unit mocks don't cover the case where `tx.subscription.create` fails inside the `$transaction`. The atomicity is guaranteed by Prisma but untested. Would require a real DB integration test.
- D-10: `GET /auth/me` missing `@Throttle` decorator — only auth endpoint without rate limiting; all others have `{ limit: 10, ttl: 60000 }`. Now that `me()` performs a DB join, this is a low-cost DoS vector for the DB connection pool.

## Fix appliqué lors du test manuel de 2-2 (2026-05-19)

- BUG: `TenantMiddleware` `forRoutes({ path: 'api/v1/*path' })` ne matchait pas les routes avec `setGlobalPrefix('/api/v1')` en NestJS 11. Aucune route utilisant `@CurrentTenant()` ne fonctionnait. Fix : changé en `forRoutes({ path: '*path' })`. Bug présent depuis Story 1.3, non détecté car auth/me et routes auth n'utilisent pas `@CurrentTenant()`.

## Deferred from: code review of 2-3-wizard-etape-2-connexion-whatsapp-business (2026-05-20)

- D-01: Rotation/révocation du token WhatsApp — aucun TTL, `whatsappTokenEncryptedAt` absent. Si la clé de chiffrement est compromise, re-chiffrement impossible sans action utilisateur. À adresser en Story 2.7 (gestion reconnexion WhatsApp).
- D-02: WABA ID non-unique entre tenants — pas de contrainte `@unique` sur `Tenant.whatsappBusinessAccountId` en DB. Collision silencieuse si deux tenants enregistrent le même WABA ID. À traiter lors du développement du webhook handler Story 4.2.
- D-03: Pattern `message.includes('400')` fragile pour détecter les codes HTTP — pattern établi en Story 2.1/2.2, nécessite un refactor global de `api.ts` pour exposer une classe `ApiError { status: number }`. Pre-existing.
- D-04: Absence de protection CSRF explicite sur POST /whatsapp-connect — mitigé par `SameSite=Strict` sur les cookies JWT (Story 1.3). Concern global pre-existing.
- D-05: `OnboardingStep` hardcode `total={5}` sans source-of-truth partagée — pattern utilisé dans toutes les étapes, refactor transversal à prévoir si le nombre d'étapes change.
- D-06: `<iframe>` YouTube sans attribut `sandbox` — CSP concern valide, YouTube requiert scripting pour fonctionner. Non bloquant MVP. À revoir si une politique CSP stricte est adoptée.
- D-07: `ENCRYPTION_KEY` validée en nombre de chars JS (not bytes) dans `env.validation.ts` alors que `encryption.service.ts` valide en bytes — caractères multi-octets UTF-8 passeraient la validation mais échoueraient à l'exécution. Infrastructure pre-existante hors scope.

## Deferred from: code review of 2-2-wizard-etape-1-profil-boutique (2026-05-19)

- D-01: Upload R2 avant écriture DB → objet orphelin si l'écriture DB échoue après un upload réussi. Pattern compensation (delete-on-failure) requis. Pre-existing architectural pattern.
- D-02: Ancien logo non supprimé de R2 lors d'un re-upload. Chaque mise à jour de logo laisse l'ancien objet R2 orphelin. Hors scope des AC de la story 2.2.
- D-03: `UnsupportedMediaTypeException` dans le callback fileFilter Multer — la propagation en réponse 415 est version-dépendante (@nestjs/platform-express). À vérifier avec un test d'intégration.
- D-04: Détection d'erreur frontend via `message.includes('413'/'415'/'400')` fragile — pattern établi en Story 2.1, refactor global de `api.ts` requis pour un typage propre des erreurs HTTP.
- D-05: `apiFormData` ne lit pas le corps de la réponse d'erreur — cohérent avec les autres fonctions de `api.ts` mais perd les messages d'erreur serveur détaillés.
- D-06: `StorageService` lève `Error` plain (pas `HttpException`) quand R2 non configuré → Sentry flood en dev. Pre-existing depuis Story 1.8.

## Deferred from: code review of 2-4-wizard-etape-3-premier-produit-au-catalogue (2026-05-20)

- D-01: Orphelin R2 si transaction DB échoue après upload réussi — même pattern que D-01 story 2-2, accepté pour l'onboarding (compensation delete-on-failure requis post-MVP)
- D-02: Détection d'erreur HTTP frontend fragile via `message.includes('4xx')` — refactor global de `api.ts` requis pour une classe `ApiError { status: number }` typée. Pre-existing depuis stories 2-1/2-2/2-3
- D-03: `imageUrl` stocke une clé R2 (`tenantId/products/uuid`) pas une URL HTTP — images non affichables si R2 public access non configuré. Pre-existing depuis story 1-8 (DEF-07)
- D-04: Upload R2 silencieux en production — catch avale toutes erreurs sans logging ni distinction dev/prod. Pre-existing depuis story 2-2 (D-06)
- D-05: MIME spoofing — validation MIME côté serveur basée sur l'en-tête `Content-Type` client, pas sur les magic bytes. Nécessite le package `file-type`. Hardening sécurité post-MVP
- D-06: Race condition count/findMany en pagination — `Promise.all` non atomique, incohérence `total`/`items.length` possible sous écriture concurrente. Faible risque pour un catalogue d'onboarding

## Deferred from: code review of 2-5-wizard-etape-4-regles-de-paiement (2026-05-21)

- D-01: `TEXT[]` sans contrainte CHECK PostgreSQL sur `acceptedPaymentModes` — validation application-level (Zod) suffisante en V1 ; un appel DB direct peut stocker des valeurs hors enum
- D-02: Constante `PAYMENT_MODES` non exportée depuis `packages/shared` — les consommateurs doivent redéclarer la liste ou utiliser `PaymentMode` ; amélioration mineure à grouper avec une story design system
- D-03: Timers multiples dans `useEffect` si `router` change d'identité — référence stable dans Next.js App Router aujourd'hui, fragile aux upgrades Next.js majeurs [apps/web/src/app/onboarding/payment/page.tsx:45]
- D-04: `toggleMode` opère sur un snapshot potentiellement stale de `selectedModes` — les browsers sérialisent les click events, risque réel uniquement avec keyboard navigation rapide [apps/web/src/app/onboarding/payment/page.tsx:51]
- D-05: Validation croisée `advancePercentage`/`acceptedPaymentModes` absente — ex: 0% + Orange Money est sémantiquement incohérent ; décision business hors scope spec 2.5
- D-06: `audit_logs` sans index sur `userId` et `createdAt` — requêtes "actions d'un utilisateur" ou "derniers 30 jours" seront full-scan ; optimisation à ajouter avant mise en production du dashboard admin (Story 9)
- D-07: `acceptedPaymentModes DEFAULT '{}'` en DB — tenants créés avant cette migration ont un tableau vide qui échouerait la validation Zod `min(1)` si lu et re-validé ; aucun endpoint read-validate actuel
- D-08: PATCH concurrent last-write-wins sans optimistic locking — deux onglets simultanés peuvent s'écraser mutuellement ; standard pour un wizard d'onboarding, à revoir si édition multi-utilisateur requise
- D-09: Champs `resource`/`resourceId` dans `AuditLog` ajoutés au-delà de l'AC4 — extension intentionnelle et utile, non documentée dans la spec ; à formaliser dans l'architecture Story 9 (panel admin)
- D-10: Délai 1500 ms avant redirection vers `/onboarding/activate` non spécifié dans AC8 — amélioration UX (badge "Enregistré") acceptable, à standardiser si d'autres étapes adoptent le même pattern
- D-11: `z.coerce.number()` à la place de `z.number()` strict — JSON body typé par NestJS, coerce sécurisé en pratique ; risque uniquement si l'endpoint est appelé via form-data (non prévu)
- D-12: `AuditLog` sans FK sur `userId` — design intentionnel : un log d'audit doit survivre à la suppression de l'utilisateur pour des raisons légales/compliance ; cohérent avec les pratiques d'audit standards

## Deferred from: code review of 2-6-wizard-etape-5-activation-de-lagent (2026-05-26)

- D-01: Re-activation génère un doublon d'audit — chaque appel à `POST /activate` crée une nouvelle entrée `agent.activated` dans audit_logs, même sur tenant déjà activé. Par design spec (AC 3 : overwrite silencieux), mais dégrade la lisibilité de l'audit timeline. À filtrer côté dashboard admin (Story 9).
- D-02: Détection d'erreur HTTP fragile via `message.includes('401')` dans la page `/onboarding/activate` — pattern pré-existant de D-02 (story 2-3/2-4), nécessite un refactor global de `api.ts` pour une classe `ApiError { status: number }` typée.
- D-03: `triggerCelebration` sessionStorage déduplication — si l'utilisateur revient sur `/onboarding/activate` dans la même session après activation, `CELEBRATION_TRIGGERS.FIRST_AGENT_ACTIVATION` est déjà en sessionStorage et le toast de célébration ne se déclenche plus. Edge case mineur, navigation retour post-activation non prévue par le flow.
- D-04: Risque boucle de redirection après activation — `router.push('/')` redirige vers le dashboard ; si le root guard vérifie `onboardingCompletedAt` via le JWT (non rafraîchi) avec un délai de propagation, l'utilisateur peut être renvoyé vers `/onboarding`. Dépend de l'implémentation du root guard (Story 2.7+).
- D-05: État squelette permanent si l'API renvoie `{ data: null }` — `setSummary(null)` laisse le composant dans l'état `!summary && !loadError` avec le squelette affiché en boucle. Cas impossible avec l'API actuelle (Prisma lève P2025 → NotFoundException → 404 côté frontend), à surveiller si la forme de la réponse évolue.

## Deferred from: code review of 2-7-gestion-du-profil-et-reconnexion-whatsapp (2026-05-28)

- D-01: Ancien logo non supprimé de R2 lors d'un re-upload — chaque `PATCH /settings/profile` avec logo crée un nouvel objet R2 sans supprimer l'ancien. Croissance illimitée du stockage. Même contrainte que D-02 story 2-2. Nécessite `storageService.delete(oldKey)` dans `SettingsService.updateProfile` quand `profile.logoUrl` existant.
- D-02: Pattern `message.includes('statusCode')` pour détecter les erreurs API dans `page.tsx` — fragile si le format des messages de `apiFormData`/`apiPost` évolue. Même problème global que D-02 story 2-3/2-4. Refactor global `ApiError { status: number }` requis.
- D-03: Validation MIME type via `file.mimetype` (Content-Type fourni par le client, spoofable) dans `settings.controller.ts` — limitation architecturale identique à `onboarding.controller.ts`. Solution : vérification magic-bytes côté serveur avec le package `file-type`. À traiter en Epic 3 (catalogue + uploads).
- D-04: `logoUrl` stocke la clé R2 brute `{tenantId}/logos/{uuid}` et non une URL publique — même contrainte que D-03 story 2-4. Résolution : génération d'URL signée ou CDN public, à planifier quand le rendu des logos est requis.
- D-05: `loadProfile` non-stabilisée (`useCallback` absent), warning ESLint supprimé via `// eslint-disable-next-line react-hooks/exhaustive-deps` — pattern pré-existant dans toutes les pages wizard. Mineur tant que la fonction ne capture pas de state supplémentaire.
