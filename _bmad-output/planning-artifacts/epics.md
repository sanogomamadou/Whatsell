---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/ux-design-directions.html"
  - "_bmad-output/planning-artifacts/product-brief-Whatsell.md"
---

# Whatsell - Epic Breakdown

## Overview

Ce document fournit le découpage complet des epics et stories pour Whatsell, décomposant les exigences du PRD, de l'UX Design et de l'Architecture en stories implémentables.

## Requirements Inventory

### Functional Requirements

**Compte & Onboarding**
- FR1 : Le vendeur peut créer un compte Whatsell avec email et mot de passe
- FR2 : Le vendeur peut connecter son numéro WhatsApp Business à son compte via un wizard guidé en 5 étapes
- FR3 : Le vendeur peut configurer les règles de paiement de sa boutique (pourcentage d'avance requis, modes acceptés)
- FR4 : Le vendeur peut personnaliser son profil boutique (nom, logo)
- FR5 : Le vendeur peut déconnecter et reconnecter son numéro WhatsApp Business depuis le dashboard

**Agent WhatsApp IA**
- FR6 : L'agent IA peut identifier l'intention d'un message entrant (commande, question produit, suivi de commande, autre)
- FR7 : L'agent IA peut guider un client dans la sélection de variantes disponibles en stock
- FR8 : L'agent IA peut collecter les coordonnées de livraison d'un client au cours d'une conversation
- FR9 : L'agent IA peut calculer le montant de l'avance selon les règles configurées par le vendeur
- FR10 : L'agent IA peut demander et réceptionner la photo du justificatif de paiement Mobile Money
- FR11 : L'agent IA peut créer automatiquement une commande dans le dashboard à l'issue d'une conversation de vente
- FR12 : L'agent IA peut détecter une situation hors de sa portée et notifier le vendeur pour prise en charge
- FR13 : L'agent IA peut informer un client du statut de sa commande existante
- FR14 : Le vendeur peut prendre le contrôle d'une conversation WhatsApp active depuis le dashboard
- FR15 : Le vendeur peut remettre le contrôle d'une conversation à l'agent IA
- FR16 : Le vendeur reçoit une notification en temps réel lorsqu'une commande est créée par l'agent IA

**Gestion des Commandes**
- FR17 : Le vendeur peut consulter la liste de toutes ses commandes avec filtres par statut
- FR18 : Le vendeur peut consulter le détail d'une commande (produits, variantes, client, montant, photo reçu)
- FR19 : Le vendeur peut faire progresser le statut d'une commande (en attente → confirmée → en préparation → expédiée → livrée)
- FR20 : Le vendeur peut générer une facture PDF pour une commande
- FR21 : Le collaborateur avec rôle "Vendeur" peut consulter et mettre à jour le statut des commandes

**Catalogue & Stocks**
- FR22 : Le vendeur peut créer, modifier et supprimer des produits dans son catalogue
- FR23 : Le vendeur peut définir des variantes libres sur un produit (nom de variante + valeurs)
- FR24 : Le vendeur peut définir et mettre à jour un niveau de stock par variante de produit
- FR25 : Le vendeur peut activer ou désactiver la disponibilité d'un produit
- FR26 : Le vendeur peut configurer un seuil d'alerte de rupture de stock par produit
- FR27 : Le vendeur reçoit une alerte lorsqu'un niveau de stock atteint son seuil critique

**CRM & Clients**
- FR28 : Le système crée automatiquement une fiche client lors de sa première commande
- FR29 : Le vendeur peut consulter la fiche d'un client avec son historique de commandes complet
- FR30 : Le système segmente automatiquement les clients (nouveau / régulier / VIP) selon leur historique

**Analytics & Reporting**
- FR31 : Le vendeur peut consulter son chiffre d'affaires sur une période sélectionnée
- FR32 : Le vendeur peut consulter le panier moyen de ses commandes
- FR33 : Le vendeur peut consulter le classement de ses produits les plus vendus
- FR34 : Le vendeur peut consulter le classement de ses clients les plus actifs
- FR35 : Le vendeur peut générer une facture PDF personnalisée avec son logo et le nom de sa boutique

**Agent Conseiller IA**
- FR36 : Le vendeur peut poser des questions en langage naturel sur ses données business à l'agent conseiller
- FR37 : L'agent conseiller génère des alertes proactives sur les stocks critiques
- FR38 : L'agent conseiller génère des alertes proactives sur les tendances de vente inhabituelles
- FR39 : L'agent conseiller génère des alertes proactives sur les clients inactifs depuis une période définie

**Abonnements & Collaborateurs**
- FR40 : Le vendeur peut consulter son abonnement actuel et le nombre de commandes restantes dans son tier
- FR41 : Le vendeur peut upgrader son abonnement vers un tier supérieur depuis le dashboard
- FR42 : Le propriétaire d'un compte Business peut inviter jusqu'à 3 collaborateurs par email
- FR43 : Le propriétaire peut attribuer un rôle (Co-gérant / Vendeur) à chaque collaborateur à l'invitation
- FR44 : Le propriétaire peut révoquer l'accès d'un collaborateur à tout moment
- FR45 : Le système notifie le vendeur lorsqu'il approche de la limite mensuelle de commandes de son tier
- FR46 : Le système offre automatiquement aux nouveaux vendeurs un essai gratuit de 7 jours du tier Pro à l'inscription — à l'expiration, le compte bascule vers le tier Free si aucun abonnement n'a été souscrit
- FR47 : Le système notifie le vendeur à J-2 avant la fin de son essai Pro pour l'inviter à souscrire un abonnement

**Panel Admin & Opérateur**
- FR48 : L'opérateur peut consulter l'état de la connexion WhatsApp de chaque compte vendeur
- FR49 : L'opérateur peut envoyer une notification de support à un vendeur spécifique
- FR50 : L'opérateur peut consulter les métriques globales de la plateforme (taux d'autonomie IA, temps de réponse agent, vendeurs actifs, MRR)
- FR51 : L'opérateur peut identifier les comptes approchant la limite de leur tier (candidats à la conversion)

### NonFunctional Requirements

**Performance**
- NFR1 : L'agent IA produit une réponse pertinente en ≤ 3 minutes par message — priorité à la qualité de la réponse sur la vitesse
- NFR2 : Les pages du dashboard se chargent en ≤ 3 secondes sur une connexion 3G mobile (débit ≥ 1 Mbps)
- NFR3 : Les notifications temps réel (nouvelle commande, alerte stock) parviennent au vendeur en ≤ 30 secondes après l'événement déclencheur
- NFR4 : La génération d'une facture PDF s'effectue en ≤ 5 secondes

**Sécurité**
- NFR5 : Toutes les données sont chiffrées en transit via TLS 1.2 minimum
- NFR6 : Toutes les données sensibles (commandes, clients, conversations) sont chiffrées au repos
- NFR7 : Les sessions utilisateur sont gérées via JWT avec expiration courte (token d'accès : 15 minutes, refresh : 7 jours)
- NFR8 : L'isolation multi-tenant est stricte — aucun accès aux données d'un autre compte vendeur n'est possible, même par erreur applicative
- NFR9 : Les actions sensibles (modification des règles de paiement, export de données, gestion des collaborateurs) sont consignées dans un log d'audit horodaté
- NFR10 : Les photos de reçus Mobile Money sont stockées dans un espace privé accessible uniquement au compte vendeur concerné et à l'opérateur pour le support

**Fiabilité**
- NFR11 : L'agent WhatsApp IA est disponible > 99% du temps sur les plages actives (06h–23h heure locale Mali/Burkina Faso)
- NFR12 : En cas d'indisponibilité de l'agent IA, le système envoie automatiquement un message d'attente au client plutôt qu'un silence
- NFR13 : Aucune perte de données de commandes ou de stocks n'est tolérée — sauvegardes quotidiennes minimum avec rétention de 30 jours
- NFR14 : Le système détecte et notifie l'opérateur en cas de déconnexion du token WhatsApp Business d'un compte vendeur dans un délai de 5 minutes

**Scalabilité**
- NFR15 : Le système supporte une croissance de 50 à 500 comptes vendeurs actifs sans dégradation des performances
- NFR16 : Le traitement des webhooks WhatsApp entrants est asynchrone via une queue — le système absorbe des pics jusqu'à 1 000 messages simultanés sans perte
- NFR17 : L'architecture permet l'ajout de nouveaux marchés géographiques (nouveaux pays, nouvelles langues) sans refactoring majeur

**Intégration**
- NFR18 : En cas de timeout de l'API LLM (> 3 minutes), l'agent transfère automatiquement la conversation au vendeur avec un message d'explication au client
- NFR19 : En cas d'indisponibilité de l'API WhatsApp Business (Twilio), les messages entrants sont mis en queue et traités à la reprise du service
- NFR20 : Le système journalise toutes les erreurs d'intégration (WhatsApp, LLM, stockage) avec horodatage et contexte pour faciliter le diagnostic opérateur

### Additional Requirements

**Template de démarrage (Architecture)**
- Monorepo Turborepo initialisé via `npx create-turbo@latest whatsell` avec `apps/web` (Next.js 16) et `apps/api` (NestJS 11) et `packages/shared`
- Cette initialisation constitue la Story 1 de l'Epic 1 — prérequis absolu à tout développement

**Infrastructure & Déploiement**
- PostgreSQL + Redis provisionnés sur Railway (BDD + queue broker)
- Cloudflare R2 pour stockage objets (reçus Mobile Money, logos boutiques, factures PDF) — clés organisées `{tenantId}/{type}/{uuid}`
- Déploiement frontend sur Vercel, backend sur Railway
- CI/CD via GitHub Actions : lint + TypeScript + tests unitaires sur chaque PR, deploy automatique sur main

**Fondations architecturales (bloquantes — à implémenter en premier)**
- Schéma Prisma avec `tenant_id` sur toutes les tables vendeur (orders, products, customers, stock_levels, conversations, invoices, users, subscriptions)
- `TenantMiddleware` NestJS + `AsyncLocalStorage` pour injection automatique du `tenantId` dans toutes les requêtes
- JWT httpOnly cookies (access 15min + refresh 7j avec rotation) via Passport.js
- RBAC Guards NestJS : rôles `OWNER`, `CO_MANAGER`, `SELLER`, `ADMIN` via `@Roles()` décorateur et `RolesGuard`
- `ResponseWrapperInterceptor` global : toutes les réponses API enveloppées dans `{ data }` ou `{ data, meta }`
- `AllExceptionsFilter` global : format d'erreur unifié `{ statusCode, error, message, timestamp, path }`
- `ZodValidationPipe` global : schémas Zod depuis `packages/shared/schemas/`

**Traitement asynchrone**
- BullMQ + Redis : queue `whatsapp-messages` pour absorption des webhooks Twilio (cible 1 000 msg simultanés sans perte)
- Queues supplémentaires : `stock-alerts`, `advisor-alerts`, `trial-expiry`, `whatsapp-health-check`
- Chaque queue a son processor dédié `{domain}.processor.ts`, retry max 3 tentatives

**Notifications temps réel**
- SSE endpoint `GET /api/v1/events/stream` avec événements : `order.created`, `order.status_changed`, `stock.alert`, `agent.status_changed`, `conversation.handoff_required`
- Hook React `useAgentEvents.ts` avec reconnexion automatique

**Monitoring & Logging**
- Sentry (`@sentry/nestjs` + `@sentry/nextjs`) pour capture des erreurs et performances
- Pino (`nestjs-pino`) avec sortie JSON en production — champs : `tenantId`, `requestId`, `service`, `level`, `timestamp`
- Swagger auto-généré via `@nestjs/swagger`
- Rate limiting `@nestjs/throttler` : 100 req/min standard, 10 req/min endpoints sensibles, webhooks Twilio exemptés

**Génération PDF**
- `@react-pdf/renderer` côté serveur NestJS uniquement — buffer PDF retourné en réponse API

**Chiffrement**
- Tokens WhatsApp Business et clés API tiers chiffrés AES-256-GCM avant stockage
- Photos de reçus R2 accessibles uniquement via presigned URLs temporaires

**Anti-patterns obligatoires**
- Toutes les queries Prisma dans `{domain}.repository.ts` uniquement
- Variables d'environnement via `@nestjs/config` uniquement (jamais `process.env.X` dans un service)
- Montants FCFA = entiers uniquement, jamais de float
- Dates stockées en UTC ISO 8601, conversion timezone côté frontend uniquement

### UX Design Requirements

**Design Tokens & Système Visuel**
- UX-DR1 : Configurer les design tokens Tailwind (tailwind.config) — couleurs primary `#6366F1`, primary-hover `#4F46E5`, primary-light `#EEF2FF`, agent `#10B981`, agent-light `#D1FAE5`, neutrals (background `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, text-primary `#0F172A`, text-secondary `#475569`, text-muted `#94A3B8`), couleurs sémantiques 5 statuts de commande, couleurs d'état système (success, warning, error, info)
- UX-DR2 : Configurer l'échelle typographique Inter (8 niveaux : heading-xl 24px/700 → body-sm 12px/400), taille minimum 12px, montants FCFA toujours en heading-lg 20px/600
- UX-DR3 : Configurer l'échelle d'espacement 4px-base (space-1 à space-8), zones de tap minimum 44×44px, boutons primaires 48px hauteur, grilles mobile 360px (marges 16px, contenu 328px)

**Composants shadcn/ui à installer**
- UX-DR4 : Installer et configurer les 11 composants shadcn/ui prioritaires : Button, Card, Badge, Sheet, Dialog, Toast, Avatar, Progress, Tabs, Command, Skeleton — ne jamais modifier `components/ui/`, créer wrappers dans `components/shared/` si nécessaire

**Composants Custom à développer**
- UX-DR5 : Composant `AgentStatusIndicator` — point coloré + label statut agent (actif/attention/hors ligne), visible en permanence dans la navigation
- UX-DR6 : Composant `OrderStatusPipeline` — visualisation horizontale du pipeline 5 statuts avec couleur + icône + label (accessibilité daltoniens)
- UX-DR7 : Composant `ConversationBubble` — bulle de conversation style WhatsApp pour la vue conversations du dashboard
- UX-DR8 : Composant `MobileNavBar` — barre de navigation fixe en bas, 5 onglets (Accueil, Commandes, Conversations, Catalogue, Plus), badges de notification sur chaque onglet
- UX-DR9 : Composant `OnboardingStep` — carte d'étape wizard avec numéro, titre, statut et barre Progress (étape X/5 visible en permanence)
- UX-DR10 : Composant `CelebrationToast` — toast enrichi pour les moments forts (première commande IA, 10ème commande, premier client VIP, activation agent)

**Expérience de Commande (Expérience Définissante)**
- UX-DR11 : Deep link notification → fiche commande ouverte directement sans navigation intermédiaire
- UX-DR12 : Fiche commande avec photo reçu Mobile Money en héros (premier élément visible), montant avance en heading-lg, CTA primaire "Confirmer la commande" dominant visuellement, CTA secondaire "Signaler un problème" discret
- UX-DR13 : Micro-interactions de confirmation — animation checkmark vert 200ms + toast "Commande #X confirmée · Client notifié" + retour automatique liste après 1.5s
- UX-DR14 : Swipe-to-action sur la liste des commandes — swipe gauche révèle "Avancer le statut" comme action principale

**Dashboard Accueil**
- UX-DR15 : Header indigo hero stats — CA du mois, commandes en attente, statut de l'agent IA — maximum 3 métriques, visible sans scroll

**Vue Conversations & Takeover**
- UX-DR16 : Vue conversations avec bandeau "Intervention requise" orange, bouton "Prendre en charge" visible en 1 tap, contexte complet de la conversation immédiatement visible
- UX-DR17 : Symétrie takeover — "Remettre à l'agent" aussi simple et rapide que la prise de contrôle, agent reprend avec le contexte de l'intervention

**Onboarding Wizard**
- UX-DR18 : Wizard 5 étapes avec Progress bar (X/5 toujours visible), tutoriel vidéo intégré à l'Étape 2 (connexion Meta Business Manager), bouton SOS support visible en permanence à l'Étape 2
- UX-DR19 : Écran de célébration d'activation agent (Étape 5 → CTA "Activer mon agent") — écran dédié confirmant l'agent actif, ton de lancement pas de fin de formulaire

**Accessibilité & Qualité**
- UX-DR20 : États de chargement skeleton spécifiques par composant (jamais de spinner générique) — OrdersSkeleton, ProductsSkeleton, etc.
- UX-DR21 : États vides motivants avec call-to-action clair (catalogue vide, liste commandes vide, etc.) — jamais d'écran vide sans guidance
- UX-DR22 : Messages d'erreur toujours en langage humain avec action proposée (jamais "Erreur 502" ou message technique)
- UX-DR23 : Toast "Approche limite tier" présenté comme accomplissement — "Tu as traité 18 commandes ce mois — ton meilleur mois !" jamais comme sanction
- UX-DR24 : Mode supervision optionnel 7 premiers jours — réponses de l'agent notifiées au vendeur avant envoi, pour construction progressive de la confiance

**Analytics & PDF**
- UX-DR25 : Vue analytics avec mini-bars visuelles + top produits lisibles sur 360px
- UX-DR26 : Aperçu facture PDF avec logo boutique avant téléchargement — ton de légitimité professionnelle

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Création de compte email/mdp |
| FR2 | Epic 2 | Wizard connexion WhatsApp Business |
| FR3 | Epic 2 | Règles de paiement boutique |
| FR4 | Epic 2 | Profil boutique (nom, logo) |
| FR5 | Epic 2 | Déconnexion/reconnexion WhatsApp |
| FR6 | Epic 4 | Identification intention message IA |
| FR7 | Epic 4 | Guidage variantes par l'agent |
| FR8 | Epic 4 | Collecte coordonnées livraison |
| FR9 | Epic 4 | Calcul avance Mobile Money |
| FR10 | Epic 4 | Réception photo reçu Mobile Money |
| FR11 | Epic 4 | Création automatique commande |
| FR12 | Epic 4 | Détection situation complexe + transfert |
| FR13 | Epic 4 | Info statut commande au client |
| FR14 | Epic 4 | Takeover vendeur |
| FR15 | Epic 4 | Retour contrôle à l'agent |
| FR16 | Epic 4 | Notification temps réel commande IA |
| FR17 | Epic 5 | Liste commandes avec filtres |
| FR18 | Epic 5 | Détail commande + photo reçu |
| FR19 | Epic 5 | Progression statuts pipeline |
| FR20 | Epic 5 | Génération facture PDF |
| FR21 | Epic 5 | Accès collaborateur "Vendeur" commandes |
| FR22 | Epic 3 | CRUD produits catalogue |
| FR23 | Epic 3 | Variantes libres produits |
| FR24 | Epic 3 | Niveaux de stock par variante |
| FR25 | Epic 3 | Activation/désactivation produit |
| FR26 | Epic 3 | Seuil alerte rupture de stock |
| FR27 | Epic 3 | Alerte atteinte seuil critique |
| FR28 | Epic 6 | Création automatique fiche client |
| FR29 | Epic 6 | Fiche client + historique commandes |
| FR30 | Epic 6 | Segmentation auto (nouveau/régulier/VIP) |
| FR31 | Epic 6 | CA sur période sélectionnée |
| FR32 | Epic 6 | Panier moyen commandes |
| FR33 | Epic 6 | Top produits les plus vendus |
| FR34 | Epic 6 | Top clients les plus actifs |
| FR35 | Epic 6 | Facture PDF personnalisée logo/boutique |
| FR36 | Epic 7 | Questions langage naturel données business |
| FR37 | Epic 7 | Alertes proactives stocks critiques |
| FR38 | Epic 7 | Alertes proactives tendances inhabituelles |
| FR39 | Epic 7 | Alertes proactives clients inactifs |
| FR40 | Epic 8 | Consultation abonnement + commandes restantes |
| FR41 | Epic 8 | Upgrade tier depuis dashboard |
| FR42 | Epic 8 | Invitation collaborateurs (max 3) |
| FR43 | Epic 8 | Attribution rôle collaborateur |
| FR44 | Epic 8 | Révocation accès collaborateur |
| FR45 | Epic 8 | Notification approche limite tier |
| FR46 | Epic 2 | Essai gratuit Pro 7j + bascule Free |
| FR47 | Epic 2 | Notification J-2 fin essai Pro |
| FR48 | Epic 9 | État connexion WhatsApp par compte |
| FR49 | Epic 9 | Notification support à un vendeur |
| FR50 | Epic 9 | Métriques globales plateforme |
| FR51 | Epic 9 | Identification comptes candidats conversion |

## Ordre d'Implémentation & Dépendances Inter-Epics

> ⚠️ **CRITIQUE — Lire avant de démarrer.** L'ordre documenté des epics ne peut pas être suivi tel quel en raison de dépendances techniques entre epics. Respecter l'ordre ci-dessous.

### Graphe de Dépendances

```
Epic 1 (Fondation)
  └─→ Epic 3 Stories 3.1–3.2 (schéma + API produits)   ← PRÉREQUIS de Story 2.4
        └─→ Epic 2 (Inscription & Onboarding)            ← Story 2.4 appelle POST /api/v1/products
              └─→ Epic 3 Stories 3.3–3.6 (reste du catalogue)
                    └─→ Epic 4 (Agent IA)                ← dépend du catalogue pour FR7 + stocks
                          └─→ Epic 5 (Commandes)
                                └─→ Epic 6 (CRM & Analytics)
                                      └─→ Epic 7 (Conseiller IA)
                                            └─→ Epic 8 (Abonnements)
                                                  └─→ Epic 9 (Admin)
```

### Ordre d'Implémentation Recommandé

| Étape | Scope | Justification |
|-------|-------|---------------|
| 1 | **Epic 1** complet | Fondation technique, prérequis absolu |
| 2 | **Epic 3 Stories 3.1–3.2** | Schéma BDD produits + API CRUD — requis par Story 2.4 |
| 3 | **Epic 2** complet | Onboarding — Story 2.4 appelle `POST /api/v1/products` |
| 4 | **Epic 3 Stories 3.3–3.6** | Variantes, stocks, alertes, interface catalogue |
| 5 | **Epic 4** complet | Agent IA — requiert catalogue + stocks opérationnels (FR7) |
| 6 | **Epic 5** complet | Gestion commandes |
| 7 | **Epic 6** complet | CRM & Analytics — requiert des commandes existantes |
| 8 | **Epic 7** complet | Conseiller IA — requiert données analytics existantes |
| 9 | **Epic 8** complet | Abonnements & Collaborateurs |
| 10 | **Epic 9** complet | Panel Admin |

### Dépendances Documentées

- **Story 2.4 → Epic 3 Stories 3.1–3.2** : L'étape 3 du wizard d'onboarding appelle `POST /api/v1/products`. Cet endpoint n'existe qu'après Story 3.2. Implémenter 3.1 et 3.2 avant de développer Story 2.4.
- **Epic 4 → Epic 3 complet** : L'agent IA consulte les produits (`GET /api/v1/products`) et décrémente les stocks. Epic 3 doit être entièrement livré avant Epic 4.

---

## Epic List

### Epic 1 : Fondation Technique & Design System *(Sprint 0 — Aucune valeur utilisateur directe)*
Mise en place du socle technique complet : monorepo Turborepo (Next.js 16 + NestJS 11), base de données PostgreSQL avec isolation multi-tenant stricte (tenant_id + TenantMiddleware + AsyncLocalStorage), authentification JWT httpOnly cookies, RBAC Guards NestJS, BullMQ + Redis, SSE endpoint temps réel, Web Push Notifications (PWA Service Worker), CI/CD GitHub Actions, design tokens Tailwind, composants shadcn/ui et composants custom. Ce socle est le prérequis absolu à tous les autres epics.
**FRs couverts :** Exigences architecturales (template monorepo, multi-tenant, auth, RBAC, infrastructure, Web Push NFR3)
**UX-DRs couverts :** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10

### Epic 2 : Inscription & Activation Vendeur
Un vendeur peut créer son compte, traverser le wizard guidé 5 étapes (profil boutique → connexion WhatsApp Business avec tutoriel vidéo et bouton SOS → catalogue initial → règles de paiement → activation), et activer son agent IA. Il bénéficie automatiquement d'un essai Pro 7 jours. À l'issue de cet epic, le vendeur est opérationnel et prêt à recevoir ses premières commandes.
**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR46, FR47
**UX-DRs couverts :** UX-DR18, UX-DR19, UX-DR21
**⚠️ Dépendance :** Epic 3 Stories 3.1–3.2 doivent être implémentées avant Story 2.4 (voir section Ordre d'Implémentation).

### Epic 3 : Catalogue & Gestion des Stocks
Le vendeur gère intégralement son catalogue : création/modification/suppression de produits, définition de variantes libres (taille, couleur, volume…), niveaux de stock par variante, seuils d'alerte de rupture configurables, activation/désactivation de produits. Il reçoit des alertes lorsqu'un stock atteint son seuil critique. Le catalogue est prêt à alimenter l'agent IA.
**FRs couverts :** FR22, FR23, FR24, FR25, FR26, FR27
**UX-DRs couverts :** UX-DR21 (états vides catalogue)
**ℹ️ Note d'implémentation :** Stories 3.1–3.2 implémentées en Étape 2 (avant Epic 2). Stories 3.3–3.6 implémentées en Étape 4 (après Epic 2).

### Epic 4 : Agent WhatsApp IA & Conversations
L'agent IA gère les conversations WhatsApp de bout en bout : identification d'intention, guidage variantes en stock, collecte adresse livraison, calcul avance selon règles vendeur, réception photo reçu Mobile Money, création automatique de la commande, détection situations complexes avec transfert au vendeur. Le vendeur peut prendre le contrôle en 1 tap et le remettre à l'agent. Il reçoit des notifications temps réel (SSE + Web Push) à chaque commande créée. C'est le cœur de la proposition de valeur Whatsell.
**FRs couverts :** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16
**UX-DRs couverts :** UX-DR16, UX-DR17, UX-DR24 (mode supervision 7j)
**⚠️ Dépendance :** Epic 3 doit être entièrement livré avant Epic 4 (l'agent consulte les produits et décrémente les stocks).

### Epic 5 : Gestion des Commandes & Facturation
Le vendeur gère le cycle de vie complet de ses commandes : liste filtrée par statut, fiche détail avec photo reçu Mobile Money en héros, progression dans le pipeline 5 statuts (en attente → confirmée → en préparation → expédiée → livrée), génération de factures PDF personnalisées. L'expérience définissante (notification → fiche commande → vérification reçu → confirmation en <30 secondes) est pleinement opérationnelle. Les collaborateurs "Vendeur" peuvent consulter et mettre à jour les commandes.
**FRs couverts :** FR17, FR18, FR19, FR20, FR21
**UX-DRs couverts :** UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR20, UX-DR22, UX-DR23, UX-DR26

### Epic 6 : CRM, Analytics & Reporting
Le système crée automatiquement les fiches clients (première commande), les segmente (nouveau/régulier/VIP) selon l'historique. Le vendeur accède à ses analytics business : chiffre d'affaires par période, panier moyen, top produits, top clients, avec visualisations lisibles sur mobile. Il dispose d'une visibilité complète sur la santé de son activité commerciale.
**FRs couverts :** FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35
**UX-DRs couverts :** UX-DR25

### Epic 7 : Agent Conseiller IA
Le vendeur peut interroger en langage naturel ses données business depuis une interface chat ("Quel est mon produit le plus vendu ce mois ?") et reçoit des réponses claires avec recommandations actionnables. L'agent conseiller génère des alertes proactives automatiques : stocks critiques, tendances de vente inhabituelles, clients inactifs. Son copilote business est opérationnel.
**FRs couverts :** FR36, FR37, FR38, FR39

### Epic 8 : Abonnements, Tiers & Collaborateurs
Le vendeur consulte son abonnement actuel et ses commandes restantes, peut upgrader vers un tier supérieur, et reçoit des notifications d'approche de limite présentées comme des accomplissements. Sur le tier Business, le propriétaire peut inviter jusqu'à 3 collaborateurs (Co-gérant/Vendeur), gérer leurs rôles et révoquer leurs accès. La couche monétisation est complète.
**FRs couverts :** FR40, FR41, FR42, FR43, FR44, FR45

### Epic 9 : Panel Admin & Monitoring Plateforme
L'opérateur surveille la santé de toute la plateforme : état des connexions WhatsApp par compte vendeur (détection déconnexion token en ≤5 min), métriques globales (taux d'autonomie IA, temps de réponse agent, vendeurs actifs, MRR), identification des comptes approchant la limite de leur tier, envoi de notifications de support aux vendeurs.
**FRs couverts :** FR48, FR49, FR50, FR51

---

## Epic 1 : Fondation Technique & Design System

Mise en place du socle technique complet : monorepo Turborepo (Next.js 16 + NestJS 11), base de données PostgreSQL avec isolation multi-tenant stricte, authentification JWT httpOnly cookies, RBAC Guards NestJS, BullMQ + Redis, SSE endpoint temps réel, CI/CD GitHub Actions, design tokens Tailwind, composants shadcn/ui et composants custom. Ce socle est le prérequis absolu à tous les autres epics.

### Story 1.1 : Initialisation du Monorepo Turborepo

En tant que **développeur**,
je veux initialiser le monorepo Turborepo avec les apps `web` (Next.js 16) et `api` (NestJS 11) et le package `shared`,
afin d'avoir un environnement de développement fonctionnel et structuré prêt pour l'implémentation.

**Critères d'Acceptation :**

**Étant donné** que le dépôt git est vide,
**Quand** le monorepo est initialisé,
**Alors** la structure suivante existe : `whatsell/apps/web/` (Next.js 16, App Router, Tailwind, Turbopack), `whatsell/apps/api/` (NestJS 11, TypeScript strict), `whatsell/packages/shared/` (schemas/ + types/)
**Et** `pnpm install` s'exécute sans erreur depuis la racine
**Et** `pnpm dev` démarre les deux apps en parallèle via Turborepo
**Et** les variables d'environnement sont définies dans `apps/api/.env.example` et `apps/web/.env.example`

---

### Story 1.2 : Schéma Prisma & Isolation Multi-Tenant

En tant que **développeur**,
je veux configurer Prisma avec PostgreSQL et l'isolation multi-tenant via `tenant_id` sur toutes les tables vendeur,
afin que toutes les données soient strictement cloisonnées par compte dès le départ.

**Critères d'Acceptation :**

**Étant donné** que PostgreSQL est provisionné sur Railway,
**Quand** `prisma migrate deploy` est exécuté,
**Alors** les tables `Tenant` et `User` (avec `tenantId`) existent en base de données
**Et** `TenantMiddleware` est appliqué à toutes les routes `/api/v1/*` et injecte le `tenantId` dans `AsyncLocalStorage`
**Et** `@CurrentTenant()` décorateur est disponible pour lire le `tenantId` dans n'importe quel service
**Et** `PrismaService` est configuré et injectable dans toute l'app NestJS
**Et** un test d'intégration vérifie qu'une requête sans `tenantId` valide est rejetée (401)

---

### Story 1.3 : Authentification JWT httpOnly & Refresh Token

En tant que **vendeur**,
je veux pouvoir me connecter et rester authentifié de façon sécurisée,
afin que mes données commerciales soient protégées et accessibles uniquement depuis mon compte.

**Critères d'Acceptation :**

**Étant donné** que l'utilisateur envoie `POST /api/v1/auth/register` avec email + mot de passe valides,
**Quand** l'inscription réussit,
**Alors** un compte est créé et deux cookies httpOnly sont posés : `access_token` (expiration 15min) et `refresh_token` (expiration 7j)
**Et** le mot de passe est haché avec bcrypt (salt ≥ 10 rounds)

**Étant donné** que l'access token a expiré,
**Quand** le frontend envoie `POST /api/v1/auth/refresh`,
**Alors** un nouveau `access_token` est émis et le `refresh_token` est tourné (ancien invalidé)

**Étant donné** que l'utilisateur envoie `POST /api/v1/auth/logout`,
**Quand** la requête est reçue,
**Alors** les deux cookies sont effacés côté serveur et le refresh token est invalidé en base

**Et** tous les cookies sont `SameSite=Strict`, `Secure`, `HttpOnly` — inaccessibles depuis JavaScript (NFR7)

---

### Story 1.4 : RBAC — Guards, Décorateurs & Rôles

En tant que **développeur**,
je veux un système de contrôle d'accès par rôle opérationnel,
afin que chaque endpoint soit protégé selon les permissions du rôle de l'utilisateur authentifié.

**Critères d'Acceptation :**

**Étant donné** qu'un endpoint est décoré avec `@Roles(Role.OWNER)`,
**Quand** un utilisateur avec le rôle `SELLER` appelle cet endpoint,
**Alors** la réponse est `403 Forbidden`

**Étant donné** qu'un endpoint est décoré avec `@Roles(Role.OWNER, Role.CO_MANAGER)`,
**Quand** un utilisateur avec le rôle `CO_MANAGER` appelle cet endpoint,
**Alors** la requête est autorisée et traitée

**Et** les rôles disponibles sont : `OWNER`, `CO_MANAGER`, `SELLER`, `ADMIN`
**Et** `@CurrentUser()` décorateur retourne l'utilisateur authentifié depuis le JWT
**Et** `JwtAuthGuard` est applicable comme guard global ou par endpoint

---

### Story 1.5 : Infrastructure NestJS Commune

En tant que **développeur**,
je veux que toutes les réponses API soient uniformes et que les erreurs, la validation, le logging et le rate limiting soient configurés globalement,
afin que le backend soit robuste, observable et cohérent sans configuration répétée par module.

**Critères d'Acceptation :**

**Étant donné** qu'un endpoint retourne des données,
**Quand** la réponse est émise,
**Alors** elle est enveloppée dans `{ data: T }` (objet) ou `{ data: T[], meta: { total, page, limit } }` (liste) via `ResponseWrapperInterceptor`

**Étant donné** qu'une exception non gérée est levée,
**Quand** elle est interceptée par `AllExceptionsFilter`,
**Alors** la réponse a le format `{ statusCode, error, message, timestamp, path }`

**Étant donné** qu'un DTO invalide est reçu,
**Quand** `ZodValidationPipe` le valide via le schéma `packages/shared/schemas/`,
**Alors** une `400 Bad Request` avec les erreurs de validation est retournée

**Et** Swagger est accessible sur `/api/docs` en environnement non-production
**Et** `@nestjs/throttler` limite à 100 req/min standard, 10 req/min endpoints auth
**Et** `nestjs-pino` log en JSON avec les champs `tenantId`, `requestId`, `service`, `level`, `timestamp`
**Et** Sentry capture automatiquement les exceptions non gérées

---

### Story 1.6 : Queue BullMQ + Redis

En tant que **développeur**,
je veux une infrastructure de queues BullMQ + Redis opérationnelle,
afin que les traitements asynchrones (webhooks WhatsApp, alertes stock, etc.) puissent être absorbés sans perte ni perte de message.

**Critères d'Acceptation :**

**Étant donné** que Redis est provisionné sur Railway,
**Quand** l'application NestJS démarre,
**Alors** la connexion Redis est établie et les queues suivantes sont initialisées : `whatsapp-messages`, `stock-alerts`, `advisor-alerts`, `trial-expiry`, `whatsapp-health-check`

**Étant donné** qu'un job est ajouté à une queue,
**Quand** le processor correspondant le traite et échoue,
**Alors** le job est retenté automatiquement (max 3 tentatives, backoff exponentiel)
**Et** après 3 échecs, le job est logué en dead-letter avec contexte complet (NFR20)

**Et** chaque queue a son fichier processor dédié `{domain}.processor.ts`

---

### Story 1.7 : SSE — Notifications Temps Réel

En tant que **vendeur**,
je veux recevoir des notifications instantanées dans le dashboard lorsqu'un événement se produit (nouvelle commande IA, alerte stock, etc.),
afin d'être informé en temps réel sans avoir à rafraîchir la page.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est connecté au dashboard,
**Quand** le frontend établit une connexion `GET /api/v1/events/stream`,
**Alors** un flux SSE est ouvert et maintenu, authentifié via le cookie JWT

**Étant donné** qu'un événement `order.created` est émis côté serveur,
**Quand** le flux SSE est actif,
**Alors** l'événement arrive au frontend dans le format `{ event, data: { tenantId, payload, timestamp } }`
**Et** le hook React `useAgentEvents()` dans `hooks/useAgentEvents.ts` gère la reconnexion automatique

**Et** les types d'événements supportés sont : `order.created`, `order.status_changed`, `stock.alert`, `agent.status_changed`, `conversation.handoff_required`
**Et** la notification parvient au vendeur en ≤ 30 secondes (NFR3)

---

### Story 1.8 : Stockage Cloudflare R2

En tant que **développeur**,
je veux un service de stockage d'objets opérationnel avec Cloudflare R2,
afin que les photos de reçus Mobile Money, logos de boutiques et factures PDF puissent être stockés et accédés de façon sécurisée.

**Critères d'Acceptation :**

**Étant donné** que `StorageService` est injecté dans un module NestJS,
**Quand** `storageService.upload(tenantId, type, file)` est appelé,
**Alors** le fichier est stocké dans R2 sous la clé `{tenantId}/{type}/{uuid}` et la clé est retournée

**Étant donné** qu'un accès à un fichier est demandé,
**Quand** `storageService.getSignedUrl(key, expiresIn)` est appelé,
**Alors** une presigned URL temporaire est retournée — jamais d'URL publique directe pour les reçus (NFR10)

**Et** le SDK utilisé est `@aws-sdk/client-s3` (compatible R2)
**Et** les buckets sont organisés : `whatsell-receipts/{tenantId}/`, `whatsell-logos/{tenantId}/`, `whatsell-invoices/{tenantId}/`

---

### Story 1.9 : CI/CD GitHub Actions

En tant que **développeur**,
je veux un pipeline CI/CD automatisé,
afin que chaque commit sur `main` soit validé et déployé automatiquement sans intervention manuelle.

**Critères d'Acceptation :**

**Étant donné** qu'une Pull Request est ouverte,
**Quand** le workflow CI s'exécute,
**Alors** les étapes suivantes passent toutes : lint TypeScript (toute la stack), tests unitaires NestJS, build Next.js

**Étant donné** qu'un merge est effectué sur `main`,
**Quand** le workflow deploy s'exécute,
**Alors** le frontend est déployé automatiquement sur Vercel et le backend sur Railway via webhook
**Et** les variables d'environnement sont injectées depuis Railway Secrets (backend) et Vercel Env Vars (frontend)

---

### Story 1.10 : Design System — Tokens Tailwind & Composants shadcn/ui

En tant que **développeur frontend**,
je veux que le design system Whatsell soit configuré avec les tokens Tailwind et les composants shadcn/ui installés,
afin que tous les composants UI utilisent une identité visuelle cohérente sans reconfiguration.

**Critères d'Acceptation :**

**Étant donné** que `tailwind.config.ts` est configuré,
**Quand** un développeur utilise les classes `bg-primary`, `text-agent`, etc.,
**Alors** les valeurs HEX correctes sont appliquées : primary `#6366F1`, agent `#10B981`, 5 couleurs sémantiques de statut de commande, neutrals complets (UX-DR1)
**Et** l'échelle typographique Inter (8 niveaux) est disponible via classes Tailwind (UX-DR2)
**Et** l'échelle d'espacement 4px-base est configurée, zones de tap ≥ 44×44px (UX-DR3)

**Étant donné** que les composants shadcn/ui sont installés dans `components/ui/`,
**Quand** un développeur importe `Button`, `Card`, `Badge`, `Sheet`, `Dialog`, `Toast`, `Avatar`, `Progress`, `Tabs`, `Command`, `Skeleton`,
**Alors** ces composants fonctionnent correctement — jamais modifiés directement (UX-DR4)
**Et** la police Inter est chargée via `next/font` (pas de Google Fonts externe)

---

### Story 1.11 : Composants Custom Whatsell

En tant que **développeur frontend**,
je veux les 6 composants custom Whatsell disponibles dans `components/shared/`,
afin que les fonctionnalités spécifiques au produit soient réutilisables dans toute l'app.

**Critères d'Acceptation :**

**Étant donné** que `<AgentStatusIndicator status="active|warning|offline" />` est rendu,
**Alors** un point coloré + label descriptif est affiché (vert/orange/rouge), jamais la couleur seule (UX-DR5)

**Étant donné** que `<OrderStatusPipeline currentStatus={status} />` est rendu,
**Alors** les 5 étapes du pipeline sont visibles avec couleur + icône + label pour chaque statut (UX-DR6)

**Étant donné** que `<MobileNavBar />` est rendu,
**Alors** une barre de navigation fixe en bas avec 5 onglets est affichée, zones de tap ≥ 44×44px, badges numériques actifs (UX-DR8)

**Étant donné** que `<CelebrationToast message="..." />` est déclenché,
**Alors** un toast enrichi avec ton chaleureux est affiché, distinct du Toast standard (UX-DR10)

**Et** `<ConversationBubble />` reproduit le style de bulle WhatsApp (UX-DR7)
**Et** `<OnboardingStep stepNumber={N} total={5} title="..." status="..." />` affiche l'étape avec Progress bar (UX-DR9)

### Story 1.12 : Web Push Notifications — PWA Service Worker

En tant que **vendeur**,
je veux recevoir des notifications sur mon téléphone même quand le dashboard est fermé,
afin d'être alerté d'une nouvelle commande même la nuit ou quand je ne suis pas devant mon écran.

**Critères d'Acceptation :**

**Étant donné** que le vendeur visite le dashboard pour la première fois,
**Quand** le navigateur demande la permission de notifications,
**Alors** une explication claire est affichée : "Activez les notifications pour ne manquer aucune commande" — le vendeur peut accepter ou refuser
**Et** si accepté, le token Push est envoyé à `POST /api/v1/notifications/register-push` et stocké en base avec le `tenantId`

**Étant donné** qu'un événement `order.created` se produit côté serveur,
**Quand** le processor envoie la notification Push,
**Alors** la notification arrive sur le téléphone du vendeur en ≤ 30 secondes même si le navigateur est fermé (FR16, NFR3)
**Et** le titre de la notification est "Nouvelle commande 🎉" avec le nom du produit et le montant en FCFA
**Et** un tap sur la notification ouvre directement la fiche commande (deep link UX-DR11)

**Étant donné** que le dashboard est ouvert ET une notification Push arrive,
**Quand** le Service Worker reçoit la notification,
**Alors** la notification système est supprimée (déjà affiché via SSE) pour éviter le doublon

**Et** le Service Worker est enregistré dans `apps/web/public/sw.js` via `next-pwa` ou `workbox`
**Et** le manifest PWA (`manifest.json`) est configuré : nom "Whatsell", icône, `display: standalone`, `start_url: /`
**Et** les tokens Push sont chiffrés au repos et supprimés si le vendeur révoque la permission
**Et** les événements qui déclenchent une Web Push : `order.created`, `conversation.handoff_required`, `stock.alert` (NFR3)

---

## Epic 2 : Inscription & Activation Vendeur

Un vendeur peut créer son compte, traverser le wizard guidé 5 étapes (profil boutique → connexion WhatsApp Business → catalogue initial → règles de paiement → activation), et activer son agent IA. Il bénéficie automatiquement d'un essai Pro 7 jours.

### Story 2.1 : Page d'Inscription & Création de Compte

En tant que **nouveau vendeur**,
je veux créer un compte Whatsell avec mon email et un mot de passe,
afin d'accéder à la plateforme et démarrer l'activation de mon agent.

**Critères d'Acceptation :**

**Étant donné** que le vendeur visite `/register`,
**Quand** il soumet un email valide et un mot de passe (≥ 8 caractères),
**Alors** son compte est créé, un essai Pro 7 jours est activé automatiquement (FR46), et il est redirigé vers l'étape 1 du wizard d'onboarding
**Et** deux cookies httpOnly sont posés (`access_token` 15min + `refresh_token` 7j)

**Étant donné** que l'email est déjà utilisé,
**Quand** le formulaire est soumis,
**Alors** un message humain est affiché : "Cet email est déjà associé à un compte. Connectez-vous ?" (UX-DR22)

**Étant donné** que le vendeur visite `/login`,
**Quand** il soumet ses identifiants corrects,
**Alors** il est authentifié et redirigé vers le dashboard ou le wizard si l'onboarding n'est pas terminé

---

### Story 2.2 : Wizard Étape 1 — Profil Boutique

En tant que **vendeur en cours d'onboarding**,
je veux configurer le nom et le logo de ma boutique,
afin que mon agent IA puisse se présenter avec mon identité de marque lors des conversations.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à l'étape 1/5 du wizard,
**Quand** il saisit le nom de sa boutique (obligatoire) et télécharge un logo optionnel depuis la galerie mobile,
**Alors** le profil boutique est sauvegardé via `PATCH /api/v1/onboarding/profile`
**Et** la barre de progression `<OnboardingStep stepNumber={1} total={5} />` est visible en permanence (UX-DR18)
**Et** le logo est uploadé sur Cloudflare R2 sous `{tenantId}/logos/{uuid}`
**Et** il est redirigé vers l'étape 2

**Étant donné** que le champ nom de boutique est vide,
**Quand** le vendeur tente de passer à l'étape suivante,
**Alors** un message de validation en français est affiché et la progression est bloquée

---

### Story 2.3 : Wizard Étape 2 — Connexion WhatsApp Business

En tant que **vendeur en cours d'onboarding**,
je veux connecter mon numéro WhatsApp Business à Whatsell via un guide étape par étape,
afin que mon agent IA puisse recevoir et répondre aux messages de mes clients.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à l'étape 2/5,
**Quand** la page s'affiche,
**Alors** un tutoriel vidéo intégré expliquant Meta Business Manager est visible, ainsi qu'un bouton "SOS — Contacter le support" permanent (UX-DR18)

**Étant donné** que le vendeur complète la connexion WhatsApp Business,
**Quand** le token est reçu et vérifié par `POST /api/v1/onboarding/whatsapp-connect`,
**Alors** le numéro WhatsApp Business est affiché avec un badge "✓ Connecté"
**Et** le token WhatsApp est chiffré AES-256-GCM avant stockage en base
**Et** il est redirigé vers l'étape 3

**Étant donné** que la connexion échoue,
**Quand** une erreur Meta est reçue,
**Alors** un message humain est affiché avec l'action proposée (UX-DR22), le bouton SOS reste visible

---

### Story 2.4 : Wizard Étape 3 — Premier Produit au Catalogue

> ⚠️ **Prérequis :** Stories 3.1 (schéma BDD produits) et 3.2 (API CRUD produits) doivent être implémentées avant cette story. `POST /api/v1/products` n'existe pas avant Story 3.2.

En tant que **vendeur en cours d'onboarding**,
je veux ajouter au moins un produit à mon catalogue pendant l'onboarding,
afin que mon agent IA ait quelque chose à vendre dès son activation.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à l'étape 3/5,
**Quand** il ajoute un produit (nom + prix obligatoires, photo optionnelle depuis galerie mobile),
**Alors** le produit est créé via `POST /api/v1/products` avec `tenantId` automatique
**Et** une variante par défaut "Standard" est créée si aucune variante n'est spécifiée

**Étant donné** que le vendeur tente de passer à l'étape 4 sans aucun produit,
**Quand** il clique "Continuer",
**Alors** un état vide motivant s'affiche : "Ajoutez au moins 1 produit pour que votre agent puisse vendre !" avec CTA "Ajouter un produit" (UX-DR21)

---

### Story 2.5 : Wizard Étape 4 — Règles de Paiement

En tant que **vendeur en cours d'onboarding**,
je veux configurer mes règles de paiement (pourcentage d'avance + modes acceptés),
afin que mon agent IA puisse calculer et demander le bon montant à chaque client.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à l'étape 4/5,
**Quand** il configure le pourcentage d'avance (0–100%) et coche les modes acceptés (Orange Money / Moov Money / Espèces à la livraison),
**Alors** les règles sont sauvegardées via `PATCH /api/v1/onboarding/payment-rules`
**Et** cette action est consignée dans le log d'audit horodaté (NFR9)

**Étant donné** qu'aucun mode de paiement n'est sélectionné,
**Quand** le vendeur tente de continuer,
**Alors** un message de validation bloque la progression : "Sélectionnez au moins un mode de paiement"

---

### Story 2.6 : Wizard Étape 5 — Activation de l'Agent

En tant que **vendeur en cours d'onboarding**,
je veux voir un récapitulatif de ma configuration et activer mon agent IA,
afin de démarrer officiellement la réception automatique de commandes.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à l'étape 5/5,
**Quand** la page s'affiche,
**Alors** un récapitulatif visuel montre : nom boutique, numéro WhatsApp connecté, nombre de produits, règles de paiement configurées

**Étant donné** que le vendeur clique "Activer mon agent",
**Quand** `POST /api/v1/onboarding/activate` réussit,
**Alors** un écran de célébration dédié s'affiche confirmant "Votre agent est actif et prêt à vendre pour vous !" (UX-DR19)
**Et** un `<CelebrationToast />` est déclenché
**Et** le vendeur est redirigé vers le dashboard après 3 secondes

---

### Story 2.7 : Gestion du Profil & Reconnexion WhatsApp

En tant que **vendeur actif**,
je veux pouvoir modifier mon profil boutique et reconnecter mon numéro WhatsApp depuis les paramètres,
afin de maintenir ma configuration à jour sans refaire tout l'onboarding.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est dans les paramètres de son compte,
**Quand** il modifie le nom ou le logo de sa boutique et sauvegarde,
**Alors** les changements sont appliqués immédiatement via `PATCH /api/v1/settings/profile` (FR4)

**Étant donné** que le token WhatsApp a été révoqué par Meta,
**Quand** le vendeur clique "Reconnecter WhatsApp" dans les paramètres,
**Alors** il est guidé par le même flux de connexion qu'à l'étape 2 du wizard (FR5)
**Et** la reconnexion réussie est confirmée avec un message de succès

---

### Story 2.8 : Notifications Essai Gratuit & Expiration

En tant que **vendeur en essai gratuit**,
je veux être notifié avant l'expiration de mon essai Pro,
afin de pouvoir souscrire un abonnement sans perdre l'accès à mes fonctionnalités.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est à J-2 avant la fin de son essai Pro,
**Quand** le job BullMQ `trial-expiry` s'exécute,
**Alors** un email est envoyé au vendeur l'invitant à souscrire, avec lien vers la page d'upgrade (FR47)

**Étant donné** que l'essai Pro expire sans souscription,
**Quand** la date d'expiration est atteinte,
**Alors** le compte bascule automatiquement vers le tier Free (20 commandes/mois) (FR46)
**Et** le vendeur voit un bandeau informatif dans le dashboard : "Votre essai Pro est terminé. Passez en Pro pour continuer à profiter de toutes les fonctionnalités."

---

## Epic 3 : Catalogue & Gestion des Stocks

Le vendeur gère intégralement son catalogue produits — création, modification, suppression, variantes libres, niveaux de stock par variante, seuils d'alerte configurables, activation/désactivation de produits. Il reçoit des alertes de rupture. Son catalogue est prêt à être utilisé par l'agent IA.

### Story 3.1 : Schéma BDD Produits & Variantes *(Technical Story — aucune valeur utilisateur directe)*

En tant que **développeur**,
je veux créer les tables `Product`, `ProductVariant` et `StockLevel` dans Prisma,
afin de disposer du schéma de données nécessaire à la gestion du catalogue.

**Critères d'Acceptation :**

**Étant donné** que la migration Prisma est exécutée,
**Quand** le schéma est appliqué,
**Alors** les tables suivantes existent avec `tenantId` obligatoire : `products`, `product_variants`, `stock_levels`
**Et** un test d'intégration vérifie qu'une query sur `products` sans `tenantId` ne retourne aucune donnée cross-tenant (NFR8)

---

### Story 3.2 : CRUD Produits — Backend API

En tant que **développeur**,
je veux les endpoints REST pour créer, lire, mettre à jour et supprimer des produits,
afin que le frontend et l'agent IA puissent gérer le catalogue via l'API.

**Critères d'Acceptation :**

**Étant donné** que `POST /api/v1/products` est appelé avec un payload valide,
**Quand** la requête est traitée,
**Alors** le produit est créé avec le `tenantId` du contexte et la réponse est `{ data: Product }` (FR22)

**Étant donné** que `GET /api/v1/products` est appelé,
**Quand** la requête est traitée,
**Alors** uniquement les produits du tenant courant sont retournés, paginés `{ data: [], meta: { total, page, limit } }`

**Et** `PATCH /api/v1/products/:id` met à jour un produit existant (FR22)
**Et** `DELETE /api/v1/products/:id` supprime un produit (FR22)
**Et** `PATCH /api/v1/products/:id/toggle` active ou désactive un produit (FR25)
**Et** toutes les routes exigent le rôle `OWNER` ou `CO_MANAGER`

---

### Story 3.3 : Gestion des Variantes Libres

En tant que **vendeur**,
je veux définir des variantes libres sur mes produits (taille, couleur, volume, etc.),
afin que mon agent IA puisse guider les clients dans le choix de la bonne variante disponible.

**Critères d'Acceptation :**

**Étant donné** que le vendeur ajoute une variante sur un produit,
**Quand** `POST /api/v1/products/:id/variants` est appelé,
**Alors** chaque valeur de variante est enregistrée comme une entrée `ProductVariant` distincte (FR23)

**Étant donné** que le vendeur tente de supprimer une variante qui a des commandes associées,
**Quand** `DELETE /api/v1/products/:productId/variants/:variantId` est appelé,
**Alors** la variante est désactivée (`isActive: false`) plutôt que supprimée, pour conserver l'historique des commandes

---

### Story 3.4 : Gestion des Niveaux de Stock

En tant que **vendeur**,
je veux définir et mettre à jour le stock disponible pour chaque variante de mes produits,
afin que mon agent IA vérifie la disponibilité en temps réel avant de confirmer une commande.

**Critères d'Acceptation :**

**Étant donné** que le vendeur saisit une quantité pour une variante,
**Quand** `PATCH /api/v1/stock/:variantId` est appelé,
**Alors** le `StockLevel.quantity` est mis à jour (FR24)

**Étant donné** qu'une commande est confirmée pour une variante,
**Quand** la quantité commandée est débitée du stock,
**Alors** le `StockLevel.quantity` est décrémenté atomiquement (transaction Prisma, pas de race condition)

**Et** `GET /api/v1/stock?productId=:id` retourne les niveaux de toutes les variantes d'un produit
**Et** les stocks sont des entiers — jamais de décimales

---

### Story 3.5 : Alertes de Rupture de Stock

En tant que **vendeur**,
je veux configurer un seuil d'alerte par variante et recevoir une notification quand le stock est critique,
afin de réapprovisionner à temps et éviter que mon agent refuse des commandes.

**Critères d'Acceptation :**

**Étant donné** que le vendeur configure un seuil d'alerte sur une variante,
**Quand** `PATCH /api/v1/stock/:variantId/threshold` est appelé,
**Alors** le `StockLevel.alertThreshold` est mis à jour (FR26)

**Étant donné** qu'un décrément de stock fait passer la quantité sous le seuil,
**Quand** le processor BullMQ `stock-alerts` évalue le niveau,
**Alors** un événement SSE `stock.alert` est émis au vendeur en ≤ 30 secondes (NFR3, FR27)
**Et** l'alerte n'est émise qu'une fois par franchissement de seuil (pas de spam)

---

### Story 3.6 : Interface Catalogue Frontend

En tant que **vendeur**,
je veux gérer mon catalogue depuis le dashboard mobile,
afin d'ajouter, modifier et organiser mes produits facilement depuis mon téléphone.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/catalogue`,
**Quand** des produits existent,
**Alors** une grille 2 colonnes s'affiche (2×158px sur 360px), chaque carte affiche la photo en héros (≥60%), nom, prix et stock sans tap supplémentaire

**Étant donné** que le catalogue est vide,
**Quand** la page se charge,
**Alors** un état vide motivant s'affiche avec CTA "Ajouter votre premier produit" (UX-DR21)

**Étant donné** que le vendeur appuie sur "Ajouter un produit",
**Quand** le formulaire s'ouvre (Sheet),
**Alors** il peut saisir : nom, prix, description, photo depuis galerie, variantes, stock par variante
**Et** la validation utilise le schéma Zod `packages/shared/schemas/product.schema.ts`
**Et** les états de chargement utilisent `<ProductsSkeleton />` (UX-DR20)

---

## Epic 4 : Agent WhatsApp IA & Conversations

L'agent IA gère les conversations WhatsApp de bout en bout : identification d'intention, guidage variantes, collecte adresse livraison, calcul avance, réception photo reçu Mobile Money, création automatique de la commande, détection situations complexes avec transfert au vendeur. Le vendeur peut prendre le contrôle en 1 tap et le remettre à l'agent. C'est le cœur de la proposition de valeur Whatsell.

### Story 4.1 : Schéma BDD Conversations & Commandes (base) *(Technical Story — aucune valeur utilisateur directe)*

En tant que **développeur**,
je veux créer les tables `WhatsappConversation`, `Order`, `Customer` et `OrderItem` dans Prisma,
afin de disposer du schéma de données nécessaire à l'agent et aux commandes.

**Critères d'Acceptation :**

**Étant donné** que la migration Prisma est exécutée,
**Quand** le schéma est appliqué,
**Alors** les tables suivantes existent avec `tenantId` obligatoire : `whatsapp_conversations` (id, tenantId, customerPhone, status, context JSON), `orders` (id, tenantId, customerId, status, totalAmount entier, advanceAmount entier, receiptUrl), `customers` (id, tenantId, phone, name, address), `order_items` (id, orderId, variantId, quantity, unitPrice entier)
**Et** un test d'intégration vérifie l'isolation multi-tenant sur chaque table (NFR8)

---

### Story 4.2 : Réception des Webhooks Twilio (Queue)

En tant que **développeur**,
je veux que les webhooks WhatsApp entrants (Twilio) soient reçus, validés et mis en queue immédiatement,
afin que l'agent puisse absorber jusqu'à 1 000 messages simultanés sans perte.

**Critères d'Acceptation :**

**Étant donné** que Twilio envoie un webhook `POST /api/v1/webhooks/whatsapp`,
**Quand** la requête arrive,
**Alors** la signature Twilio est validée (rejeté si invalide : 403)
**Et** le message est mis en queue `whatsapp-messages` en moins de 100ms — zéro traitement synchrone
**Et** Twilio reçoit un `200 OK` immédiat

**Étant donné** que l'API Twilio est indisponible,
**Quand** les messages entrants arrivent quand même dans la queue,
**Alors** ils sont conservés et traités à la reprise du service (NFR19)
**Et** l'erreur est journalisée avec horodatage et contexte (NFR20)

---

### Story 4.3 : Processor IA — Identification d'Intention & Réponse

En tant que **client WhatsApp**,
je veux que l'agent IA comprenne mon message et me réponde de façon pertinente en français,
afin de commencer une commande sans attendre que le vendeur soit disponible.

**Critères d'Acceptation :**

**Étant donné** que le processor `whatsapp-messages` reçoit un job,
**Quand** le message est envoyé à l'API LLM,
**Alors** l'intention est identifiée parmi : `commande`, `question_produit`, `suivi_commande`, `autre` (FR6)
**Et** une réponse en français est générée et envoyée au client via Twilio en ≤ 3 minutes (NFR1)

**Étant donné** que l'API LLM dépasse le timeout de 3 minutes,
**Quand** le timeout est détecté,
**Alors** un message d'attente est envoyé au client et la conversation est marquée `pending_handoff` (NFR18)
**Et** le vendeur est notifié via SSE `conversation.handoff_required`

**Étant donné** que l'agent est indisponible (erreur critique),
**Quand** un message arrive,
**Alors** un message d'attente automatique est envoyé au client plutôt qu'un silence (NFR12)

---

### Story 4.4 : Flux de Vente — Guidage Variantes & Collecte Livraison

En tant que **client WhatsApp**,
je veux que l'agent m'aide à choisir la bonne variante disponible et collecte mon adresse de livraison,
afin de passer une commande complète sans quitter WhatsApp.

**Critères d'Acceptation :**

**Étant donné** que le client exprime un intérêt pour un produit,
**Quand** le produit a des variantes actives avec stock > 0,
**Alors** l'agent liste les variantes disponibles et demande le choix du client (FR7)

**Étant donné** que le client a choisi une variante,
**Quand** le stock est confirmé disponible en temps réel,
**Alors** l'agent collecte l'adresse de livraison complète du client (FR8)

**Étant donné** qu'une variante demandée est hors stock,
**Quand** le client fait sa demande,
**Alors** l'agent propose les variantes alternatives disponibles plutôt que de simplement refuser

---

### Story 4.5 : Flux de Paiement — Calcul Avance & Réception Reçu

En tant que **client WhatsApp**,
je veux que l'agent me communique le montant de l'avance et réceptionne ma photo de reçu Mobile Money,
afin de finaliser ma commande sans intervention du vendeur.

**Critères d'Acceptation :**

**Étant donné** que l'adresse de livraison est collectée,
**Quand** l'agent calcule l'avance,
**Alors** le montant est calculé selon le pourcentage configuré par le vendeur (entiers FCFA) et communiqué avec le numéro Mobile Money (FR9)

**Étant donné** que le client envoie une photo de reçu,
**Quand** l'agent la réceptionne,
**Alors** la photo est uploadée sur R2 sous `{tenantId}/receipts/{uuid}` (FR10, NFR10)
**Et** l'URL signée est stockée dans `orders.receiptUrl`

**Étant donné** que le client n'envoie pas de reçu dans les 30 minutes,
**Quand** le timeout est atteint,
**Alors** l'agent envoie une relance unique, puis archive la conversation sans commande si pas de réponse

---

### Story 4.6 : Création Automatique de Commande

En tant que **vendeur**,
je veux que l'agent crée automatiquement une commande dans mon dashboard après réception du reçu,
afin de recevoir une notification et valider la vente sans avoir géré la conversation.

**Critères d'Acceptation :**

**Étant donné** que la photo de reçu est réceptionnée,
**Quand** l'agent finalise la conversation,
**Alors** une commande est créée avec statut `pending`, les `order_items` liés, le `customerId` (créé si nouveau client), et l'`receiptUrl` (FR11)
**Et** l'agent envoie au client une confirmation avec numéro de suivi
**Et** un événement SSE `order.created` est émis au vendeur si le dashboard est ouvert (FR16, NFR3)
**Et** une Web Push Notification est envoyée au vendeur via le Service Worker (Story 1.12) — dashboard ouvert ou fermé — avec deep link vers la fiche commande (UX-DR11)
**Et** la notification parvient au vendeur en ≤ 30 secondes (NFR3)
**Et** le stock de la variante est décrémenté atomiquement

---

### Story 4.7 : Détection de Situations Complexes & Transfert Vendeur

En tant que **vendeur**,
je veux que l'agent détecte les situations hors de sa portée et me les transfère immédiatement,
afin d'intervenir uniquement quand c'est nécessaire.

**Critères d'Acceptation :**

**Étant donné** que l'agent détecte une situation hors-périmètre,
**Quand** la détection se produit,
**Alors** l'agent envoie un message d'attente au client, marque la conversation `pending_handoff`, et émet SSE `conversation.handoff_required` avec résumé du contexte (FR12)

**Étant donné** que le client demande le statut de sa commande existante,
**Quand** l'agent identifie l'intention `suivi_commande`,
**Alors** l'agent retrouve la commande par numéro ou téléphone client et communique le statut en clair (FR13)

---

### Story 4.8 : Takeover Vendeur & Retour à l'Agent

En tant que **vendeur**,
je veux prendre le contrôle d'une conversation WhatsApp active en 1 tap et le remettre à l'agent quand j'ai terminé,
afin d'intervenir rapidement sur les situations complexes sans perdre le contexte.

**Critères d'Acceptation :**

**Étant donné** que le vendeur appuie sur "Prendre en charge" sur une conversation,
**Quand** `PATCH /api/v1/conversations/:id/takeover` est appelé,
**Alors** la conversation passe en statut `vendor_controlled`, l'agent s'efface, et le contexte complet est visible immédiatement (FR14)
**Et** un bandeau orange "Vous êtes en ligne — l'agent attend" s'affiche (UX-DR16)

**Étant donné** que le vendeur appuie sur "Remettre à l'agent",
**Quand** `PATCH /api/v1/conversations/:id/release` est appelé,
**Alors** la conversation repasse en `ai_controlled`, l'agent reprend avec le contexte de l'intervention (FR15)
**Et** le geste est aussi simple et rapide que la prise de contrôle (UX-DR17)

---

### Story 4.9 : Vue Conversations Dashboard & Mode Supervision

En tant que **vendeur**,
je veux consulter l'état de toutes mes conversations WhatsApp actives depuis le dashboard,
afin de superviser mon agent et intervenir si nécessaire.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/conversations`,
**Quand** des conversations sont en cours,
**Alors** la liste affiche : numéro/nom client, statut (IA / vendeur / intervention requise), dernier message, heure — avec `<ConversationBubble />` (UX-DR16)
**Et** les conversations nécessitant une intervention sont mises en évidence en haut de la liste

**Étant donné** que le vendeur est dans ses 7 premiers jours et que le mode supervision est activé,
**Quand** l'agent génère une réponse,
**Alors** une notification est envoyée au vendeur avant l'envoi, avec option "Approuver" ou "Modifier" (UX-DR24)

**Et** les états de chargement utilisent `<ConversationsSkeleton />` (UX-DR20)

---

## Epic 5 : Gestion des Commandes & Facturation

Le vendeur gère le cycle de vie complet de ses commandes : liste filtrée par statut, fiche détail avec photo reçu Mobile Money en héros, progression dans le pipeline 5 statuts, génération de factures PDF personnalisées. L'expérience définissante (notification → fiche commande → vérification reçu → confirmation en <30s) est pleinement opérationnelle.

### Story 5.1 : API Commandes — Liste & Détail

En tant que **vendeur**,
je veux consulter la liste de mes commandes avec filtres par statut et accéder au détail de chacune,
afin d'avoir une visibilité complète sur mon activité commerciale.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/orders` est appelé,
**Quand** la requête est traitée,
**Alors** les commandes du tenant sont retournées paginées, filtrables par `status`, triées par `createdAt` desc (FR17)
**Et** la réponse est `{ data: Order[], meta: { total, page, limit } }`

**Étant donné** que `GET /api/v1/orders/:id` est appelé,
**Quand** la requête est traitée,
**Alors** la commande complète est retournée : produits, variantes, client, montants, `receiptUrl` (presigned URL temporaire), statut (FR18)
**Et** les rôles `OWNER`, `CO_MANAGER` et `SELLER` ont accès en lecture (FR21)

---

### Story 5.2 : Progression des Statuts de Commande

En tant que **vendeur**,
je veux faire progresser le statut d'une commande étape par étape,
afin de suivre chaque vente depuis la confirmation jusqu'à la livraison.

**Critères d'Acceptation :**

**Étant donné** que `PATCH /api/v1/orders/:id/status` est appelé avec le statut suivant,
**Quand** la transition est valide (en_attente → confirmée → en_preparation → expediee → livree),
**Alors** le statut est mis à jour et un événement SSE `order.status_changed` est émis (FR19)

**Étant donné** qu'une transition de statut invalide est tentée,
**Quand** l'appel API est reçu,
**Alors** une erreur `400 Bad Request` est retournée avec message explicite

**Et** les rôles `OWNER`, `CO_MANAGER` et `SELLER` peuvent mettre à jour les statuts (FR21)
**Et** chaque changement de statut est consigné dans le log d'audit (NFR9)

---

### Story 5.3 : Interface Liste des Commandes (Expérience Définissante — Partie 1)

En tant que **vendeur**,
je veux consulter ma liste de commandes depuis le dashboard mobile avec navigation rapide,
afin de traiter mes commandes en attente en quelques secondes.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/orders`,
**Quand** des commandes existent,
**Alors** chaque ligne affiche : numéro commande, nom produit, montant en `heading-lg`, statut avec `<OrderStatusPipeline />` (couleur + icône + label), heure de création
**Et** les commandes en statut `pending` apparaissent en tête de liste

**Étant donné** que le vendeur swipe une commande vers la gauche,
**Quand** le geste est reconnu,
**Alors** l'action "Confirmer" est révélée comme action principale (UX-DR14)

**Et** les états de chargement utilisent `<OrdersSkeleton />` (UX-DR20)
**Et** un état vide motivant s'affiche si aucune commande n'existe (UX-DR21)

---

### Story 5.4 : Fiche Commande & Confirmation (Expérience Définissante — Partie 2)

En tant que **vendeur**,
je veux ouvrir une fiche commande depuis une notification et confirmer la commande en moins de 30 secondes,
afin de valider les ventes de mon agent même en déplacement.

**Critères d'Acceptation :**

**Étant donné** que le vendeur tape sur une notification `order.created`,
**Quand** le deep link s'ouvre,
**Alors** la fiche commande s'ouvre directement sans navigation intermédiaire (UX-DR11)
**Et** la photo du reçu Mobile Money est le premier élément visible, affichée en grand avec tap pour agrandir (UX-DR12)
**Et** le montant total est en `heading-lg` (20px/600)
**Et** un seul CTA primaire "Confirmer la commande" domine visuellement
**Et** un CTA secondaire discret "Signaler un problème" est présent

**Étant donné** que le vendeur appuie sur "Confirmer la commande",
**Quand** `PATCH /api/v1/orders/:id/status` est appelé avec `confirmed`,
**Alors** une animation checkmark vert 200ms s'affiche (UX-DR13)
**Et** un toast "Commande #X confirmée · Le client a été notifié" apparaît
**Et** le retour à la liste des commandes est automatique après 1.5s

---

### Story 5.5 : Dashboard Accueil — Header Hero Stats

En tant que **vendeur**,
je veux voir un résumé de mon activité dès l'ouverture du dashboard,
afin de comprendre l'état de mon business en un coup d'œil sans naviguer.

**Critères d'Acceptation :**

**Étant donné** que le vendeur ouvre le dashboard `/`,
**Quand** la page se charge,
**Alors** un header indigo affiche exactement 3 métriques : commandes en attente, CA du mois (entiers FCFA), statut agent via `<AgentStatusIndicator />` (UX-DR15)
**Et** la liste des commandes en attente est visible immédiatement sous le header, sans scroll
**Et** la page se charge en ≤ 3 secondes sur 3G (NFR2)

---

### Story 5.6 : Génération de Facture PDF

En tant que **vendeur**,
je veux générer une facture PDF personnalisée pour une commande,
afin d'envoyer un document professionnel à mon client.

**Critères d'Acceptation :**

**Étant donné** que `POST /api/v1/orders/:id/invoice` est appelé,
**Quand** la génération PDF s'exécute côté serveur NestJS via `@react-pdf/renderer`,
**Alors** un PDF est généré avec : logo boutique, nom boutique, numéro de commande séquentiel, produits + variantes + prix + total, coordonnées client (FR20, FR35)
**Et** le PDF est retourné en buffer dans la réponse API pour téléchargement direct
**Et** la génération s'effectue en ≤ 5 secondes (NFR4)

**Étant donné** que le vendeur appuie sur "Générer la facture" dans la fiche commande,
**Quand** le PDF est prêt,
**Alors** un aperçu avec le logo bien visible est affiché avant téléchargement (UX-DR26)

---

## Epic 6 : CRM, Analytics & Reporting

Le système crée automatiquement les fiches clients, les segmente (nouveau/régulier/VIP), et le vendeur accède à ses analytics business (CA, panier moyen, top produits, top clients) sur des périodes sélectionnées.

### Story 6.1 : Création Automatique & Gestion des Fiches Clients

En tant que **vendeur**,
je veux qu'une fiche client soit créée automatiquement à la première commande et consultable depuis le dashboard,
afin de connaître mes acheteurs et leur historique sans saisie manuelle.

**Critères d'Acceptation :**

**Étant donné** qu'une commande est créée par l'agent IA pour un numéro de téléphone inconnu,
**Quand** la commande est enregistrée,
**Alors** une fiche `Customer` est créée automatiquement avec : téléphone, nom (si fourni), adresse de livraison collectée (FR28)
**Et** toutes les commandes suivantes du même numéro sont liées à cette fiche

**Étant donné** que `GET /api/v1/customers/:id` est appelé,
**Quand** la requête est traitée,
**Alors** la fiche client est retournée avec la liste complète de ses commandes et leurs statuts (FR29)

**Et** `GET /api/v1/customers` retourne la liste paginée de tous les clients du tenant, filtrables par segment

---

### Story 6.2 : Segmentation Automatique des Clients

En tant que **vendeur**,
je veux que mes clients soient automatiquement classés en segments (nouveau / régulier / VIP),
afin d'identifier mes meilleurs clients et adapter ma relation commerciale.

**Critères d'Acceptation :**

**Étant donné** qu'une commande est livrée pour un client,
**Quand** la segmentation est recalculée,
**Alors** le segment est mis à jour : `nouveau` = 1 commande, `regulier` = 2–4 commandes, `vip` = 5+ commandes (FR30)

**Étant donné** que `GET /api/v1/customers?segment=vip` est appelé,
**Quand** la requête est traitée,
**Alors** seuls les clients VIP du tenant sont retournés

**Et** le segment est affiché avec badge coloré sur la fiche client et la liste

---

### Story 6.3 : Interface CRM Frontend

En tant que **vendeur**,
je veux consulter mes clients depuis le dashboard mobile,
afin de suivre mon portefeuille clients et accéder à l'historique d'un acheteur rapidement.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/customers`,
**Quand** des clients existent,
**Alors** chaque ligne affiche : `<Avatar />` (initiales), nom/téléphone, badge segment, nombre de commandes, dernière commande

**Étant donné** que le vendeur appuie sur un client,
**Quand** la fiche s'ouvre,
**Alors** l'historique complet des commandes est listé, chaque ligne cliquable vers la fiche commande

**Et** les états de chargement utilisent `<CustomersSkeleton />` (UX-DR20)
**Et** un état vide motivant s'affiche si aucun client (UX-DR21)

---

### Story 6.4 : API Analytics — Métriques Business

En tant que **vendeur**,
je veux accéder à mes métriques business via l'API,
afin que le dashboard analytics puisse afficher mes indicateurs clés de performance.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/analytics/summary?from=&to=` est appelé,
**Quand** la requête est traitée,
**Alors** la réponse retourne : CA total (entiers FCFA), panier moyen (entiers FCFA), nombre de commandes livrées, taux d'autonomie IA (FR31, FR32)

**Étant donné** que `GET /api/v1/analytics/top-products?limit=5` est appelé,
**Quand** la requête est traitée,
**Alors** les produits sont classés par CA généré sur la période (FR33)

**Étant donné** que `GET /api/v1/analytics/top-customers?limit=5` est appelé,
**Quand** la requête est traitée,
**Alors** les clients sont classés par montant total commandé (FR34)

**Et** les résultats analytics sont mis en cache Redis TTL 5 minutes (clé `cache:{tenantId}:analytics:{period}`)

---

### Story 6.5 : Interface Analytics Frontend

En tant que **vendeur**,
je veux consulter mes analytics business depuis le dashboard mobile,
afin d'avoir une vision claire de la performance de ma boutique.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/analytics`,
**Quand** la page se charge,
**Alors** les métriques suivantes sont affichées : CA sur la période, panier moyen, top 5 produits avec mini-bars visuelles, top 5 clients avec montants (UX-DR25)
**Et** un sélecteur de période permet de choisir : 7 jours, 30 jours, 3 mois

**Étant donné** qu'aucune commande n'existe sur la période sélectionnée,
**Quand** la page se charge,
**Alors** un état vide motivant s'affiche (UX-DR21)

**Et** les composants lourds sont chargés avec `dynamic(() => import(...), { ssr: false })` pour optimiser les performances 3G
**Et** les états de chargement utilisent `<AnalyticsSkeleton />` (UX-DR20)

---

## Epic 7 : Agent Conseiller IA

Le vendeur peut interroger en langage naturel ses données business et reçoit des alertes proactives automatiques : stocks critiques, tendances inhabituelles, clients inactifs. Son copilote business est opérationnel.

### Story 7.1 : Schéma BDD & API Chat Conseiller *(Technical Story — aucune valeur utilisateur directe)*

En tant que **développeur**,
je veux les tables et endpoints nécessaires à l'agent conseiller IA,
afin que le chat et les alertes proactives puissent persister et être consultables.

**Critères d'Acceptation :**

**Étant donné** que la migration Prisma est exécutée,
**Quand** le schéma est appliqué,
**Alors** la table `advisor_messages` existe avec `tenantId` obligatoire : id, tenantId, role (`user|assistant`), content, createdAt
**Et** `GET /api/v1/advisor/messages` retourne l'historique paginé des messages du tenant
**Et** `POST /api/v1/advisor/ask` accepte une question en langage naturel et retourne la réponse de l'agent

---

### Story 7.2 : Réponses IA sur les Données Vendeur

En tant que **vendeur**,
je veux poser des questions en langage naturel à mon agent conseiller sur mes données business,
afin d'obtenir des insights clairs et actionnables sans naviguer dans plusieurs écrans.

**Critères d'Acceptation :**

**Étant donné** que le vendeur envoie une question via `POST /api/v1/advisor/ask`,
**Quand** le LLM génère une réponse en s'appuyant sur les données analytics du tenant,
**Alors** la réponse est retournée en français clair avec données chiffrées si disponibles, en ≤ 3 minutes (FR36, NFR1)
**Et** la question et la réponse sont persistées dans `advisor_messages`

**Étant donné** que le LLM dépasse le timeout de 3 minutes,
**Quand** le timeout est détecté,
**Alors** une réponse de fallback est retournée : "Je suis en train d'analyser vos données, réessayez dans un instant." (NFR18)

**Et** le LLM n'a accès qu'aux données du tenant courant — jamais de données cross-tenant

---

### Story 7.3 : Alertes Proactives Automatiques

En tant que **vendeur**,
je veux recevoir des alertes proactives de mon agent conseiller sur les situations critiques de mon business,
afin d'agir avant que les problèmes n'impactent mes ventes.

**Critères d'Acceptation :**

**Étant donné** qu'un cron s'exécute quotidiennement via le processor `advisor-alerts`,
**Quand** il analyse les données du tenant,
**Alors** une alerte est générée et persistée dans `advisor_messages` selon les règles suivantes :

**Alerte stock critique (FR37) :**
- Déclenché si `StockLevel.quantity ≤ StockLevel.alertThreshold` pour une variante active
- Message : "Le stock de [Produit — Variante] est critique ([N] unités restantes). Réapprovisionnez pour éviter des refus de commande."

**Alerte tendance de vente inhabituelle (FR38) — règles concrètes :**
- Déclenché si le CA de la semaine courante (lundi→dimanche) est < 50% de la moyenne des 4 semaines précédentes
- Déclenché si aucune commande reçue depuis 7 jours consécutifs (pour un compte avec historique ≥ 30 jours)
- Message : "Vos ventes cette semaine sont en baisse de [X]% par rapport à votre moyenne. Vérifiez la disponibilité de vos produits populaires."

**Alerte client inactif (FR39) :**
- Déclenché si un client segmenté `régulier` ou `VIP` n'a pas passé de commande depuis 14+ jours
- Maximum 3 alertes clients inactifs par jour (les 3 clients VIP/réguliers les plus inactifs en priorité)
- Message : "[Prénom client] (VIP — [N] commandes) n'a pas commandé depuis [N] jours. C'est peut-être le bon moment pour le contacter."

**Étant donné** qu'une alerte proactive est générée,
**Quand** elle est persistée,
**Alors** un événement SSE `advisor.alert` est émis au vendeur si son dashboard est ouvert
**Et** chaque alerte est contextuelle et actionnable

**Et** le cron ne génère pas d'alertes dupliquées pour la même situation dans la même journée

---

### Story 7.4 : Interface Chat Conseiller Frontend

En tant que **vendeur**,
je veux accéder à mon agent conseiller depuis le dashboard comme un chat,
afin d'obtenir des réponses à mes questions business sans quitter l'application.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à la section conseiller,
**Quand** la page se charge,
**Alors** l'historique des messages est affiché dans une interface chat, les alertes proactives apparaissent comme messages assistant avec icône distincte

**Étant donné** que le vendeur envoie une question,
**Quand** la réponse de l'agent arrive,
**Alors** un indicateur "L'agent analyse vos données..." est affiché pendant le traitement (typing indicator)
**Et** la réponse s'affiche dans le fil de conversation

**Et** le composant `Command` shadcn/ui est utilisé avec suggestions de questions fréquentes
**Et** les états de chargement utilisent `<AdvisorSkeleton />` (UX-DR20)

---

## Epic 8 : Abonnements, Tiers & Collaborateurs

La couche monétisation complète : consultation abonnement, compteur de commandes, upgrade de tier, notifications d'approche de limite présentées comme accomplissements, gestion des collaborateurs (invitation, rôles, révocation) sur le tier Business.

### Story 8.1 : Schéma BDD Abonnements & Collaborateurs *(Technical Story — aucune valeur utilisateur directe)*

En tant que **développeur**,
je veux les tables `Subscription` et `Collaborator` dans Prisma,
afin de persister les données d'abonnement et de gestion des accès collaborateurs.

**Critères d'Acceptation :**

**Étant donné** que la migration Prisma est exécutée,
**Quand** le schéma est appliqué,
**Alors** la table `subscriptions` existe : id, tenantId, tier (`free|pro|business`), ordersUsed, ordersLimit, periodStart, periodEnd
**Et** la table `collaborators` existe : id, tenantId, userId, role (`co_manager|seller`), invitedAt, status (`pending|active|revoked`)
**Et** un test d'intégration vérifie l'isolation multi-tenant sur les deux tables (NFR8)

---

### Story 8.2 : Compteur de Commandes & Limites de Tier

En tant que **vendeur**,
je veux consulter mon abonnement actuel et le nombre de commandes IA restantes ce mois,
afin de savoir quand je dois upgrader pour ne pas perdre de ventes.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/subscription` est appelé,
**Quand** la requête est traitée,
**Alors** la réponse retourne : tier actuel, commandes utilisées ce mois, limite du tier, date de reset mensuel (FR40)

**Étant donné** qu'une commande est créée par l'agent IA,
**Quand** `ordersUsed` est incrémenté,
**Alors** si `ordersUsed / ordersLimit ≥ 0.9`, un événement SSE `subscription.limit_approaching` est émis au vendeur

**Étant donné** que le vendeur reçoit la notification d'approche de limite,
**Quand** le toast s'affiche,
**Alors** le message est formulé comme un accomplissement, pas une sanction (FR45, UX-DR23)

---

### Story 8.3 : Upgrade d'Abonnement

> **Décision V1 — Paiement Manuel :** Le paiement des abonnements est géré manuellement en V1. Le vendeur effectue un virement Mobile Money au fondateur, qui active l'abonnement manuellement via le Panel Admin. Aucune intégration de paiement automatique n'est requise pour cette story. Cette décision est révisable en V2 si le volume le justifie.

En tant que **vendeur**,
je veux upgrader mon abonnement vers un tier supérieur depuis le dashboard,
afin d'accéder à plus de commandes et de fonctionnalités sans interrompre mon activité.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/settings/subscription`,
**Quand** la page se charge,
**Alors** les 3 tiers sont affichés avec leurs caractéristiques : Free (20 cmd), Pro (100 cmd, 10 000 FCFA/mois), Business (fair use, 25 000 FCFA/mois, 3 collaborateurs)
**Et** le tier actuel est mis en évidence

**Étant donné** que le vendeur clique "Passer en Pro",
**Quand** le formulaire de demande d'upgrade s'affiche,
**Alors** les instructions de paiement Manuel sont visibles : numéro Orange Money / Moov Money du fondateur, montant exact, référence à mentionner dans le virement
**Et** un bouton "J'ai effectué mon virement" soumet la demande via `POST /api/v1/subscription/upgrade-request`
**Et** la demande est créée avec statut `pending_payment` et un email de confirmation est envoyé au vendeur

**Étant donné** que l'opérateur confirme la réception du virement dans le Panel Admin,
**Quand** `POST /api/v1/admin/subscription/:tenantId/activate` est appelé (rôle ADMIN requis),
**Alors** l'abonnement est mis à jour vers le tier demandé et les nouvelles limites sont immédiatement actives (FR41)
**Et** un email de confirmation "Votre abonnement Pro est actif !" est envoyé au vendeur
**Et** l'activation est consignée dans le log d'audit avec l'identité de l'opérateur (NFR9)

---

### Story 8.4 : Invitation de Collaborateurs (Business uniquement)

En tant que **propriétaire d'un compte Business**,
je veux inviter jusqu'à 3 collaborateurs par email avec un rôle défini,
afin de déléguer la gestion des commandes et du catalogue à mon équipe.

**Critères d'Acceptation :**

**Étant donné** que le vendeur est sur le tier Business avec moins de 3 collaborateurs actifs,
**Quand** `POST /api/v1/collaborators/invite` est appelé avec email + rôle,
**Alors** une invitation est créée avec statut `pending` et un email est envoyé au collaborateur (FR42, FR43)

**Étant donné** que le vendeur est sur le tier Free ou Pro,
**Quand** il tente d'inviter un collaborateur,
**Alors** une erreur `403 Forbidden` est retournée avec message explicite

**Étant donné** que le vendeur a déjà 3 collaborateurs actifs,
**Quand** il tente d'en inviter un quatrième,
**Alors** une erreur `400 Bad Request` est retournée
**Et** l'invitation est consignée dans le log d'audit (NFR9)

---

### Story 8.5 : Gestion des Accès Collaborateurs

En tant que **propriétaire d'un compte Business**,
je veux consulter mes collaborateurs actifs et révoquer leur accès si nécessaire,
afin de maintenir le contrôle sur qui accède à ma boutique.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/collaborators` est appelé,
**Quand** la requête est traitée,
**Alors** la liste des collaborateurs du tenant est retournée avec : nom, email, rôle, statut, date d'invitation

**Étant donné** que `DELETE /api/v1/collaborators/:id` est appelé par le propriétaire,
**Quand** la révocation est traitée,
**Alors** le collaborateur passe en statut `revoked`, ses sessions JWT sont invalidées immédiatement (FR44)
**Et** la révocation est consignée dans le log d'audit (NFR9)

---

### Story 8.6 : Interface Abonnement & Collaborateurs Frontend

En tant que **vendeur**,
je veux gérer mon abonnement et mes collaborateurs depuis les paramètres du dashboard,
afin d'avoir un contrôle complet sur ma souscription et mon équipe.

**Critères d'Acceptation :**

**Étant donné** que le vendeur accède à `/settings`,
**Quand** la page se charge,
**Alors** deux sections sont visibles : "Mon abonnement" (tier, jauge commandes utilisées/limite, bouton upgrade) et "Collaborateurs" (liste ou message d'upgrade si tier Free/Pro)

**Étant donné** que le vendeur est sur le tier Business,
**Quand** il accède à la section collaborateurs,
**Alors** il peut voir la liste des collaborateurs, inviter via formulaire (email + rôle), et révoquer en un tap avec confirmation `<Dialog />`

**Et** les états de chargement utilisent `<SettingsSkeleton />` (UX-DR20)

---

## Epic 9 : Panel Admin & Monitoring Plateforme

L'opérateur surveille la santé de toute la plateforme : état des connexions WhatsApp par compte vendeur, métriques globales, identification des comptes candidats à la conversion, envoi de notifications de support.

### Story 9.1 : Monitoring des Connexions WhatsApp

En tant que **opérateur plateforme**,
je veux consulter l'état de la connexion WhatsApp de chaque compte vendeur,
afin de détecter proactivement les déconnexions avant que les vendeurs ne signalent un problème.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/admin/whatsapp-connections` est appelé par un utilisateur `ADMIN`,
**Quand** la requête est traitée,
**Alors** la liste de tous les comptes vendeurs est retournée avec : nom boutique, numéro WhatsApp, statut (`connected|disconnected|token_expired`), dernière activité (FR48)
**Et** les routes `/api/v1/admin/*` bypassent le filtre tenant (accès cross-tenant en lecture seule)

**Étant donné** que le cron `whatsapp-health-check` s'exécute toutes les 5 minutes,
**Quand** un token est révoqué ou expiré,
**Alors** le statut est mis à jour et un événement SSE `agent.status_changed` est émis au vendeur concerné en ≤ 5 minutes (NFR14)

---

### Story 9.2 : Support Vendeur — Notifications Opérateur

En tant que **opérateur plateforme**,
je veux envoyer des notifications de support à un vendeur spécifique,
afin de l'informer d'un problème ou lui envoyer un guide de résolution sans qu'il ait besoin de contacter le support.

**Critères d'Acceptation :**

**Étant donné** que `POST /api/v1/admin/vendors/:tenantId/notify` est appelé par l'opérateur,
**Quand** la requête est traitée,
**Alors** un email est envoyé au vendeur avec le message et un lien d'action si applicable (FR49)
**Et** la notification est journalisée dans le log d'audit avec : opérateur, tenantId cible, message, timestamp (NFR9)

---

### Story 9.3 : Métriques Globales de la Plateforme

En tant que **opérateur plateforme**,
je veux consulter les métriques globales agrégées de toute la plateforme,
afin de suivre la santé du produit et identifier les opportunités de croissance.

**Critères d'Acceptation :**

**Étant donné** que `GET /api/v1/admin/metrics` est appelé,
**Quand** la requête est traitée,
**Alors** la réponse retourne : vendeurs actifs (≥1 cmd/mois), taux d'autonomie IA global, temps de réponse agent moyen, MRR total (entiers FCFA), répartition par tier (FR50)

**Étant donné** que `GET /api/v1/admin/conversion-candidates` est appelé,
**Quand** la requête est traitée,
**Alors** les comptes Free ayant utilisé ≥ 18 commandes ce mois sont listés, triés par usage décroissant (FR51)

**Et** les métriques globales sont mises en cache Redis TTL 5 minutes

---

### Story 9.4 : Interface Panel Admin Frontend

En tant que **opérateur plateforme**,
je veux un dashboard admin dédié accessible uniquement avec le rôle `ADMIN`,
afin d'avoir une vue centralisée sur la santé de la plateforme et les actions de support.

**Critères d'Acceptation :**

**Étant donné** qu'un utilisateur `ADMIN` accède à `/admin`,
**Quand** la page se charge,
**Alors** le dashboard affiche : métriques globales, liste des connexions WhatsApp avec statut coloré, liste des candidats à la conversion

**Étant donné** qu'un utilisateur sans rôle `ADMIN` tente d'accéder à `/admin`,
**Quand** la requête est reçue,
**Alors** il est redirigé vers `/dashboard` avec un message "Accès non autorisé"

**Étant donné** que l'opérateur clique sur un vendeur déconnecté,
**Quand** le panneau de détail s'ouvre (Sheet),
**Alors** il peut voir les détails du compte et envoyer une notification de support directement depuis l'interface

**Et** les états de chargement utilisent `<AdminSkeleton />` (UX-DR20)
