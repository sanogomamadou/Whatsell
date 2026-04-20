---
title: "Product Brief : Whatsell"
status: "complete"
created: "2026-04-11"
updated: "2026-04-11"
inputs: ["brain dump fondateur", "recherche concurrentielle web"]
version: "0.2"
---

# Product Brief : Whatsell

## Résumé exécutif

Dormez. Whatsell vend pour vous.

Chaque jour, des milliers de petits commerçants au Mali et au Burkina Faso gèrent leur activité entière depuis une conversation WhatsApp. Ils publient leurs produits sur Instagram, répondent aux questions en DM Facebook, puis finalisent chaque vente manuellement via WhatsApp — un message à la fois, à toute heure. Résultat : des heures perdues à répondre aux mêmes questions, des commandes notées dans un carnet ou un fichier Excel, et des ventes perdues quand ils ne sont pas disponibles.

Whatsell est un SaaS de gestion de boutique en ligne pensé pour ce marché. Il automatise entièrement la prise de commande via un agent IA WhatsApp qui travaille 24h/24 : il identifie les intentions d'achat, vérifie les stocks en temps réel, guide le client dans le choix des variantes, coordonne le paiement par Mobile Money (Orange Money, Moov Money), et crée la commande dans le dashboard. En parallèle, il fournit un espace de gestion complet — CRM, commandes, stocks, catalogue avec variantes, analytics, facturation PDF — et un agent conseiller IA qui répond aux questions du vendeur sur ses propres données et génère des alertes proactives.

Il n'existe aujourd'hui aucun outil qui combine ces trois éléments sur ce marché : automatisation conversationnelle IA + paiements FCFA/Mobile Money + interface française accessible. Whatsell comble ce vide.

## Le problème

Un vendeur de mode à Bamako reçoit cinquante messages par jour sur WhatsApp. Il répond manuellement à « c'est combien ? » en boucle, note chaque commande dans un carnet, envoie son numéro Orange Money à la main, attend la photo du reçu, puis reporte tout dans un fichier Excel le soir. Quand il dort ou est occupé, les clients n'attendent pas — ils achètent ailleurs.

Au-delà de la fatigue opérationnelle, l'absence de traçabilité a des conséquences profondes : sans historique de transactions structuré, ces marchands ne peuvent pas accéder à des financements, ne savent pas quels produits se vendent réellement, et perdent des clients qui ne sont jamais enregistrés nulle part.

La solution actuelle la plus proche — IbèChat — offre un catalogue produit WhatsApp avec Mobile Money, mais ne résout pas le problème central : le marchand gère encore chaque conversation manuellement. STOCKALIO, référence SaaS francophone pour l'Afrique de l'Ouest (15 000–25 000 FCFA/mois, 500+ entreprises), prouve que ces marchands paient volontiers pour des outils adaptés à leur contexte — mais ne propose aucune automatisation WhatsApp. Les plateformes globales (WATI, Zoko) sont trop complexes, en anglais, et sans intégration Mobile Money.

## La solution

Whatsell se compose de deux couches complémentaires :

**Agent WhatsApp IA** — Lorsqu'un client écrit sur le WhatsApp Business du vendeur, l'agent prend en charge toute la conversation de vente. Il identifie l'intention (question produit, commande, suivi), vérifie les stocks en temps réel, guide le client dans le choix des variantes (« Quelle taille souhaitez-vous ? Nous avons S, M, L, XL »), collecte les coordonnées de livraison, calcule le montant de l'avance selon les règles configurées par le vendeur, et réclame la photo du justificatif Mobile Money. La commande apparaît automatiquement dans le dashboard avec statut « en attente ». Si l'agent rencontre une situation complexe, il transfère naturellement au vendeur. Le vendeur peut prendre le contrôle de n'importe quelle conversation à tout moment depuis son dashboard, puis la rendre à l'IA.

**Dashboard de gestion** — Interface web accessible depuis un smartphone ou ordinateur. Gestion des commandes avec suivi de statut complet (en attente → confirmée → en préparation → expédiée → livrée), CRM clients avec historique et segmentation automatique (nouveau / régulier / VIP), catalogue produit avec système de variantes libres (taille, couleur, volume…), gestion des stocks avec alertes de rupture configurables, analytics de vente (CA, panier moyen, top produits, top clients), et génération de factures PDF personnalisées (logo + nom de boutique). Un agent conseiller IA intégré répond aux questions en langage naturel sur les données du vendeur (« Quel est mon produit le plus vendu ce mois ? ») et génère des alertes proactives (stock critique, tendances de vente, clients inactifs).

## Ce qui nous différencie

**La combinaison n'existe pas ailleurs sur ce marché.** Les outils africains (IbèChat) manquent d'IA conversationnelle — le marchand gère encore les échanges manuellement. Les outils IA africains sophistiqués (Chpter, Kenya) sont construits sur M-PESA et ignorent la zone FCFA. Les plateformes globales (WATI, Zoko) sont trop complexes et n'intègrent ni Orange Money ni Moov Money. STOCKALIO démontre la demande pour un SaaS français local — mais n'automatise rien.

Whatsell est conçu nativement pour le commerce en Afrique de l'Ouest francophone : interface et agent en français, paiements FCFA/Mobile Money natifs, déploiement mobile-first adapté aux connexions data mobiles, modèle tarifaire ancré dans la réalité locale (à partir de 10 000 FCFA/mois). Pour le marchand, c'est l'outil qui travaille pendant qu'il dort.

**Avantages défendables :**
- Intégration Mobile Money pensée dès le départ, pas ajoutée après coup
- UX conçue pour une utilisation smartphone sur connexion mobile modeste
- Modèle freemium qui permet l'adoption sans friction financière initiale
- Données propriétaires accumulées sur les flux du commerce informel ouest-africain : chaque conversation traitée par l'agent enrichit un dataset que les concurrents arrivant plus tard ne pourront pas répliquer rapidement
- Infrastructure WhatsApp via BSP agréé Meta (Twilio), ce qui mutualise le risque réglementaire et simplifie la connexion pour les marchands

**Risques connus et mitigations :**
- *Dépendance Meta/WhatsApp* : atténuée par le passage par un BSP (Twilio) plutôt qu'une intégration directe; le BSP absorbe les changements d'API et gère la conformité Meta
- *Fraude aux justificatifs de paiement* : validation manuelle par le vendeur en V1 (limitation connue et acceptée); automatisation via API Mobile Money prévue en roadmap V2
- *Onboarding technique* : connexion WhatsApp Business via Meta Business Manager est le point de friction le plus élevé du funnel — nécessite un accompagnement guidé (tutoriel vidéo, support pour les premiers marchands)

## À qui ça s'adresse

**Utilisateur principal : le petit commerçant solo.** Vendeur de mode, cosmétiques, alimentation ou artisanat au Mali ou au Burkina Faso. Opère depuis son téléphone. Utilise WhatsApp comme canal de vente principal. Gère seul sa boutique — stock, commandes, paiements, livraisons. Son « aha moment » : la première commande prise par l'IA pendant qu'il était indisponible.

Ce vendeur n'a ni site web, ni équipe, ni outil de gestion. Il veut une solution qui s'intègre à ce qu'il fait déjà (vendre sur WhatsApp) sans changer ses habitudes. La facture PDF qu'il peut générer d'un clic représente aussi, pour beaucoup, leur premier document commercial formel — une étape vers la structuration de leur activité.

## Critères de succès

| Métrique | Objectif V1 (6 mois) |
|----------|----------------------|
| Vendeurs actifs (≥ 1 commande traitée dans le mois) | 50 |
| Taux de conversion Free → Pro | > 20 % |
| Part des commandes traitées par l'agent IA sans intervention | > 60 % |
| Churn mensuel | < 10 % |

## Périmètre V1

**Inclus :**
- Agent WhatsApp IA (prise de commande, questions produits, statut commande, transfert vendeur, takeover vendeur)
- Dashboard : commandes, CRM, catalogue avec variantes, stocks + alertes, analytics, facturation PDF
- Agent conseiller IA (chat réactif + alertes proactives via cron)
- Wizard d'onboarding en 5 étapes (inscription → connexion WhatsApp → produits → règles de paiement → go)
- Modèle freemium : Free (20 cmd/mois) → Pro (100 cmd, 10 000 FCFA/mois) → Business (illimité, 25 000 FCFA/mois)
- Paiements : Mobile Money avance (Orange Money, Moov Money) + espèces à la livraison
- Langues : français uniquement (agent demande au client de parler français si nécessaire)
- Marchés : Mali + Burkina Faso

**Hors périmètre V1 :**
- Automatisation des DM Instagram et Facebook
- Support anglais
- Intégrations ERP ou plateformes e-commerce tierces
- Application mobile native (iOS/Android)
- Passerelle de paiement en ligne directe

## Vision

Si Whatsell atteint ses objectifs V1, la prochaine étape est l'expansion géographique vers le Niger, la Côte d'Ivoire, le Togo, le Bénin, le Ghana et le Sénégal. L'ajout de l'anglais ouvre l'accès au Ghana et à d'autres marchés anglophones d'Afrique de l'Ouest.

À 2-3 ans, Whatsell a le potentiel de devenir l'infrastructure commerciale de référence pour le commerce informel en Afrique de l'Ouest : la couche qui transforme des échanges WhatsApp éphémères en données de transaction structurées, traçables, et finalement finançables. Les données accumulées ouvrent une piste naturelle vers des partenariats avec des fintechs pour l'accès au crédit des marchands — un marché aujourd'hui fermé faute de traçabilité.
