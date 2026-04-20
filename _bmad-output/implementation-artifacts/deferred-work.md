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
