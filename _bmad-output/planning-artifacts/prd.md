---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
status: complete
completedAt: "2026-04-11"
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-Whatsell.md"
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: saas_b2b
  domain: fintech_commerce
  complexity: high
  projectContext: greenfield
partyModeInsights:
  onboarding: "Meta Business Manager est le mur critique - nécessite accompagnement humain ou bouton SOS WhatsApp"
  ahamoment: "Première commande prise pendant le sommeil du vendeur - doit arriver en <20 min post-inscription"
  pricing: "MRR V1 estimé 225 000 FCFA/mois (340€) - validation uniquement, pas encore rentable. Seuil salaire viable: ~120 vendeurs actifs (M12)"
  riskIllimite: "Tier Business illimité risqué avec coûts variables IA/API - envisager cap de conversations"
---

# Product Requirements Document - Whatsell

**Author:** Mamadou
**Date:** 2026-04-11

## Résumé Exécutif

Whatsell est un SaaS de gestion commerciale conçu pour les petits vendeurs informels en Afrique de l'Ouest francophone (Mali, Burkina Faso) qui opèrent exclusivement depuis WhatsApp. Il automatise la prise de commande via un agent IA conversationnel actif 24h/24, et fournit un dashboard de suivi de l'activité commerciale — deux capacités absentes de tout outil existant sur ce marché.

Le problème ciblé est structurel : les vendeurs solos (étudiants, femmes au foyer, propriétaires de boutiques physiques) manquent des ventes en dehors de leurs heures de disponibilité, perdent du temps à répondre manuellement aux mêmes questions, et n'ont aucune visibilité structurée sur la santé de leur business. WhatsApp est leur seul canal de vente — pas un canal parmi d'autres. La demande côté acheteurs a évolué (commande via réseaux sociaux plutôt que déplacement en boutique), mais l'offre des vendeurs n'a pas suivi. Whatsell est la couche qui comble ce gap, au bon moment.

La proposition de valeur centrale : transformer le téléphone du vendeur en un commercial qui ne dort jamais. Le moment de validation pour l'utilisateur — son "aha moment" — est la première commande traitée et enregistrée par l'IA pendant qu'il était indisponible.

### Ce qui rend Whatsell unique

Aucun outil disponible sur ce marché ne combine les trois éléments clés : **automatisation conversationnelle IA** + **paiements Mobile Money natifs** (Orange Money, Moov Money) + **interface française mobile-first**. IbèChat propose un catalogue WhatsApp avec Mobile Money mais sans IA — le vendeur gère encore chaque échange manuellement. STOCKALIO démontre la capacité à payer de ce segment (500+ entreprises à 15 000–25 000 FCFA/mois) mais sans automatisation WhatsApp. WATI et Zoko sont globaux, en anglais, sans intégration Mobile Money.

L'avantage défendable repose sur trois piliers : (1) intégration Mobile Money pensée dès le départ, pas ajoutée après coup ; (2) UX conçue pour un usage smartphone sur connexion mobile modeste ; (3) données propriétaires accumulées sur les flux du commerce informel ouest-africain, qui créent une barrière à l'entrée croissante pour les entrants tardifs.

Le fondateur a lui-même vécu ce problème en tant que vendeur — avantage direct en termes d'empathie produit et de compréhension des points de friction réels.

## Classification du Projet

| Dimension | Valeur |
|---|---|
| **Type** | SaaS B2B — plateforme multi-tenant, abonnements par paliers, agent IA |
| **Domaine** | Fintech / Commerce conversationnel |
| **Complexité** | Élevée — intégration API WhatsApp Business (Meta/Twilio), LLM conversationnel, paiements Mobile Money régionaux, données financières marchands |
| **Contexte** | Greenfield — nouveau produit, aucune base de code existante |

## Critères de Succès

### Succès Utilisateur

- **Temps d'activation :** délai entre inscription et première commande traitée par l'agent IA ≤ 30 minutes — indicateur clé de la qualité de l'onboarding
- **Définition d'un vendeur actif :** ≥ 1 commande traitée par l'agent IA dans le mois calendaire
- **Moment de validation ("aha moment") :** le vendeur reçoit une notification de commande créée pendant une période où il était indisponible — premier signal de rétention émotionnelle
- **Taux d'autonomie de l'agent IA :** > 60% des commandes traitées sans intervention manuelle du vendeur

### Succès Business

| Métrique | Objectif M6 | Objectif M12 |
|---|---|---|
| Vendeurs actifs (≥1 cmd/mois) | 50 | 120 |
| Taux conversion Free → Pro | > 20% | > 25% |
| MRR | ~225 000 FCFA (~340€) | ~600 000 FCFA (~900€) |
| Churn mensuel | < 10% | < 7% |

> M6 = seuil de validation du product-market fit. M12 = seuil de viabilité avec salaire fondateur.

### Succès Technique

- **Temps de réponse de l'agent IA :** ≤ 3 minutes par message — la priorité est la pertinence de la réponse, pas la rapidité. Une réponse correcte en 3 minutes vaut mieux qu'une réponse inutile en 5 secondes.
- **Précision des commandes créées automatiquement :** taux d'erreur de saisie (mauvais produit, mauvaise quantité, mauvais montant) < 2%
- **Disponibilité de l'agent WhatsApp :** uptime > 99% sur les plages horaires actives (06h–23h heure locale)
- **Stabilité du dashboard :** 0 perte de données de commandes ou de stocks

## Périmètre Produit

### MVP — Produit Minimum Viable

- **Agent WhatsApp IA :** identification d'intention, vérification stock temps réel, guidage variantes, collecte coordonnées livraison, calcul avance selon règles vendeur, demande justificatif Mobile Money, création commande automatique dans dashboard, transfert vers vendeur sur situations complexes, reprise de contrôle vendeur à tout moment
- **Dashboard de gestion :** suivi commandes (statuts : en attente → confirmée → en préparation → expédiée → livrée), CRM clients avec historique, catalogue produits avec variantes libres (taille, couleur, volume…), gestion stocks avec alertes de rupture configurables, analytics de vente (CA, panier moyen, top produits, top clients), génération factures PDF personnalisées (logo + nom boutique)
- **Agent conseiller IA :** chat réactif en langage naturel sur les données du vendeur, alertes proactives (stock critique, tendances, clients inactifs)
- **Wizard d'onboarding :** 5 étapes (inscription → connexion WhatsApp → catalogue → règles de paiement → activation), accompagnement guidé pour la connexion Meta Business Manager
- **Modèle freemium :** Free (20 cmd/mois) → Pro (100 cmd, 10 000 FCFA/mois) → Business (illimité*, 25 000 FCFA/mois)
- **Paiements :** Mobile Money avance (Orange Money, Moov Money) + espèces à la livraison
- **Langue :** français uniquement
- **Marchés :** Mali + Burkina Faso

> *Le tier Business "illimité" doit inclure une politique de fair use sur les conversations IA pour contrôler les coûts variables API/LLM — à définir en implémentation.

### Fonctionnalités de Croissance (Post-MVP)

- Automatisation des DM Instagram et Facebook Messenger
- Support multilingue (anglais pour Ghana et marchés anglophones)
- Validation automatique des reçus Mobile Money via API opérateurs (vs. manuelle en V1)
- Application mobile native iOS/Android
- Intégrations ERP et plateformes e-commerce tierces

### Vision (Futur 2–3 ans)

- Expansion géographique : Niger, Côte d'Ivoire, Togo, Bénin, Ghana, Sénégal
- Infrastructure commerciale de référence pour le commerce informel ouest-africain
- Partenariats fintechs pour l'accès au crédit des marchands (les données de transactions Whatsell comme scoring de crédit)
- Passerelle de paiement en ligne directe

## Parcours Utilisateurs

### Parcours 1 — Boubacar, l'étudiant businessman (chemin idéal)

Boubacar a 23 ans, vend des sneakers importées depuis sa chambre de cité universitaire à Bamako. 12 modèles, tailles 40 à 45. Il reçoit 20 à 40 messages WhatsApp par jour. En cours, il ne répond pas — les clients n'attendent pas.

**Déclencheur :** hier soir, il a perdu une vente de 35 000 FCFA en dormant. La cliente a acheté ailleurs.

**Parcours :** Il s'inscrit en 10 minutes. Le wizard le guide — numéro WhatsApp Business (avec tutoriel vidéo Meta Business Manager), 12 modèles avec photos et variantes de tailles, règles de paiement : "50% d'avance Orange Money, reste à la livraison". Il active.

Le lendemain matin, pendant son cours de comptabilité, son téléphone vibre : notification Whatsell — *"Nouvelle commande : Nike Air Force 1, taille 42, 28 000 FCFA. Avance reçue : photo reçu Orange Money joint."* L'agent a géré toute la conversation pendant qu'il était en cours.

**Nouveau monde :** Boubacar sort de l'amphi, consulte son dashboard en 30 secondes, confirme la commande, programme la livraison. Zéro seconde de cours perdue. Zéro client perdu.

**Capacités révélées :** wizard onboarding guidé, agent IA multiconversation, notification vendeur, dashboard mobile-first, gestion de variantes, règles d'avance configurables.

---

### Parcours 2 — Aminata, la vendeuse débordée (situation complexe + reprise de contrôle)

Aminata vend des pagnes depuis sa boutique physique à Ouagadougou. Il est 15h, elle a 3 clients devant elle et 7 conversations WhatsApp ouvertes.

Un client WhatsApp demande un pagne bordeaux taille L — stock disponible : 2 pièces. Puis : *"Mon ami Seydou m'a dit que tu fais -10% pour les fidèles."* L'agent ne peut pas valider cette remise sans autorisation.

**Gestion de l'exception :** l'agent marque la conversation "nécessite intervention vendeur" et envoie une alerte à Aminata. Entre deux clients en boutique, elle voit la notification, reprend la conversation d'un tap, accorde la remise manuellement, puis rend le contrôle à l'agent pour finaliser la commande.

**Capacités révélées :** détection de situations hors-périmètre IA, transfert vers vendeur avec contexte complet, reprise de contrôle seamless, retour à l'IA après intervention manuelle.

---

### Parcours 3 — Fatoumata, la cliente acheteuse (expérience côté WhatsApp)

Fatoumata, 28 ans, Bamako. Elle a vu une robe sur Instagram, le vendeur indique "commander via WhatsApp".

Elle écrit : *"Bonjour, je veux la robe bleue."* L'agent répond : *"Bonjour ! Disponible en S, M et L. Quelle taille ?"* — *"M"* — *"Parfait. Vous êtes à Bamako ? Votre adresse ?"* — Elle donne son adresse — *"Total : 22 000 FCFA. Avance de 11 000 FCFA via Orange Money au XXXXXXX. Envoyez la photo du reçu."* — Elle envoie — *"Merci ! Commande #247 confirmée. Livraison sous 24–48h."*

Fatoumata n'a pas quitté WhatsApp. Elle n'a pas appelé. Elle n'a pas attendu.

**Capacités révélées :** agent conversationnel naturel en français, collecte structurée (variantes, adresse, paiement), intégration photo reçu Mobile Money, confirmation commande avec numéro de suivi, tolérance au langage informel.

---

### Parcours 4 — Mamadou, l'opérateur plateforme (surveillance et support)

Un vendeur Pro signale que son agent ne répond plus depuis 20 minutes. Depuis le panel admin, Mamadou voit que la connexion WhatsApp de ce compte a été révoquée par Meta (token expiré). Il envoie une notification au vendeur avec lien de reconnexion guidé.

En parallèle, il surveille les métriques clés : taux d'autonomie IA global (64%), temps moyen de réponse agent (1m42s), 15 vendeurs Free ayant utilisé 18+ commandes ce mois — candidats à la conversion Pro.

**Capacités révélées :** panel admin plateforme, monitoring santé des connexions WhatsApp par compte, métriques globales agrégées, gestion des limites de tier, alertes de déconnexion, outils de support vendeur.

---

### Résumé des Capacités Révélées

| Capacité | Révélée par |
|---|---|
| Wizard onboarding guidé Meta Business Manager | Boubacar |
| Agent IA conversationnel multiconversation | Tous |
| Notification temps réel vendeur | Boubacar, Aminata |
| Dashboard mobile-first commandes/stats | Boubacar, Aminata |
| Transfert + reprise de contrôle vendeur ↔ IA | Aminata |
| Collecte structurée : variantes, adresse, paiement | Fatoumata |
| Intégration Mobile Money (photo reçu + confirmation) | Fatoumata |
| Numérotation et suivi commandes | Fatoumata |
| Panel admin + monitoring santé plateforme | Mamadou |
| Détection approche limite de tier (conversion) | Mamadou |

## Exigences Domaine

### Conformité et Régulation

**Statut réglementaire Mobile Money :**
Whatsell n'est pas un agrégateur de paiement. Il n'intercepte, ne stocke ni ne transfère de fonds. Le flux financier se déroule directement entre l'acheteur et le compte Mobile Money personnel du vendeur. Whatsell documente la preuve de paiement (photo du reçu) sans être partie à la transaction financière. En conséquence, **aucune licence BCEAO ou agrégateur de paiement n'est requise en V1.**

**Conformité WhatsApp Business API (Meta) :**
- Intégration via BSP agréé Meta (Twilio) — le BSP absorbe les évolutions d'API et gère la conformité Meta
- Respect des politiques d'utilisation de WhatsApp Business : messages initiés uniquement dans le cadre d'une conversation ouverte par le client (fenêtre de 24h), pas de marketing non sollicité via l'agent
- Chaque vendeur connecte son propre numéro WhatsApp Business — Whatsell agit en tant qu'opérateur de la connexion, pas propriétaire du numéro

### Contraintes Techniques

**Hébergement :**
- Cloud international acceptable (AWS ou GCP) — aucune obligation de localisation des données identifiée pour le Mali/Burkina Faso en V1
- Région recommandée : Europe (eu-west) ou Afrique du Sud (af-south-1 sur AWS) pour minimiser la latence depuis l'Afrique de l'Ouest

> Les exigences de sécurité, disponibilité et performance sont détaillées dans la section Exigences Non-Fonctionnelles.

### Risques Documentés et Acceptés

| Risque | Niveau | Décision V1 | Roadmap |
|---|---|---|---|
| Falsification de reçus Mobile Money (photo retouchée, reçu réutilisé) | Moyen | Validation manuelle par le vendeur — risque accepté et documenté | V2 : validation automatique via API opérateurs Mobile Money |
| Révocation de token WhatsApp Business par Meta | Faible | Alerte immédiate vendeur + guide de reconnexion | V2 : reconnexion automatique |
| Coûts variables IA/API sur tier Business "illimité" | Moyen | Politique de fair use à définir avant lancement Business tier | V1 : surveillance manuelle |

### Exigences d'Intégration

- **WhatsApp Business API** via Twilio (BSP) : webhooks entrants, envoi de messages, gestion des sessions de conversation
- **Orange Money / Moov Money** : en V1, intégration indirecte (photo reçu) — aucune API directe requise
- **LLM / IA conversationnelle** : API externe (OpenAI ou équivalent) avec gestion des timeouts et fallback sur message d'attente
- **Stockage fichiers** : photos de reçus Mobile Money stockées de façon sécurisée avec accès limité au vendeur concerné

## Innovation & Patterns Nouveaux

### Zones d'Innovation Identifiées

**Innovation #1 — La combinaison n'existe pas sur ce marché**

Trois éléments séparément disponibles ailleurs — automatisation conversationnelle IA, paiements Mobile Money, interface française mobile-first — mais aucun outil ne les combine pour le commerce informel ouest-africain. Whatsell n'invente pas ces briques : il est le premier à les assembler pour ce contexte précis. C'est de l'innovation de marché, très défendable — les entrants tardifs doivent reproduire la combinaison ET le réseau de vendeurs déjà constitué.

**Innovation #2 — WhatsApp comme infrastructure commerciale, pas comme canal**

L'approche dominante des concurrents globaux (WATI, Zoko) traite WhatsApp comme un canal de communication supplémentaire à brancher sur un système existant. Whatsell inverse la logique : WhatsApp *est* la boutique. L'agent IA n'est pas branché sur WhatsApp — il *est* le point de vente. Cette inversion architecturale a des implications profondes sur l'UX, l'onboarding et la proposition de valeur.

**Innovation #3 — Données du commerce informel comme actif propriétaire**

Chaque commande traitée génère des données structurées sur des flux commerciaux qui n'ont jamais existé sous forme numérique. Comportements d'achat, saisonnalité, produits populaires par zone géographique, profils de vendeurs — un actif que les concurrents arrivant plus tard ne pourront pas répliquer rapidement.

### Contexte Marché

| Acteur | Ce qu'il fait | Ce qu'il ne fait pas |
|---|---|---|
| IbèChat | Catalogue WhatsApp + Mobile Money | IA conversationnelle — vendeur gère encore manuellement |
| STOCKALIO | SaaS gestion francophone (500+ clients) | Automatisation WhatsApp |
| WATI / Zoko | IA WhatsApp globale | Mobile Money, français, contexte informel |
| Chpter (Kenya) | IA commerce WhatsApp en Afrique | Zone FCFA, francophone |

### Approche de Validation

| Hypothèse innovante | Comment la valider | Signal de succès |
|---|---|---|
| L'agent IA peut gérer 60%+ des commandes sans intervention | Mesurer le taux d'autonomie sur les 10 premiers vendeurs beta | > 60% à M3 |
| Le aha moment crée de la rétention | Corréler la date du 1er aha moment avec rétention J30 | Rétention J30 > 80% pour vendeurs ayant vécu le aha moment |
| Les vendeurs paient 10 000 FCFA/mois pour cette valeur | Taux conversion Free → Pro après 20 commandes atteintes | > 20% |
| L'agent parle suffisamment bien français informel | Tests utilisateurs avec 5 vendeurs, évaluation qualitative | 0 abandon conversation lié à la qualité de l'IA |

### Mitigation des Risques d'Innovation

| Risque | Mitigation |
|---|---|
| L'IA fait des erreurs qui font fuir les clients des vendeurs | Mode "supervision" 7 premiers jours : réponses notifiées au vendeur avant envoi (optionnel) |
| L'agent ne comprend pas le français informel / argot local | Phase beta avec corpus de conversations réelles, prompting adapté |
| Meta change les règles WhatsApp Business API | Twilio BSP absorbe le risque réglementaire — contrat avec clause de continuité de service |

## Spécifications Plateforme

### Vue d'ensemble

Whatsell est un SaaS B2B multi-tenant à isolation stricte par compte. Chaque compte correspond à un vendeur, une boutique, et un numéro WhatsApp Business. Aucune donnée n'est partagée entre comptes. La gestion des collaborateurs est une fonctionnalité exclusive au tier Business, ce qui crée une incitation à l'upgrade pour les vendeurs dont l'activité croît.

### Modèle Multi-Tenant

- **Isolation complète** : chaque compte vendeur dispose d'un espace de données entièrement cloisonné (catalogue, commandes, clients, stocks, analytics, conversations)
- **1 compte = 1 boutique = 1 numéro WhatsApp Business** : pas de gestion multi-boutiques sous un même compte en V1
- **Pas de données croisées** : aucune fonctionnalité ne permet l'accès aux données d'un autre compte, même par l'opérateur, sauf pour le support via panel admin

### Modèle de Permissions (RBAC)

| Rôle | Disponibilité | Capacités |
|---|---|---|
| **Propriétaire** | Tous tiers | Accès complet : catalogue, commandes, stocks, CRM, analytics, facturation, paramètres compte, abonnement, connexion WhatsApp, gestion des collaborateurs |
| **Co-gérant** | Business uniquement | Accès complet sauf : paramètres de compte, abonnement, ajout/suppression de collaborateurs |
| **Vendeur** | Business uniquement | Commandes (voir + traiter), prise de contrôle conversations WhatsApp, consultation catalogue et stocks — pas de modification catalogue, pas d'accès analytics complets ni facturation |

- **Nombre de collaborateurs maximum :** 3 comptes additionnels sur le tier Business (propriétaire + 3 = 4 utilisateurs max)
- **Gestion des collaborateurs :** invitation par le propriétaire uniquement, attribution de rôle à l'invitation, révocation possible à tout moment
- **Sur les tiers Free et Pro :** compte à utilisateur unique (propriétaire uniquement)

### Abonnements

| Tier | Prix | Commandes IA/mois | Collaborateurs | Accès fonctionnalités |
|---|---|---|---|---|
| Free | 0 FCFA | 20 | 0 | Agent IA + Dashboard basique |
| Pro | 10 000 FCFA | 100 | 0 | Agent IA + Dashboard complet + Analytics |
| Business | 25 000 FCFA | Fair use* | 3 | Tout + Collaborateurs + Export données |

> *Fair use Business tier : politique à définir avant lancement (cap conversations IA recommandé pour contrôle des coûts LLM/API)

### Liste des Intégrations

| Système | Type | Criticité | Notes |
|---|---|---|---|
| WhatsApp Business API (via Twilio BSP) | Webhooks bidirectionnels | Critique — indisponibilité = agent hors ligne | Fallback : message d'attente automatique |
| LLM API (OpenAI ou équivalent) | API REST | Critique — indisponibilité = agent hors ligne | Timeout 3 min max, fallback transfert vendeur |
| Stockage fichiers (S3 ou équivalent) | Objet | Haute | Photos reçus Mobile Money, logos boutiques, factures PDF |
| Service email transactionnel | SMTP/API | Moyenne | Notifications onboarding, alertes compte |

### Considérations d'Implémentation

- **Architecture API REST** avec endpoints séparés par domaine (commandes, catalogue, CRM, analytics, agent)
- **Authentification** : JWT avec refresh tokens, expiration courte (accès : 15 min, refresh : 7 jours)
- **Webhooks WhatsApp** : traitement asynchrone avec queue pour absorber les pics de messages simultanés
- **Rate limiting** par compte pour protéger l'infrastructure des vendeurs très actifs
- **Dashboard mobile-first** : conçu pour smartphone 360px en premier, desktop en second

## Scoping & Développement Phasé

### Stratégie MVP & Philosophie

**Approche MVP :** MVP Complet — arriver sur le marché avec un produit qui rivalise directement avec l'existant (STOCKALIO) tout en apportant la différenciation IA/WhatsApp absente chez tous les concurrents. Pas de version "lite" : le vendeur doit ressentir dès le premier jour qu'il a un outil professionnel complet.

**Justification :** le marché cible compare Whatsell à STOCKALIO qui facture déjà 15 000–25 000 FCFA/mois avec un dashboard mature. Arriver avec un produit incomplet risque de créer une perception de "outil amateur" difficile à effacer. La différenciation IA est le seul avantage — elle doit être présente dès V1.

**Ressources requises :** fondateur solo, délai non contraint — qualité et complétude prioritaires sur la vitesse de mise sur le marché.

### Fonctionnalités MVP — Phase 1

**Parcours utilisateurs couverts :** Boubacar (onboarding → activation → commandes autonomes), Aminata (gestion exceptions + analytics), Fatoumata (expérience acheteur WhatsApp), Mamadou (monitoring plateforme).

**Capacités indispensables :**

| Module | Fonctionnalités V1 |
|---|---|
| **Agent WhatsApp IA** | Identification intention, vérification stock temps réel, guidage variantes, collecte coordonnées livraison, règles d'avance configurables, demande reçu Mobile Money, création commande automatique, détection situation complexe, transfert vendeur, reprise de contrôle, retour à l'IA |
| **Dashboard — Commandes** | Liste commandes avec statuts complets (en attente → confirmée → en préparation → expédiée → livrée), vue détail, actions de statut |
| **Dashboard — Catalogue** | Produits avec photos, variantes libres (taille/couleur/volume), prix, activation/désactivation |
| **Dashboard — Stocks** | Niveaux de stock par variante, alertes de rupture configurables |
| **Dashboard — CRM** | Fiche client avec historique commandes, segmentation automatique (nouveau/régulier/VIP) |
| **Dashboard — Analytics** | CA, panier moyen, top produits, top clients, évolution temporelle |
| **Dashboard — Facturation** | Génération PDF personnalisée (logo + nom boutique) |
| **Agent Conseiller IA** | Chat réactif en langage naturel sur données vendeur, alertes proactives (stock critique, tendances, clients inactifs) |
| **Onboarding Wizard** | 5 étapes : inscription → connexion WhatsApp (guide Meta Business Manager) → catalogue → règles de paiement → activation |
| **Abonnements** | Free (20 cmd) + Pro (100 cmd, 10 000 FCFA) + Business (fair use, 25 000 FCFA, 3 collaborateurs) |
| **Collaborateurs** | Invitation, rôles (Co-gérant / Vendeur), révocation — Business uniquement |
| **Panel Admin** | Monitoring connexions WhatsApp, métriques globales, support vendeurs, gestion tiers |

### Fonctionnalités Post-MVP — Phase 2

- Automatisation DM Instagram et Facebook Messenger
- Validation automatique reçus Mobile Money via API opérateurs
- Support multilingue (anglais)
- Reconnexion automatique token WhatsApp Business
- Application mobile native iOS/Android
- Intégrations ERP et plateformes e-commerce tierces

### Vision — Phase 3

- Expansion géographique : Niger, Côte d'Ivoire, Togo, Bénin, Ghana, Sénégal
- Passerelle de paiement en ligne directe
- Partenariats fintechs : scoring de crédit basé sur l'historique de transactions Whatsell

### Stratégie de Mitigation des Risques

| Risque | Niveau | Mitigation |
|---|---|---|
| Complexité intégration WhatsApp Business (Meta Business Manager) | Élevé | Tutoriel vidéo dédié + support à l'activation pour les premiers vendeurs beta |
| Qualité de l'agent IA en français informel | Élevé | Phase beta fermée avec 10 vendeurs — itérations prompting avant ouverture |
| Coûts LLM/API variables sur tier Business | Moyen | Politique fair use définie avant lancement Business tier, monitoring coût par compte |
| Délai de développement solo plus long que prévu | Moyen | Prioriser agent IA + commandes + onboarding — reste du dashboard en séquentiel |
| Faux reçus Mobile Money | Moyen | Risque accepté V1 — validation manuelle vendeur, V2 API opérateurs |

## Exigences Fonctionnelles

### Compte & Onboarding

- **FR1 :** Le vendeur peut créer un compte Whatsell avec email et mot de passe
- **FR2 :** Le vendeur peut connecter son numéro WhatsApp Business à son compte via un wizard guidé en 5 étapes
- **FR3 :** Le vendeur peut configurer les règles de paiement de sa boutique (pourcentage d'avance requis, modes acceptés)
- **FR4 :** Le vendeur peut personnaliser son profil boutique (nom, logo)
- **FR5 :** Le vendeur peut déconnecter et reconnecter son numéro WhatsApp Business depuis le dashboard

### Agent WhatsApp IA

- **FR6 :** L'agent IA peut identifier l'intention d'un message entrant (commande, question produit, suivi de commande, autre)
- **FR7 :** L'agent IA peut guider un client dans la sélection de variantes disponibles en stock
- **FR8 :** L'agent IA peut collecter les coordonnées de livraison d'un client au cours d'une conversation
- **FR9 :** L'agent IA peut calculer le montant de l'avance selon les règles configurées par le vendeur
- **FR10 :** L'agent IA peut demander et réceptionner la photo du justificatif de paiement Mobile Money
- **FR11 :** L'agent IA peut créer automatiquement une commande dans le dashboard à l'issue d'une conversation de vente
- **FR12 :** L'agent IA peut détecter une situation hors de sa portée et notifier le vendeur pour prise en charge
- **FR13 :** L'agent IA peut informer un client du statut de sa commande existante
- **FR14 :** Le vendeur peut prendre le contrôle d'une conversation WhatsApp active depuis le dashboard
- **FR15 :** Le vendeur peut remettre le contrôle d'une conversation à l'agent IA
- **FR16 :** Le vendeur reçoit une notification en temps réel lorsqu'une commande est créée par l'agent IA

### Gestion des Commandes

- **FR17 :** Le vendeur peut consulter la liste de toutes ses commandes avec filtres par statut
- **FR18 :** Le vendeur peut consulter le détail d'une commande (produits, variantes, client, montant, photo reçu)
- **FR19 :** Le vendeur peut faire progresser le statut d'une commande (en attente → confirmée → en préparation → expédiée → livrée)
- **FR20 :** Le vendeur peut générer une facture PDF pour une commande
- **FR21 :** Le collaborateur avec rôle "Vendeur" peut consulter et mettre à jour le statut des commandes

### Catalogue & Stocks

- **FR22 :** Le vendeur peut créer, modifier et supprimer des produits dans son catalogue
- **FR23 :** Le vendeur peut définir des variantes libres sur un produit (nom de variante + valeurs)
- **FR24 :** Le vendeur peut définir et mettre à jour un niveau de stock par variante de produit
- **FR25 :** Le vendeur peut activer ou désactiver la disponibilité d'un produit
- **FR26 :** Le vendeur peut configurer un seuil d'alerte de rupture de stock par produit
- **FR27 :** Le vendeur reçoit une alerte lorsqu'un niveau de stock atteint son seuil critique

### CRM & Clients

- **FR28 :** Le système crée automatiquement une fiche client lors de sa première commande
- **FR29 :** Le vendeur peut consulter la fiche d'un client avec son historique de commandes complet
- **FR30 :** Le système segmente automatiquement les clients (nouveau / régulier / VIP) selon leur historique

### Analytics & Reporting

- **FR31 :** Le vendeur peut consulter son chiffre d'affaires sur une période sélectionnée
- **FR32 :** Le vendeur peut consulter le panier moyen de ses commandes
- **FR33 :** Le vendeur peut consulter le classement de ses produits les plus vendus
- **FR34 :** Le vendeur peut consulter le classement de ses clients les plus actifs
- **FR35 :** Le vendeur peut générer une facture PDF personnalisée avec son logo et le nom de sa boutique

### Agent Conseiller IA

- **FR36 :** Le vendeur peut poser des questions en langage naturel sur ses données business à l'agent conseiller
- **FR37 :** L'agent conseiller génère des alertes proactives sur les stocks critiques
- **FR38 :** L'agent conseiller génère des alertes proactives sur les tendances de vente inhabituelles
- **FR39 :** L'agent conseiller génère des alertes proactives sur les clients inactifs depuis une période définie

### Abonnements & Collaborateurs

- **FR40 :** Le vendeur peut consulter son abonnement actuel et le nombre de commandes restantes dans son tier
- **FR41 :** Le vendeur peut upgrader son abonnement vers un tier supérieur depuis le dashboard
- **FR42 :** Le propriétaire d'un compte Business peut inviter jusqu'à 3 collaborateurs par email
- **FR43 :** Le propriétaire peut attribuer un rôle (Co-gérant / Vendeur) à chaque collaborateur à l'invitation
- **FR44 :** Le propriétaire peut révoquer l'accès d'un collaborateur à tout moment
- **FR45 :** Le système notifie le vendeur lorsqu'il approche de la limite mensuelle de commandes de son tier

### Essai Gratuit & Conversion

- **FR46 :** Le système offre automatiquement aux nouveaux vendeurs un essai gratuit de 7 jours du tier Pro à l'inscription — à l'expiration, le compte bascule vers le tier Free si aucun abonnement n'a été souscrit
- **FR47 :** Le système notifie le vendeur à J-2 avant la fin de son essai Pro pour l'inviter à souscrire un abonnement

### Panel Admin & Opérateur

- **FR48 :** L'opérateur peut consulter l'état de la connexion WhatsApp de chaque compte vendeur
- **FR49 :** L'opérateur peut envoyer une notification de support à un vendeur spécifique
- **FR50 :** L'opérateur peut consulter les métriques globales de la plateforme (taux d'autonomie IA, temps de réponse agent, vendeurs actifs, MRR)
- **FR51 :** L'opérateur peut identifier les comptes approchant la limite de leur tier (candidats à la conversion)

## Exigences Non-Fonctionnelles

### Performance

- **NFR1 :** L'agent IA produit une réponse pertinente en ≤ 3 minutes par message — priorité à la qualité de la réponse sur la vitesse
- **NFR2 :** Les pages du dashboard se chargent en ≤ 3 secondes sur une connexion 3G mobile (débit ≥ 1 Mbps)
- **NFR3 :** Les notifications temps réel (nouvelle commande, alerte stock) parviennent au vendeur en ≤ 30 secondes après l'événement déclencheur
- **NFR4 :** La génération d'une facture PDF s'effectue en ≤ 5 secondes

### Sécurité

- **NFR5 :** Toutes les données sont chiffrées en transit via TLS 1.2 minimum
- **NFR6 :** Toutes les données sensibles (commandes, clients, conversations) sont chiffrées au repos
- **NFR7 :** Les sessions utilisateur sont gérées via JWT avec expiration courte (token d'accès : 15 minutes, refresh : 7 jours)
- **NFR8 :** L'isolation multi-tenant est stricte — aucun accès aux données d'un autre compte vendeur n'est possible, même par erreur applicative
- **NFR9 :** Les actions sensibles (modification des règles de paiement, export de données, gestion des collaborateurs) sont consignées dans un log d'audit horodaté
- **NFR10 :** Les photos de reçus Mobile Money sont stockées dans un espace privé accessible uniquement au compte vendeur concerné et à l'opérateur pour le support

### Fiabilité

- **NFR11 :** L'agent WhatsApp IA est disponible > 99% du temps sur les plages actives (06h–23h heure locale Mali/Burkina Faso)
- **NFR12 :** En cas d'indisponibilité de l'agent IA, le système envoie automatiquement un message d'attente au client plutôt qu'un silence
- **NFR13 :** Aucune perte de données de commandes ou de stocks n'est tolérée — sauvegardes quotidiennes minimum avec rétention de 30 jours
- **NFR14 :** Le système détecte et notifie l'opérateur en cas de déconnexion du token WhatsApp Business d'un compte vendeur dans un délai de 5 minutes

### Scalabilité

- **NFR15 :** Le système supporte une croissance de 50 à 500 comptes vendeurs actifs sans dégradation des performances
- **NFR16 :** Le traitement des webhooks WhatsApp entrants est asynchrone via une queue — le système absorbe des pics jusqu'à 1 000 messages simultanés sans perte
- **NFR17 :** L'architecture permet l'ajout de nouveaux marchés géographiques (nouveaux pays, nouvelles langues) sans refactoring majeur

### Intégration

- **NFR18 :** En cas de timeout de l'API LLM (> 3 minutes), l'agent transfère automatiquement la conversation au vendeur avec un message d'explication au client
- **NFR19 :** En cas d'indisponibilité de l'API WhatsApp Business (Twilio), les messages entrants sont mis en queue et traités à la reprise du service
- **NFR20 :** Le système journalise toutes les erreurs d'intégration (WhatsApp, LLM, stockage) avec horodatage et contexte pour faciliter le diagnostic opérateur
