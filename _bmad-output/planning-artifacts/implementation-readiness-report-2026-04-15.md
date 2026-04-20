---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
documentsInventoried:
  - prd: '_bmad-output/planning-artifacts/prd.md'
  - architecture: '_bmad-output/planning-artifacts/architecture.md'
  - epics: '_bmad-output/planning-artifacts/epics.md'
  - ux: '_bmad-output/planning-artifacts/ux-design-specification.md'
date: '2026-04-15'
project: 'Whatsell'
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-15
**Project:** Whatsell

---

## Inventaire des Documents

| Type | Fichier | Taille | Dernière modification |
|------|---------|--------|----------------------|
| PRD | `prd.md` | 34 Ko | 2026-04-11 |
| Architecture | `architecture.md` | 50 Ko | 2026-04-11 |
| Epics & Stories | `epics.md` | 83 Ko | 2026-04-15 |
| UX Design | `ux-design-specification.md` | 65 Ko | 2026-04-11 |

---

## Analyse du PRD

### Exigences Fonctionnelles (EF)

**Compte & Onboarding (FR1–FR5)**

- FR1 : Le vendeur peut créer un compte Whatsell avec email et mot de passe
- FR2 : Le vendeur peut connecter son numéro WhatsApp Business via un wizard guidé en 5 étapes
- FR3 : Le vendeur peut configurer les règles de paiement (pourcentage d'avance, modes acceptés)
- FR4 : Le vendeur peut personnaliser son profil boutique (nom, logo)
- FR5 : Le vendeur peut déconnecter et reconnecter son numéro WhatsApp Business depuis le dashboard

**Agent WhatsApp IA (FR6–FR16)**

- FR6 : L'agent IA identifie l'intention d'un message entrant (commande, question produit, suivi, autre)
- FR7 : L'agent IA guide le client dans la sélection de variantes disponibles en stock
- FR8 : L'agent IA collecte les coordonnées de livraison au cours d'une conversation
- FR9 : L'agent IA calcule le montant de l'avance selon les règles du vendeur
- FR10 : L'agent IA demande et réceptionne la photo du justificatif Mobile Money
- FR11 : L'agent IA crée automatiquement une commande dans le dashboard à l'issue d'une vente
- FR12 : L'agent IA détecte une situation hors portée et notifie le vendeur pour prise en charge
- FR13 : L'agent IA informe un client du statut de sa commande existante
- FR14 : Le vendeur peut prendre le contrôle d'une conversation WhatsApp active depuis le dashboard
- FR15 : Le vendeur peut remettre le contrôle d'une conversation à l'agent IA
- FR16 : Le vendeur reçoit une notification en temps réel lorsqu'une commande est créée par l'IA

**Gestion des Commandes (FR17–FR21)**

- FR17 : Le vendeur consulte la liste des commandes avec filtres par statut
- FR18 : Le vendeur consulte le détail d'une commande (produits, variantes, client, montant, photo reçu)
- FR19 : Le vendeur fait progresser le statut d'une commande (en attente → confirmée → en préparation → expédiée → livrée)
- FR20 : Le vendeur génère une facture PDF pour une commande
- FR21 : Le collaborateur "Vendeur" peut consulter et mettre à jour le statut des commandes

**Catalogue & Stocks (FR22–FR27)**

- FR22 : Le vendeur peut créer, modifier et supprimer des produits
- FR23 : Le vendeur peut définir des variantes libres sur un produit (nom + valeurs)
- FR24 : Le vendeur peut définir et mettre à jour un niveau de stock par variante
- FR25 : Le vendeur peut activer ou désactiver la disponibilité d'un produit
- FR26 : Le vendeur peut configurer un seuil d'alerte de rupture de stock par produit
- FR27 : Le vendeur reçoit une alerte lorsqu'un niveau de stock atteint son seuil critique

**CRM & Clients (FR28–FR30)**

- FR28 : Le système crée automatiquement une fiche client à sa première commande
- FR29 : Le vendeur consulte la fiche client avec son historique de commandes complet
- FR30 : Le système segmente automatiquement les clients (nouveau / régulier / VIP)

**Analytics & Reporting (FR31–FR35)**

- FR31 : Le vendeur consulte son chiffre d'affaires sur une période sélectionnée
- FR32 : Le vendeur consulte le panier moyen de ses commandes
- FR33 : Le vendeur consulte le classement de ses produits les plus vendus
- FR34 : Le vendeur consulte le classement de ses clients les plus actifs
- FR35 : Le vendeur génère une facture PDF personnalisée avec logo et nom de boutique

**Agent Conseiller IA (FR36–FR39)**

- FR36 : Le vendeur pose des questions en langage naturel sur ses données business
- FR37 : L'agent conseiller génère des alertes proactives sur les stocks critiques
- FR38 : L'agent conseiller génère des alertes proactives sur les tendances de vente inhabituelles
- FR39 : L'agent conseiller génère des alertes proactives sur les clients inactifs

**Abonnements & Collaborateurs (FR40–FR45)**

- FR40 : Le vendeur consulte son abonnement actuel et le nombre de commandes restantes
- FR41 : Le vendeur peut upgrader son abonnement depuis le dashboard
- FR42 : Le propriétaire Business peut inviter jusqu'à 3 collaborateurs par email
- FR43 : Le propriétaire attribue un rôle (Co-gérant / Vendeur) à l'invitation
- FR44 : Le propriétaire peut révoquer l'accès d'un collaborateur à tout moment
- FR45 : Le système notifie le vendeur lorsqu'il approche de la limite mensuelle de son tier

**Essai Gratuit & Conversion (FR46–FR47)**

- FR46 : Essai gratuit 7 jours Pro automatique à l'inscription → bascule Free à expiration si pas d'abonnement
- FR47 : Notification à J-2 avant fin d'essai Pro pour inviter à souscrire

**Panel Admin & Opérateur (FR48–FR51)**

- FR48 : L'opérateur consulte l'état de la connexion WhatsApp de chaque compte vendeur
- FR49 : L'opérateur envoie une notification de support à un vendeur spécifique
- FR50 : L'opérateur consulte les métriques globales (taux autonomie IA, temps réponse, vendeurs actifs, MRR)
- FR51 : L'opérateur identifie les comptes approchant la limite de leur tier (candidats conversion)

**Total EF : 51 exigences fonctionnelles**

---

### Exigences Non-Fonctionnelles (ENF)

**Performance (NFR1–NFR4)**

- NFR1 : Réponse agent IA ≤ 3 minutes par message (priorité qualité > vitesse)
- NFR2 : Pages dashboard chargées en ≤ 3 secondes sur connexion 3G mobile (≥ 1 Mbps)
- NFR3 : Notifications temps réel (commande, alerte stock) ≤ 30 secondes après événement
- NFR4 : Génération facture PDF ≤ 5 secondes

**Sécurité (NFR5–NFR10)**

- NFR5 : Toutes les données chiffrées en transit via TLS 1.2 minimum
- NFR6 : Données sensibles (commandes, clients, conversations) chiffrées au repos
- NFR7 : JWT avec expiration courte — accès 15 min, refresh 7 jours
- NFR8 : Isolation multi-tenant stricte — aucun accès cross-tenant possible même par erreur applicative
- NFR9 : Actions sensibles (règles de paiement, export, collaborateurs) consignées dans log d'audit horodaté
- NFR10 : Photos de reçus Mobile Money accessibles uniquement au compte vendeur concerné et à l'opérateur

**Fiabilité (NFR11–NFR14)**

- NFR11 : Agent WhatsApp IA disponible > 99% sur plages actives (06h–23h heure locale)
- NFR12 : En cas d'indisponibilité IA, message d'attente automatique au client (pas de silence)
- NFR13 : Zéro perte de données commandes/stocks — sauvegardes quotidiennes, rétention 30 jours
- NFR14 : Détection déconnexion token WhatsApp Business et notification opérateur en ≤ 5 minutes

**Scalabilité (NFR15–NFR17)**

- NFR15 : Supporte croissance 50 → 500 comptes actifs sans dégradation de performance
- NFR16 : Webhooks WhatsApp traités de façon asynchrone via queue — absorbe pics jusqu'à 1 000 messages simultanés sans perte
- NFR17 : Architecture extensible à de nouveaux marchés géographiques sans refactoring majeur

**Intégration (NFR18–NFR20)**

- NFR18 : En cas de timeout LLM (> 3 min), transfert automatique au vendeur avec message d'explication au client
- NFR19 : En cas d'indisponibilité WhatsApp API, messages en queue et traités à la reprise
- NFR20 : Journalisation de toutes les erreurs d'intégration (WhatsApp, LLM, stockage) avec horodatage et contexte

**Total ENF : 20 exigences non-fonctionnelles**

---

### Exigences Complémentaires & Contraintes

**Réglementaires**
- Aucune licence BCEAO requise en V1 (Whatsell ne touche pas aux flux financiers)
- Conformité politique WhatsApp Business (conversations initiées par le client, fenêtre 24h, pas de marketing non sollicité)

**Intégrations requises**
- WhatsApp Business API via Twilio BSP (webhooks bidirectionnels, criticité : critique)
- LLM API externe (OpenAI ou équivalent, timeout 3 min, fallback transfert vendeur)
- Stockage fichiers objet type S3 (photos reçus, logos, factures PDF)
- Service email transactionnel (notifications onboarding, alertes compte)

**Contraintes techniques**
- Architecture API REST, domaines séparés
- Dashboard mobile-first (360px en priorité)
- Hébergement cloud international — région Europe ou Afrique du Sud recommandée
- Rate limiting par compte

**Risques acceptés documentés**
- Falsification de reçus Mobile Money → validation manuelle vendeur en V1
- Révocation token WhatsApp par Meta → alerte + guide reconnexion en V1
- Coûts variables IA tier Business → politique fair use à définir avant lancement

---

### Évaluation de Complétude du PRD

Le PRD est **complet et bien structuré**. Les exigences sont numérotées, les contraintes documentées, les risques acceptés sont explicites. Les parcours utilisateurs couvrent les 4 acteurs clés (vendeur solo, vendeuse multi-tâches, cliente finale, opérateur plateforme). La stratégie de phasing est claire.

**Point d'attention notable :** La politique "fair use" du tier Business (cap conversations IA) est référencée mais **non définie** dans le PRD — décision différée à l'implémentation. Ce point devra être vérifié dans l'architecture et les epics.

---

## Validation de Couverture des Epics

### Matrice de Couverture FR → Epic

| EF | Exigence (résumée) | Epic | Statut |
|----|-------------------|------|--------|
| FR1 | Création de compte email/mdp | Epic 2 | ✅ Couvert |
| FR2 | Wizard connexion WhatsApp Business (5 étapes) | Epic 2 | ✅ Couvert |
| FR3 | Règles de paiement boutique | Epic 2 | ✅ Couvert |
| FR4 | Profil boutique (nom, logo) | Epic 2 | ✅ Couvert |
| FR5 | Déconnexion/reconnexion WhatsApp | Epic 2 | ✅ Couvert |
| FR6 | Identification intention message IA | Epic 4 | ✅ Couvert |
| FR7 | Guidage variantes par l'agent | Epic 4 | ✅ Couvert |
| FR8 | Collecte coordonnées livraison | Epic 4 | ✅ Couvert |
| FR9 | Calcul avance Mobile Money | Epic 4 | ✅ Couvert |
| FR10 | Réception photo reçu Mobile Money | Epic 4 | ✅ Couvert |
| FR11 | Création automatique commande | Epic 4 | ✅ Couvert |
| FR12 | Détection situation complexe + transfert | Epic 4 | ✅ Couvert |
| FR13 | Info statut commande au client | Epic 4 | ✅ Couvert |
| FR14 | Takeover vendeur | Epic 4 | ✅ Couvert |
| FR15 | Retour contrôle à l'agent | Epic 4 | ✅ Couvert |
| FR16 | Notification temps réel commande IA | Epic 4 | ✅ Couvert |
| FR17 | Liste commandes avec filtres | Epic 5 | ✅ Couvert |
| FR18 | Détail commande + photo reçu | Epic 5 | ✅ Couvert |
| FR19 | Progression statuts pipeline | Epic 5 | ✅ Couvert |
| FR20 | Génération facture PDF | Epic 5 | ✅ Couvert |
| FR21 | Accès collaborateur "Vendeur" commandes | Epic 5 | ✅ Couvert |
| FR22 | CRUD produits catalogue | Epic 3 | ✅ Couvert |
| FR23 | Variantes libres produits | Epic 3 | ✅ Couvert |
| FR24 | Niveaux de stock par variante | Epic 3 | ✅ Couvert |
| FR25 | Activation/désactivation produit | Epic 3 | ✅ Couvert |
| FR26 | Seuil alerte rupture de stock | Epic 3 | ✅ Couvert |
| FR27 | Alerte atteinte seuil critique | Epic 3 | ✅ Couvert |
| FR28 | Création automatique fiche client | Epic 6 | ✅ Couvert |
| FR29 | Fiche client + historique commandes | Epic 6 | ✅ Couvert |
| FR30 | Segmentation auto (nouveau/régulier/VIP) | Epic 6 | ✅ Couvert |
| FR31 | CA sur période sélectionnée | Epic 6 | ✅ Couvert |
| FR32 | Panier moyen commandes | Epic 6 | ✅ Couvert |
| FR33 | Top produits les plus vendus | Epic 6 | ✅ Couvert |
| FR34 | Top clients les plus actifs | Epic 6 | ✅ Couvert |
| FR35 | Facture PDF personnalisée logo/boutique | Epic 6 | ✅ Couvert |
| FR36 | Questions langage naturel données business | Epic 7 | ✅ Couvert |
| FR37 | Alertes proactives stocks critiques | Epic 7 | ✅ Couvert |
| FR38 | Alertes proactives tendances inhabituelles | Epic 7 | ✅ Couvert |
| FR39 | Alertes proactives clients inactifs | Epic 7 | ✅ Couvert |
| FR40 | Consultation abonnement + commandes restantes | Epic 8 | ✅ Couvert |
| FR41 | Upgrade tier depuis dashboard | Epic 8 | ✅ Couvert |
| FR42 | Invitation collaborateurs (max 3) | Epic 8 | ✅ Couvert |
| FR43 | Attribution rôle collaborateur | Epic 8 | ✅ Couvert |
| FR44 | Révocation accès collaborateur | Epic 8 | ✅ Couvert |
| FR45 | Notification approche limite tier | Epic 8 | ✅ Couvert |
| FR46 | Essai gratuit Pro 7j + bascule Free | Epic 2 (Story 2.1, 2.8) | ⚠️ Incohérence label |
| FR47 | Notification J-2 fin essai Pro | Epic 2 (Story 2.8) | ⚠️ Incohérence label |
| FR48 | État connexion WhatsApp par compte | Epic 9 | ✅ Couvert |
| FR49 | Notification support à un vendeur | Epic 9 | ✅ Couvert |
| FR50 | Métriques globales plateforme | Epic 9 | ✅ Couvert |
| FR51 | Identification comptes candidats conversion | Epic 9 | ✅ Couvert |

### Exigences Manquantes

**Aucune EF du PRD n'est absente des epics** — couverture complète 51/51.

### Incohérences Identifiées

**FR46 & FR47 — Étiquetage "Epic 2/8" trompeur**

La Coverage Map indique "Epic 2/8" pour FR46 et FR47. Cependant, la liste des FRs d'Epic 8 ne mentionne ni FR46 ni FR47 (`FR40–FR45` uniquement). Ces deux exigences sont uniquement couvertes dans **Epic 2** (Story 2.1 et 2.8). Ce n'est pas une lacune de couverture, mais un étiquetage à corriger pour éviter toute confusion lors de l'implémentation.

### Statistiques de Couverture

- **Total EF PRD :** 51
- **EF couvertes dans les epics :** 51
- **Pourcentage de couverture :** 100%
- **Lacunes bloquantes :** 0
- **Incohérences mineures :** 1 (FR46/FR47 — étiquetage Coverage Map)

---

## Évaluation d'Alignement UX

### Statut du Document UX

Document trouvé : `ux-design-specification.md` (65 Ko, complet, 14 étapes de workflow terminées). Le document UX a été produit à partir du PRD — les personas, parcours utilisateurs et exigences sont entièrement cohérents.

### Alignement UX ↔ PRD

**Alignement fort ✅**

- Les 4 personas UX (Boubacar, Aminata, Fatoumata, Mamadou) correspondent exactement aux parcours du PRD
- L'expérience définissante (notification → fiche commande → vérification reçu → confirmation en <30s) est directement tracée depuis les FR11, FR16, FR18, FR19
- Les UX-DR1 à UX-DR26 sont tous référencés et couverts dans les epics (Epic 1 principalement)
- Les moments de succès critiques (aha moment, activation agent, reprise de contrôle) sont opérationnalisés dans Epic 2, 4 et 5

**Aucune exigence UX absente du PRD.**

### Alignement UX ↔ Architecture

**Alignement fort pour :**
- Design system Tailwind + shadcn/ui — confirmé dans l'architecture et Epic 1
- SSE endpoint pour notifications en temps réel dans le dashboard — couvert
- Cloudflare R2 pour photos de reçus, presigned URLs — couvert
- PDF via @react-pdf/renderer — couvert
- Mobile-first 360px / 3G — cible explicitement documentée

**⚠️ GAP CRITIQUE IDENTIFIÉ — Notifications background non spécifiées**

La promesse centrale de Whatsell — *"reçoit une notification pendant qu'il dormait / était en cours"* — implique une notification **hors dashboard** (application fermée, écran éteint). L'architecture ne spécifie que SSE (Server-Sent Events), qui requiert que le navigateur soit ouvert et le flux SSE actif.

| Scénario | SSE | Mécanisme manquant |
|----------|-----|-------------------|
| Dashboard ouvert | ✅ Fonctionne | — |
| Dashboard fermé / app en arrière-plan | ❌ Ne fonctionne pas | Web Push Notifications (PWA Service Worker), ou notification WhatsApp vendeur, ou email temps réel |

**Impact :** Si ce gap n'est pas adressé, le "aha moment" (FR16, NFR3) ne se produira que si le vendeur a déjà le dashboard ouvert — ce qui annule en partie la promesse de vente principale.

**Recommandation :** Choisir et documenter explicitement le canal de notification background avant l'implémentation de l'Epic 4. Les options pragmatiques pour V1 :
1. **Web Push via Service Worker** (PWA) — natif, gratuit, fonctionne sur Safari iOS depuis 2023
2. **Notification WhatsApp au vendeur** (via Twilio, même numéro que le BSP) — dans l'écosystème existant, mais nécessite un template WhatsApp approuvé Meta
3. **Email temps réel** — fallback acceptable mais peu émotionnel

### Avertissements

- **Aucun mode sombre** planifié en V1 — documenté et justifié dans la spec UX (usage en extérieur, mode clair prioritaire). ✅ Décision alignée.
- **UX-DR24 (mode supervision 7j)** — présent dans les epics (Story 4.7) mais non référencé dans les exigences NFR du PRD. Cohérent mais non traçable formellement.

---

## Revue Qualité des Epics

### 1. Validation de la Valeur Utilisateur par Epic

| Epic | Titre | Valeur utilisateur directe | Verdict |
|------|-------|--------------------------|---------|
| Epic 1 | Fondation Technique & Design System | ❌ Aucune — pure infrastructure | ⚠️ Technique |
| Epic 2 | Inscription & Activation Vendeur | ✅ Le vendeur peut activer son agent | ✅ Valide |
| Epic 3 | Catalogue & Gestion des Stocks | ✅ Le vendeur gère ses produits | ✅ Valide |
| Epic 4 | Agent WhatsApp IA & Conversations | ✅ L'agent vend autonomement | ✅ Valide |
| Epic 5 | Gestion des Commandes & Facturation | ✅ Le vendeur traite ses ventes | ✅ Valide |
| Epic 6 | CRM, Analytics & Reporting | ✅ Le vendeur pilote son activité | ✅ Valide |
| Epic 7 | Agent Conseiller IA | ✅ Le vendeur interroge ses données | ✅ Valide |
| Epic 8 | Abonnements, Tiers & Collaborateurs | ✅ Le vendeur gère accès et paiements | ✅ Valide |
| Epic 9 | Panel Admin & Monitoring | ✅ L'opérateur surveille la plateforme | ✅ Valide |

---

### 🔴 Violations Critiques

#### C1 — Forward Dependency : Story 2.4 → Epic 3 (BLOQUANT)

**Problème :** Story 2.4 (Wizard Étape 3 — Premier Produit au Catalogue) appelle `POST /api/v1/products`. Cet endpoint n'est créé qu'en Epic 3 Story 3.2. Si les epics sont implémentés dans l'ordre documenté (Epic 1 → 2 → 3), Story 2.4 ne peut pas fonctionner — l'API products n'existe pas encore.

**Impact :** L'onboarding est incomplet jusqu'à ce qu'Epic 3 soit partiellement livré. Le wizard est bloqué à l'étape 3/5.

**Résolution recommandée :** Deux options —
1. *(Préférable)* Déplacer Story 3.1 et Story 3.2 (schéma + API CRUD produits) en amont d'Epic 2 Story 2.4 — soit dans Epic 1, soit en reordonnant pour que les stories produits précèdent le wizard
2. Créer un endpoint minimal `POST /api/v1/products` dans Epic 2 Story 2.4 (limité au cas d'usage onboarding) et étendre en Epic 3

#### C2 — Epic 1 : Technical Epic sans valeur utilisateur directe

**Problème :** Epic 1 "Fondation Technique & Design System" est entièrement technique (monorepo, Prisma, JWT, BullMQ, CI/CD, design tokens). Aucun vendeur ne peut bénéficier de cet epic seul.

**Contexte atténuant :** Pour un projet greenfield, une fondation technique est inévitable. L'architecture le documente explicitement comme "prérequis absolu". Le workflow de création d'epics reconnaît ce cas pour les projets Greenfield.

**Verdict :** Violation des bonnes pratiques reconnue — acceptable dans ce contexte greenfield à condition que Epic 1 soit clairement labellisé comme fondation technique et traité en sprint 0. **Non bloquant pour l'implémentation.**

---

### 🟠 Problèmes Majeurs

#### M1 — Stories à persona "développeur" (4 stories)

Les stories suivantes utilisent "En tant que **développeur**" au lieu d'un persona utilisateur :
- Story 3.1 : Schéma BDD Produits & Variantes
- Story 4.1 : Schéma BDD Conversations & Commandes
- Story 7.1 : Schéma BDD & API Chat Conseiller
- Story 8.1 : Schéma BDD Abonnements & Collaborateurs

**Impact :** Ces stories de migration de schéma DB sont nécessaires mais n'ont pas de valeur métier directe. Elles devraient idéalement être intégrées dans les stories utilisateurs qui en ont besoin (par exemple, Story 4.6 crée des commandes — elle devrait inclure le schéma comme prérequis technique).

**Recommandation :** Traiter comme "technical stories" dans le backlog (format accepté pour les travaux d'infrastructure dans un sprint) ou les fusionner avec la première story utilisateur qui les consomme.

#### M2 — Story 8.3 : Upgrade d'abonnement sans mécanisme de paiement défini

**Problème :** Story 8.3 "Upgrade d'abonnement" appelle `POST /api/v1/subscription/upgrade` et met à jour le tier immédiatement — mais n'aborde pas la collecte du paiement (10 000 ou 25 000 FCFA). Aucun endpoint de paiement, aucune intégration Mobile Money pour les abonnements n'est mentionné dans les epics.

**Impact :** L'upgrade fonctionne techniquement mais sans paiement effectif — ce qui crée une fuite de revenus en production si non résolu. Le PRD mentionne les prix mais ne spécifie pas le mécanisme de paiement des abonnements.

**Recommandation :** Clarifier avant l'implémentation : est-ce un paiement manuel (virement Mobile Money au fondateur + activation manuelle) ou une intégration automatisée ? En V1, un flux manuel (vendor contacte le fondateur) est pragmatique mais doit être documenté.

#### M3 — Dépendance non documentée Epic 4 → Epic 3

**Problème :** L'agent IA (Epic 4) a besoin des produits et stocks du catalogue (Epic 3) pour guider les variantes (FR7) et vérifier la disponibilité (Story 4.4). Cette dépendance n'est pas documentée dans la liste des epics.

**Impact :** Si Epic 4 est développé avant Epic 3, l'agent ne peut pas vérifier les stocks ni guider les variantes.

**Résolution :** Documenter l'ordre de développement requis : Epic 1 → Epic 3 → Epic 2 → Epic 4 → Epic 5 → Epic 6 → Epic 7 → Epic 8 → Epic 9. (Notez que Epic 3 doit précéder Epic 2 pour résoudre également C1.)

---

### 🟡 Préoccupations Mineures

#### P1 — Story 4.6 : Notification SSE uniquement (lié au gap C3 UX)

Le critère d'acceptation de Story 4.6 précise "un événement SSE `order.created` est émis au vendeur en ≤ 30 secondes" — mais SSE ne fonctionne que si le dashboard est ouvert. Le "aha moment" (commande reçue pendant le sommeil) ne se produira que si le dashboard est actif. Lié au gap critique identifié en UX.

#### P2 — Story 7.3 : Définition des seuils d'alerte proactive

Le critère "tendance de vente inhabituelle" (FR38) n'est pas quantifié dans les critères d'acceptation de Story 7.3. Qu'est-ce qui constitue une "tendance inhabituelle" ? Aucun seuil ou algorithme de détection n'est spécifié. Risque de comportement IA imprévisible.

**Recommandation :** Spécifier des règles concrètes avant l'implémentation (ex : "CA cette semaine < 50% de la moyenne des 4 semaines précédentes").

#### P3 — Coverage Map FR46/FR47 : étiquetage "Epic 2/8" (déjà noté)

Déjà documenté dans la section Couverture des Epics.

---

### Checklist de Conformité par Epic

| Epic | Valeur utilisateur | Indépendance | Stories bien dimensionnées | Pas de dépendance forward | Critères d'acceptation clairs | Traçabilité FR |
|------|-------------------|--------------|--------------------------|--------------------------|-------------------------------|----------------|
| Epic 1 | ⚠️ Technique | ✅ | ✅ | ✅ | ✅ | N/A |
| Epic 2 | ✅ | ❌ Dépend Epic 3 | ✅ | ❌ Story 2.4 → Epic 3 | ✅ | ✅ |
| Epic 3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 4 | ✅ | ❌ Dépend Epic 3 | ✅ | ✅ | ✅ | ✅ |
| Epic 5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 7 | ✅ | ✅ | ✅ | ✅ | ⚠️ FR38 flou | ✅ |
| Epic 8 | ✅ | ✅ | ✅ | ✅ | ⚠️ Paiement abonnement | ✅ |
| Epic 9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Résumé & Recommandations

### Statut Global de Préparation à l'Implémentation

> ## ⚠️ NÉCESSITE DES AJUSTEMENTS AVANT IMPLÉMENTATION

Le projet Whatsell présente une base de planification solide et mature. La couverture des exigences est complète (51/51 FRs couverts), l'architecture est cohérente et bien documentée, et l'UX est rigoureusement spécifiée. Cependant, **3 points bloquants ou à risque élevé** doivent être résolus avant le démarrage du développement.

---

### Issues Critiques — Action Immédiate Requise

#### 🔴 BLOQUANT 1 — Dépendance Forward Story 2.4 → Epic 3

Story 2.4 (onboarding — ajout premier produit) appelle `POST /api/v1/products` qui n'existe qu'en Epic 3. L'ordre d'implémentation tel que documenté est incorrect. **L'onboarding sera cassé jusqu'à ce qu'Epic 3 soit partiellement livré.**

**Action :** Déplacer Story 3.1 (schéma BDD produits) et Story 3.2 (CRUD API produits) avant Story 2.4, ou créer un minimal viable endpoint dans Epic 2. L'ordre recommandé devient : **Epic 1 → Epic 3 (Stories 3.1–3.2) → Epic 2 → Epic 3 (Stories 3.3–3.6) → Epic 4 → ...**

#### 🔴 BLOQUANT 2 — Canal de Notification Background Non Spécifié

La promesse centrale de Whatsell ("reçoit une commande pendant qu'il dormait") suppose que le vendeur est notifié quand le dashboard est FERMÉ. L'architecture et les epics n'implémentent que les SSE (dashboard ouvert requis). **Le "aha moment" ne se produira pas si le vendeur n'a pas le dashboard actif.**

**Action :** Décider avant l'implémentation d'Epic 4 quel canal de notification background utiliser :
- **Option A (recommandée V1) :** Web Push Notifications via Service Worker (PWA) — natif, gratuit, compatible Safari iOS 16.4+, Chrome/Android — ajouter une Story dans Epic 1 ou Epic 4
- **Option B :** Notification WhatsApp au vendeur (via Twilio) — dans l'écosystème existant, nécessite un template Meta approuvé
- **Option C (fallback)** : Email temps réel — acceptable mais peu émotionnel

#### 🔴 CLARIFICATION REQUISE 3 — Mécanisme de Paiement des Abonnements

Story 8.3 implémente l'upgrade d'abonnement sans définir comment le paiement est collecté (10 000 / 25 000 FCFA). En production, les upgrades seraient gratuits si non résolus.

**Action :** Décider avant l'implémentation d'Epic 8 : paiement manuel (le fondateur active manuellement après virement Mobile Money reçu) ou automatique. En V1, le flux manuel est pragmatique — documenter la décision dans l'architecture.

---

### Recommandations Prioritaires

1. **Corriger l'ordre d'implémentation** — Réordonner pour que les Stories 3.1–3.2 précèdent Story 2.4. Documenter explicitement le graphe de dépendances inter-epics dans le document epics.md.

2. **Spécifier le canal de notification background** — Choisir et documenter une solution (Web Push PWA recommandé) et ajouter la story correspondante avant l'implémentation d'Epic 4. Ce choix impacte directement l'aha moment qui est le cœur de la rétention.

3. **Clarifier le flux de paiement des abonnements** — Documenter la décision V1 (manuel vs. automatique) dans l'architecture avant l'implémentation d'Epic 8.

4. **Quantifier les seuils d'alerte proactive (FR38)** — Avant d'implémenter Story 7.3, définir ce qui constitue une "tendance inhabituelles" de vente avec des règles concrètes et mesurables.

5. **Corriger l'étiquetage FR46/FR47 dans la Coverage Map** — Changer "Epic 2/8" en "Epic 2" pour éviter toute confusion lors de l'implémentation.

---

### Récapitulatif des Findings

| Catégorie | Critique 🔴 | Majeur 🟠 | Mineur 🟡 | Statut |
|-----------|-----------|---------|---------|--------|
| Couverture EF (PRD → Epics) | 0 | 0 | 1 (label) | ✅ 100% couverts |
| Alignement UX ↔ Architecture | 1 (push notifs) | 0 | 1 | ⚠️ 1 gap critique |
| Qualité des Epics | 1 (forward dep.) | 2 | 2 | ⚠️ 3 issues |
| **Total** | **2** | **2** | **4** | **⚠️ 8 findings** |

---

### Note Finale

Cette évaluation a identifié **8 findings** au total — dont **2 critiques** qui doivent être adressés avant le démarrage de l'implémentation. La bonne nouvelle : la planification est globalement de très haute qualité pour un projet de cette complexité. Les gaps sont identifiés, non cachés. Résoudre les 3 points ci-dessus avant de démarrer Epic 2 et Epic 4 permettra une implémentation sans obstacle majeur.

**Évalué par :** Winston (Architect Agent)
**Date :** 2026-04-15
**Documents évalués :** prd.md, architecture.md, epics.md, ux-design-specification.md
