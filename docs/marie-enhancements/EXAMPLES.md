# Marie Usage Examples

## Overview

This document provides comprehensive examples of Marie's capabilities, workflows, and integration patterns. All examples are production-ready and demonstrate best practices.

## Table of Contents

- [Basic Workflows](#basic-workflows)
- [Advanced Workflows](#advanced-workflows)
- [Integration Patterns](#integration-patterns)
- [Batch Operations](#batch-operations)
- [Troubleshooting Examples](#troubleshooting-examples)
- [Best Practices](#best-practices)

## Basic Workflows

### Example 1: Formal Student Evaluation

**Scenario**: Create a comprehensive APEXX evaluation for a student after class observation.

#### Standalone Mode

```bash
# Start Marie
cd workspaces/dance/studio
claude
```

**User request**:
```
Create a formal evaluation for Emma Rodriguez based on these observations:

Attitude: Always on time, helps classmates, positive energy (18/20)
Posture: Good alignment but needs core strengthening (15/20)
Energy: High energy throughout, never drops (19/20)
Expression: Developing personal style, gaining confidence (16/20)
Execution: Strong technique, precise movements (17/20)
```

**Expected output**:

```markdown
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

I'll create a formal APEXX evaluation for Emma Rodriguez! 🩰

Reading example evaluations to ensure consistent style and tone...
[Reads 2-3 example evaluations from knowledge base]

Generating evaluation in French following APEXX methodology...

✅ Evaluation created: workspaces/dance/studio/evaluations/formal/Emma_Rodriguez_Evaluation_2025-11-18.md

Here's a summary:
- **Score Total**: 85/100 (Très Bon)
- **Points Forts**: Attitude exceptionnelle, énergie constante
- **À Travailler**: Renforcement du tronc pour améliorer la posture
- **Recommandations**: Continue niveau intermédiaire, ajouter exercices de core
```

**Generated file** (`Emma_Rodriguez_Evaluation_2025-11-18.md`):

```markdown
---
type: student-evaluation
student: Emma Rodriguez
date: 2025-11-18
evaluator: marie
methodology: APEXX
language: French
version: 1.0
---

# Emma Rodriguez - Évaluation Hip-Hop

## Attitude (18/20)

Emma démontre une attitude exceptionnelle en classe. Elle arrive toujours à l'heure et montre un engagement constant tout au long de la session. Son énergie positive est contagieuse et elle n'hésite pas à aider ses camarades lorsqu'ils rencontrent des difficultés. Cette attitude de leader naturel contribue grandement à l'ambiance de la classe.

## Posture (15/20)

Sa posture générale est bonne avec un alignement correct du corps. Emma maintient bien sa verticalité et comprend l'importance d'un bon placement. Cependant, un travail de renforcement du tronc permettrait d'améliorer sa stabilité, particulièrement lors des mouvements qui demandent de l'équilibre. Avec plus de force au niveau du core, elle pourra exécuter les mouvements avec encore plus de précision.

## Énergie (19/20)

L'énergie d'Emma est remarquable et constante. Elle maintient un niveau d'intensité élevé du début à la fin de la classe, ce qui est essentiel en hip-hop. Son dynamisme se traduit dans chaque mouvement et elle sait comment projeter cette énergie vers le public. C'est définitivement l'un de ses points les plus forts.

## Expression (16/20)

Emma est en train de développer son propre style et sa confiance en elle grandit de semaine en semaine. Elle commence à s'approprier les mouvements et à y ajouter sa touche personnelle. Avec le temps et plus d'expérience, son expression artistique va continuer de s'épanouir. Elle est sur la bonne voie pour développer une présence scénique marquante.

## Exécution (17/20)

Techniquement, Emma exécute les mouvements avec une grande précision. Ses isolations sont nettes, son rythme est excellent, et elle comprend bien les subtilités des différents grooves. Sa coordination est impressionnante et elle réussit à enchaîner les mouvements de manière fluide. Continuer à travailler sur la technique de base va lui permettre de s'attaquer à des chorégraphies plus complexes.

## Score Total: 85/100

## Observations

### Points Forts
- Attitude exemplaire et esprit d'équipe
- Énergie constante et dynamisme
- Excellente coordination et sens du rythme
- Technique solide et précise

### À Travailler
- Renforcement du tronc pour améliorer la stabilité
- Confiance en soi lors des improvisations
- Développement de l'expression personnelle

### Recommandations
- Continue le niveau intermédiaire
- Ajouter des exercices de renforcement du core (planches, abdominaux)
- Participer aux sessions d'improvisation guidée pour développer la confiance
- Explorer différents styles musicaux pour enrichir son vocabulaire de mouvement

## Prochaines Étapes

1. **Court terme (1-2 semaines)**
   - Commencer des exercices de renforcement du core (10 minutes par jour)
   - Pratiquer les isolations devant un miroir
   - Filmer ses improvisations pour s'auto-évaluer

2. **Moyen terme (1-2 mois)**
   - Participer aux ateliers d'improvisation
   - Travailler sur une routine solo personnalisée
   - Assister à des spectacles de hip-hop pour s'inspirer

3. **Long terme (3-6 mois)**
   - Préparer une performance solo pour le prochain récital
   - Explorer des styles complémentaires (house, popping)
   - Envisager le niveau avancé

---

**Évaluation réalisée par Marie** 🩰
**Date**: 18 novembre 2025
**Prochaine évaluation recommandée**: Février 2026
```

#### Orchestrated Mode

```bash
# Submit task via script
./send-task-to-marie.sh "Create formal evaluation for Emma Rodriguez: Attitude 18/20 excellent engagement, Posture 15/20 needs core work, Energy 19/20 constant high energy, Expression 16/20 developing confidence, Execution 17/20 strong technique"

# Wait for processing
sleep 60

# Check result
cat core/shared/results/marie/task-*.json

# View evaluation
cat workspaces/dance/evaluations/formal/Emma_Rodriguez_Evaluation_*.md
```

### Example 2: Quick Progress Note

**Scenario**: Document quick observations after a single class.

#### Standalone Mode

**User request**:
```
Create a quick note for Sophia Chen from today's class:
- Good energy today
- Rock step needs more practice
- Applied previous corrections well
- Ready to learn new choreography section
```

**Expected output**:

```markdown
✅ Quick note created: workspaces/dance/studio/evaluations/quick-notes/sophia-chen.md

Brief summary:
- Sophia showed good energy and engagement
- Continue practicing rock step at home
- Ready for next choreography section
```

**Generated file** (`sophia-chen.md`):

```markdown
---
type: quick-note
student: Sophia Chen
date: 2025-11-18
class: Intermediate Hip-Hop
---

# Sophia Chen - Note de Cours

**Date**: 18 novembre 2025
**Classe**: Hip-Hop Intermédiaire

## Observations

Sophia a montré une belle énergie aujourd'hui en classe! 🌟

### Points Positifs
- Bon niveau d'énergie maintenu pendant toute la session
- A bien intégré les corrections de la semaine dernière
- Prête à apprendre la prochaine section de chorégraphie

### À Travailler
- **Rock step**: Continuer la pratique à la maison
  - Focus sur le transfert de poids
  - Garder les genoux souples
  - Pratiquer avec différents tempos

### Prochaine Session
Sophia est prête pour la nouvelle section de chorégraphie. Je recommande:
- 5-10 minutes de pratique du rock step avant chaque cours
- Regarder des vidéos de référence pour visualiser le mouvement
- Venir 5 minutes plus tôt pour un échauffement supplémentaire

**Note**: Sophia fait de beaux progrès! Encourage-la à continuer! 💪

---
**Par Marie** 🩰
```

### Example 3: Class Documentation

**Scenario**: Document a complete class session.

**User request**:
```
Document today's Intermediate Hip-Hop class:

Date: November 18, 2025
Attendance: Emma Rodriguez, Sophia Chen, Maya Patel, Lucas Martin

Warm-up: Dynamic stretching, isolation drills (10 min)
Technique: Bounce, rock step, basic grooves (20 min)
Choreography: Working on "Uptown Funk" 8-count sequence (25 min)
Cooldown: Static stretching, feedback circle (5 min)

Observations:
- Class energy was excellent
- Most students struggled with quick direction changes
- Emma showed great leadership helping others
- Ready to add formation changes next week

Next class focus: Continue choreography, add formation transitions
```

**Generated file** (`2025-11-18-intermediate-hiphop.md`):

```markdown
---
type: class-notes
class: Intermediate Hip-Hop
date: 2025-11-18
duration: 60 minutes
instructor: [Instructor Name]
---

# Cours Hip-Hop Intermédiaire - 18 Novembre 2025

## Présences

**Élèves présents** (4/6):
- ✅ Emma Rodriguez
- ✅ Sophia Chen
- ✅ Maya Patel
- ✅ Lucas Martin
- ❌ [Absent 1]
- ❌ [Absent 2]

**Taux de présence**: 67%

## Structure du Cours

### Échauffement (10 minutes)
- Étirements dynamiques
- Exercices d'isolation (tête, épaules, torse, hanches)
- Préparation cardiovasculaire

### Technique (20 minutes)
**Focus**: Fondamentaux du hip-hop
- **Bounce**: Travail du rebond naturel
- **Rock step**: Transfert de poids et fluidité
- **Grooves de base**: Intégration du rythme et du mouvement

### Chorégraphie (25 minutes)
**Musique**: "Uptown Funk" - Bruno Mars
**Section travaillée**: Séquence de 8 comptes (comptes 1-8)

Décomposition:
- Comptes 1-2: Rock step vers la droite
- Comptes 3-4: Bounce avec isolation des épaules
- Comptes 5-6: Step touch avec attitude
- Comptes 7-8: Freeze en pose finale

### Retour au calme (5 minutes)
- Étirements statiques (ischio-jambiers, quadriceps, dos)
- Cercle de feedback: Chaque élève partage un moment fort du cours

## Observations

### Points Forts 🌟
- **Énergie exceptionnelle** du groupe
- Bonne participation de tous les élèves
- **Emma Rodriguez**: Leadership naturel, a aidé ses camarades
- Progression visible sur les bounces

### Défis 📝
- **Changements de direction rapides**: La majorité du groupe a trouvé cela difficile
- Transition entre rock step et bounce nécessite plus de fluidité
- Synchronisation de groupe à améliorer

### Observations Individuelles
- **Emma**: Excellente, aide les autres naturellement
- **Sophia**: Bon progrès sur le rock step, continue!
- **Maya**: Énergie positive, travailler la précision
- **Lucas**: Bon rythme, développer la confiance

## Plan pour le Prochain Cours

**Date**: 25 novembre 2025

### Objectifs
1. Réviser la séquence de 8 comptes (5 min)
2. Ajouter la section suivante (comptes 9-16)
3. **Nouveau**: Introduire les changements de formation
4. Travailler les transitions rapides

### Préparation
- Préparer schéma des formations
- Créer exercices spécifiques pour les changements de direction
- Musique: "Uptown Funk" + backing track sans voix pour la pratique

### Notes
- Féliciter le groupe pour l'énergie du cours
- Encourager la pratique à la maison (rock step, bounces)
- Rappeler: Récital en mars, cette chorégraphie sera présentée!

## Devoirs pour les Élèves

- Pratiquer la séquence de 8 comptes (minimum 3 fois)
- Regarder des vidéos de référence de hip-hop (Bruno Mars, Les Twins)
- Étirer régulièrement (surtout ischio-jambiers et hanches)

## Matériel/Logistique

- ✅ Système son fonctionne bien
- ✅ Miroirs propres
- ⚠️ Climatisation un peu forte (ajuster pour prochain cours)
- 📝 Rappeler aux parents: Formulaires de récital à rendre avant décembre

---

**Cours documenté par Marie** 🩰
**Durée totale**: 60 minutes
**Prochaine session**: 25 novembre 2025, 18h00
```

## Advanced Workflows

### Example 4: Batch Evaluations

**Scenario**: Evaluate multiple students after a recital rehearsal.

**User request**:
```
Create evaluations for these students from today's recital rehearsal:

Emma Rodriguez:
- Performance confidence: 18/20
- Remembers choreography perfectly
- Strong stage presence

Sophia Chen:
- Technical execution: 16/20
- Needs work on facial expressions
- Good energy but tentative in some sections

Maya Patel:
- Rhythm and musicality: 19/20
- Excellent performer
- Minor spacing issues in formations
```

**Generated file** (`2025-11-18_recital-rehearsal-evaluations.md`):

```markdown
---
type: batch-evaluations
date: 2025-11-18
context: Recital Rehearsal
students: 3
---

# Évaluations - Répétition de Récital
**Date**: 18 novembre 2025

---

## Emma Rodriguez

### Performance Confidence (18/20)

Emma montre une confiance exceptionnelle sur scène! Sa présence est assurée et elle transmet son énergie au public avec naturel. Elle sait exactement où elle va et comment y arriver.

### Maîtrise de la Chorégraphie

Emma connaît la chorégraphie parfaitement. Pas une hésitation, pas une erreur. Cette maîtrise lui permet de se concentrer sur la performance plutôt que sur les pas.

### Présence Scénique

Sa présence scénique est **forte**. Emma sait comment occuper l'espace et captiver l'attention. C'est une véritable performeuse!

### Recommandations pour le Récital
- Continue exactement comme ça! 🌟
- Peut-être explorer des nuances d'expression pour certaines sections
- Leader naturel: pourrait aider les autres élèves

**Prête pour le récital**: ✅ Absolument!

---

## Sophia Chen

### Exécution Technique (16/20)

La technique de Sophia est solide avec des mouvements précis et contrôlés. Sa coordination est bonne et elle exécute les pas correctement.

### Expression Faciale

C'est le principal point à travailler avant le récital. Sophia se concentre tellement sur les pas qu'elle oublie parfois de "performer". Quelques exercices:
- Pratiquer devant un miroir en souriant
- Filmer une run-through et observer son visage
- Se rappeler: le public veut voir ton plaisir!

### Énergie et Confiance

Bonne énergie générale, mais Sophia devient hésitante dans certaines sections (notamment les transitions vers les formations latérales). Plus de répétitions vont renforcer sa confiance.

### Recommandations pour le Récital
1. **Priorité #1**: Travailler l'expression faciale
2. Répéter les sections où elle hésite (20 fois minimum)
3. Visualiser le succès avant de monter sur scène
4. Se rappeler: elle CONNAÎT cette chorégraphie!

**Prête pour le récital**: ⚠️ Presque! Besoin de quelques répétitions supplémentaires

---

## Maya Patel

### Rythme et Musicalité (19/20)

Maya possède un sens du rythme exceptionnel! Elle ressent la musique et son corps suit naturellement. C'est un vrai talent.

### Performance

Excellente performeuse qui sait comment donner de l'énergie et transmettre des émotions. Le public va l'adorer!

### Spacing dans les Formations

Petits ajustements nécessaires:
- Formation en V: se déplacer légèrement à gauche (30 cm)
- Formation en ligne: attention à l'espacement avec Sophia
- Transition finale: arriver au spot 1 compte plus tôt

### Recommandations pour le Récital
1. Marquer les spots au sol (si possible) pour les répétitions finales
2. Répéter les formations avec l'ensemble du groupe
3. Se fier à sa musicalité naturelle - c'est son super pouvoir! 🎵

**Prête pour le récital**: ✅ Oui, avec ajustements mineurs

---

## Notes Générales - Groupe

### Points Forts du Groupe
- Excellent niveau d'énergie collectif
- Bonne cohésion et entraide
- Chorégraphie bien assimilée

### À Travailler en Groupe
- Synchronisation lors des transitions
- Formations: spacing et alignement
- Uniformité des mouvements (hauteur des bras, amplitude)

### Plan pour les Dernières Répétitions

**Répétition 1** (22 novembre):
- Run-through complet x3
- Focus sur les formations et spacing
- Travailler les expressions faciales

**Répétition 2** (24 novembre):
- Run-through en costumes
- Simulation de récital (avec public simulé)
- Polishing final

**Répétition Générale** (27 novembre):
- Sur scène si possible
- Avec éclairage
- Timing complet

### Message aux Élèves

Vous êtes sur la bonne voie! 🌟 La chorégraphie est belle, vous la connaissez bien, et vous avez le talent. Maintenant c'est le moment de:
1. **Répéter** pour renforcer la confiance
2. **Performer** pas juste danser
3. **Profiter** du moment sur scène!

Je suis fière de vous! Le récital va être magnifique! 🩰✨

---

**Évaluations par Marie**
**Date**: 18 novembre 2025
**Contexte**: Répétition de récital
**Récital**: 28 novembre 2025
```

### Example 5: Choreography Documentation

**Scenario**: Document a new choreography piece.

**User request**:
```
Document new choreography:

Title: "Thriller Remix"
Music: Thriller by Michael Jackson (remix version)
Duration: 3 minutes
Style: Hip-hop with jazz influences
Level: Intermediate
Dancers: 8 students
Venue: Annual recital

Sections:
- Intro (0:00-0:20): Formation en V, mouvements zombie
- Verse 1 (0:20-0:50): Combinaison hip-hop, isolations
- Chorus (0:50-1:20): Formation en ligne, chorégraphie signature
- Verse 2 (1:20-1:50): Duos et trios
- Chorus 2 (1:50-2:20): Reprise formation en ligne
- Bridge (2:20-2:40): Freestyle section
- Finale (2:40-3:00): Formation en cercle, pose finale

Formations: V, ligne, scattered, cercle
Props: Aucun
Costumes: Noir et blanc, style street
```

**Generated file** (`thriller-remix.md`):

```markdown
---
type: choreography
title: Thriller Remix
music: Thriller - Michael Jackson (Remix)
duration: 180 seconds
style: Hip-Hop / Jazz
level: Intermediate
dancers: 8
created: 2025-11-18
---

# Thriller Remix - Chorégraphie

## Informations Générales

**Titre**: Thriller Remix
**Artiste**: Michael Jackson
**Version**: Remix moderne
**Durée totale**: 3:00 minutes
**Style**: Hip-hop avec influences jazz
**Niveau**: Intermédiaire
**Nombre de danseurs**: 8
**Venue de performance**: Récital annuel

## Vue d'Ensemble de la Structure

| Section | Timing | Formation | Focus |
|---------|--------|-----------|-------|
| Intro | 0:00-0:20 | V | Mouvements zombie |
| Verse 1 | 0:20-0:50 | Scattered | Isolations hip-hop |
| Chorus 1 | 0:50-1:20 | Ligne | Chorégraphie signature |
| Verse 2 | 1:20-1:50 | Duos/Trios | Interactions |
| Chorus 2 | 1:50-2:20 | Ligne | Reprise signature |
| Bridge | 2:20-2:40 | Free | Freestyle/Impro |
| Finale | 2:40-3:00 | Cercle | Pose finale |

## Détails par Section

### Introduction (0:00-0:20) - "L'Éveil"

**Formation**: V (Emma au sommet)

**Comptes 1-8**: Lumières s'allument lentement
- Danseurs immobiles en pose "zombie endormi"
- Sur le compte 5: Premier mouvement (tête qui se redresse)
- Comptes 7-8: Regard vers le public

**Comptes 9-16**: Réveil progressif
- Isolation des épaules (up, up, roll)
- Bras qui se lèvent lentement (style zombie)
- Pas lents vers l'avant (2 pas)

**Comptes 17-24**: Transition
- Formation V se resserre
- Montée d'énergie progressive
- Pose de transition (bras en croix)

**Notes techniques**:
- Mouvement LENT et contrôlé
- Visages expressifs (zombies qui se réveillent)
- Timing précis essentiel

### Verse 1 (0:20-0:50) - "Le Groove"

**Formation**: Scattered (positions libres mais organisées)

**Comptes 1-8**: Combinaison de base
1-2: Rock step droit
3-4: Bounce avec isolation épaules
5-6: Step touch gauche
7-8: Pose avec attitude

**Comptes 9-16**: Isolation showcase
- Isolations tête (4 counts)
- Isolations torse (4 counts)
- Intégrer le bounce constant

**Comptes 17-32**: Déplacement
- Travelling vers leurs positions pour le chorus
- Continuer les isolations en mouvement
- Finir en formation ligne (8 danseurs)

**Notes techniques**:
- Focus sur les ISOLATIONS nettes
- Garder le groove constant (bounce)
- Transitions fluides vers formation ligne

### Chorus 1 (0:50-1:20) - "Signature Move"

**Formation**: Ligne horizontale (centre scène)

**Comptes 1-16**: Chorégraphie signature "Thriller"
1-4: Bras zombie à droite + step
5-8: Bras zombie à gauche + step
9-12: Turn combination (half turn)
13-16: Pose iconic (bras en griffe)

**Comptes 17-24**: Vague humaine
- De gauche à droite
- Chaque danseur 2 comptes de décalage
- Créer effet "wave"

**Comptes 25-32**: Synchronisation totale
- Tous ensemble même mouvement
- Énergie au maximum
- Finir en pose strong

**Notes techniques**:
- SYNCHRONISATION essentielle
- Amplitude maximale des mouvements
- Sourires/expressions engageantes

### Verse 2 (1:20-1:50) - "Interactions"

**Formation**: Duos et trios

**Duos**:
- Emma + Sophia
- Maya + Lucas
- [Pair 3]
- [Pair 4]

**Comptes 1-16**: Chorégraphie en miroir
- Duos face à face
- Mouvements en miroir/opposition
- Jeu de dynamique (push/pull)

**Comptes 17-24**: Trios formation
- Reformation en trios
- Un leader, deux suiveurs
- Cascade de mouvements

**Comptes 25-32**: Transition
- Retour en formation ligne
- Travelling diagonal
- Build up d'énergie

**Notes techniques**:
- Interactions naturelles entre partenaires
- Maintenir l'énergie même en petits groupes
- Timing crucial pour reformations

### Chorus 2 (1:50-2:20) - "Reprise"

**Formation**: Ligne (même que Chorus 1)

**Comptes 1-32**: Reprise de la chorégraphie signature
- Même séquence que Chorus 1
- MAIS avec variations:
  - Plus d'amplitude
  - Niveau d'énergie supérieur
  - Petites variations personnelles autorisées

**Notes techniques**:
- Montrer l'évolution/intensification
- Variations subtiles, pas de changements majeurs
- Préparer énergie pour le bridge

### Bridge (2:20-2:40) - "Freestyle Magic"

**Formation**: Free (positions libres)

**Comptes 1-8**: Freestyle section
- Chaque danseur improvise dans son espace
- Garder le style "zombie hip-hop"
- Possibilité de batailles rapides

**Comptes 9-16**: Regroupement progressif
- Convergence vers centre
- Formation cercle en cours
- Maintenir freestyle individuel

**Notes techniques**:
- Rester dans le STYLE même en freestyle
- Conscience spatiale (éviter collisions)
- Transition naturelle vers finale

### Finale (2:40-3:00) - "Le Grand Finish"

**Formation**: Cercle (tous face au public)

**Comptes 1-8**: Build up final
- Cercle se resserre progressivement
- Énergie monte crescendo
- Mouvements synchronisés

**Comptes 9-12**: Climax
- Explosion d'énergie
- Jump/grand mouvement
- Formation finale setup

**Comptes 13-16**: Pose finale
- Formation dispersée ou groupée (à décider)
- Pose strong et impactante
- Hold jusqu'à la fin de la musique
- **FREEZE TOTAL**

**Notes techniques**:
- Contrôle dans le freeze final
- Expressions fortes maintenues
- Timing précis de la pose finale

## Formations Détaillées

### Formation V
```
        👤 (Emma - Leader)
    👤     👤
  👤         👤
👤             👤
  👤         👤
```

### Formation Ligne
```
👤 👤 👤 👤 👤 👤 👤 👤
```

### Formation Cercle
```
    👤   👤   👤
  👤         👤
    👤   👤   👤
```

## Transitions Critiques

1. **Intro → Verse 1**: Formation V s'ouvre en scattered
2. **Verse 1 → Chorus 1**: Scattered converge en ligne
3. **Chorus 1 → Verse 2**: Ligne se divise en duos/trios
4. **Verse 2 → Chorus 2**: Duos/trios reforment ligne
5. **Chorus 2 → Bridge**: Ligne se disperse en free
6. **Bridge → Finale**: Free converge en cercle

## Plan d'Enseignement

### Semaine 1-2: Fondations
- Enseigner sections individuellement
- Focus sur la technique
- Pas encore les formations

### Semaine 3-4: Assemblage
- Connecter les sections
- Introduire les formations
- Travailler les transitions

### Semaine 5-6: Polish
- Run-throughs complets
- Peaufiner synchronisation
- Expressions et performance

### Semaine 7-8: Préparation Récital
- Répétitions en costume
- Sur scène si possible
- Run-throughs chronométrés

## Notes de Production

### Costumes
- **Style**: Street, noir et blanc
- **Suggestions**:
  - Pantalon noir
  - T-shirt blanc ou blanc/noir
  - Baskets noires
  - Accessoires: gants blancs (optionnel)

### Accessoires/Props
- Aucun prop nécessaire
- Optionnel: éclairage spécial pour effet zombie

### Musique
- **Version**: Remix moderne (3:00)
- **Télécharger**: Version haute qualité
- **Backup**: Avoir 2 copies sur clés USB différentes

### Scène/Espace
- **Minimum requis**: 6m x 6m
- **Idéal**: 8m x 8m
- **Considérations**: Besoin d'espace pour formations et déplacements

## Points de Nettoyage (Cleaning Notes)

### À surveiller:
- [ ] Synchronisation dans les chorus
- [ ] Transitions fluides entre formations
- [ ] Amplitudes des mouvements (uniformité)
- [ ] Expressions faciales (zombie attitude!)
- [ ] Timing des poses (hold assez long)
- [ ] Spacing dans les formations
- [ ] Énergie maintenue tout au long

### Sessions de nettoyage:
1. **Session 1**: Focus sur synchronisation chorus
2. **Session 2**: Peaufiner transitions
3. **Session 3**: Expressions et performance quality
4. **Session 4**: Run-through final polish

## Casting/Roles

| Danseur | Position Spéciale | Notes |
|---------|-------------------|-------|
| Emma Rodriguez | Leader, sommet du V | Strong presence |
| Sophia Chen | - | Focus expression |
| Maya Patel | - | Excellent rhythm |
| Lucas Martin | - | - |
| [Danseur 5] | - | - |
| [Danseur 6] | - | - |
| [Danseur 7] | - | - |
| [Danseur 8] | - | - |

## Vidéos de Référence

- Original Michael Jackson "Thriller"
- Remixes hip-hop modernes de "Thriller"
- Tutorials isolations zombie
- Performances hip-hop d'ensemble

## Timeline de Production

| Date | Milestone |
|------|-----------|
| 18 Nov | Chorégraphie créée |
| 25 Nov | Première moitié enseignée |
| 2 Déc | Chorégraphie complète enseignée |
| 9 Déc | Formations intégrées |
| 16 Déc | Premier run-through complet |
| 6 Jan | Polish sessions commencent |
| 20 Jan | Répétition en costume |
| 27 Jan | Répétition générale |
| 3 Fév | **RÉCITAL** 🌟 |

---

**Chorégraphie créée par**: [Instructor Name]
**Documentée par Marie** 🩰
**Date**: 18 novembre 2025
**Version**: 1.0
```

## Integration Patterns

### Example 6: Orchestrator Delegation

**Scenario**: Main orchestrator (Anga) delegates evaluation tasks to Marie.

```typescript
// Orchestrator code
class RecitalPreparationOrchestrator {
  async prepareRecital(recitalData) {
    console.log("Starting recital preparation workflow...");

    // Step 1: Gather student information
    const students = await this.getRecitalParticipants(recitalData.recital_id);
    console.log(`Found ${students.length} participants`);

    // Step 2: Delegate evaluations to Marie
    const evaluations = [];
    for (const student of students) {
      console.log(`Requesting evaluation for ${student.name}...`);

      // Create task for Marie
      const taskResult = await this.delegateToMarie({
        type: "formal_evaluation",
        student: student,
        context: `Recital preparation: ${recitalData.name}`,
        observations: await this.gatherRecentObservations(student.id),
      });

      evaluations.push(taskResult);
    }

    // Step 3: Compile readiness report
    const readinessReport = this.compileReadinessReport(evaluations);

    // Step 4: Generate action items
    const actionItems = this.generateActionItems(readinessReport);

    return {
      evaluations,
      readiness_report: readinessReport,
      action_items: actionItems,
    };
  }

  async delegateToMarie(taskData) {
    // Create task file
    const taskId = this.generateTaskId();
    const task = {
      task_id: taskId,
      timestamp: new Date().toISOString(),
      worker: "marie",
      priority: "high",
      description: `Create ${taskData.type} for ${taskData.student.name}`,
      context: {
        student_name: taskData.student.name,
        student_id: taskData.student.id,
        evaluation_type: taskData.type,
        context_note: taskData.context,
        observations: taskData.observations,
      },
      requirements: [
        "Use APEXX methodology",
        "Write in French",
        "Include recital-readiness assessment",
        "Provide specific rehearsal recommendations",
      ],
      expected_output: {
        format: "markdown",
        artifacts: ["evaluation"],
      },
    };

    // Write task
    await this.writeTask("marie", task);

    // Wait for result
    const result = await this.waitForResult("marie", taskId, timeout = 120000);

    return result;
  }
}
```

### Example 7: Continuous Monitoring

**Scenario**: Monitor Marie's task queue and process results.

```typescript
class MarieMonitor {
  constructor() {
    this.resultQueue = [];
    this.processingTasks = new Map();
  }

  async startMonitoring() {
    console.log("Starting Marie task monitor...");

    // Monitor for new results
    setInterval(async () => {
      await this.checkForResults();
    }, 5000); // Check every 5 seconds

    // Monitor for stuck tasks
    setInterval(async () => {
      await this.checkForStuckTasks();
    }, 60000); // Check every minute
  }

  async checkForResults() {
    const resultFiles = await this.listFiles("core/shared/results/marie/");

    for (const file of resultFiles) {
      const taskId = this.extractTaskId(file);

      if (!this.processingTasks.has(taskId)) {
        // New result found
        const result = await this.readResult(file);
        await this.processResult(result);

        // Clean up
        await this.archiveResult(file);
        this.processingTasks.delete(taskId);
      }
    }
  }

  async processResult(result) {
    console.log(`Processing result for task ${result.task_id}`);

    // Extract evaluation data
    const evaluation = {
      student_name: this.extractStudentName(result),
      total_score: this.extractScore(result),
      strengths: this.extractStrengths(result),
      areas_for_improvement: this.extractImprovements(result),
      recommendations: this.extractRecommendations(result),
      file_path: result.artifacts[0]?.path,
    };

    // Store in database
    await this.saveToDatabase(evaluation);

    // Notify stakeholders
    await this.notifyCompletion(evaluation);

    // Update dashboard
    await this.updateDashboard(evaluation);

    this.resultQueue.push(result);
  }

  async checkForStuckTasks() {
    const now = Date.now();

    for (const [taskId, submission_time] of this.processingTasks.entries()) {
      const elapsed = now - submission_time;

      if (elapsed > 180000) {
        // 3 minutes
        console.warn(`Task ${taskId} appears stuck (${elapsed}ms elapsed)`);

        // Check if task file still exists
        const taskExists = await this.taskFileExists(taskId);

        if (!taskExists) {
          // Task was processed but result not found
          console.error(`Task ${taskId} processed but no result found!`);
          await this.handleMissingResult(taskId);
        }
      }
    }
  }
}
```

## Batch Operations

### Example 8: End-of-Month Evaluations

**Scenario**: Create evaluations for all students at month end.

```bash
#!/bin/bash
# monthly-evaluations.sh

echo "Starting monthly evaluation batch..."

# Load student list
STUDENTS=(
  "Emma Rodriguez"
  "Sophia Chen"
  "Maya Patel"
  "Lucas Martin"
  "Olivia Johnson"
  "Noah Williams"
)

# Load observations from tracking file
OBSERVATIONS_FILE="monthly-observations-nov-2025.txt"

# Process each student
for student in "${STUDENTS[@]}"; do
  echo "Processing evaluation for: $student"

  # Extract observations for this student
  observations=$(grep -A 10 "^$student:" "$OBSERVATIONS_FILE")

  # Submit task to Marie
  ./send-task-to-marie.sh "Create formal evaluation for $student based on November observations: $observations"

  # Wait a bit between submissions
  sleep 10
done

echo "All evaluation tasks submitted!"
echo "Waiting for completion..."

# Wait for all results (estimate 60s per evaluation)
sleep $(( ${#STUDENTS[@]} * 60 ))

# Check results
echo "Checking results..."
ls -la core/shared/results/marie/

# Compile summary
echo "Evaluation Summary:" > monthly-summary-$(date +%Y%m).txt
for result in core/shared/results/marie/task-*.json; do
  student=$(jq -r '.context.student_name' "$result")
  score=$(jq -r '.findings.data.total_score' "$result")
  echo "$student: $score/100" >> monthly-summary-$(date +%Y%m).txt
done

cat monthly-summary-$(date +%Y%m).txt
echo "Batch complete!"
```

### Example 9: Recital Preparation Pipeline

**Scenario**: Complete recital preparation workflow.

```bash
#!/bin/bash
# recital-prep-pipeline.sh

RECITAL_NAME="Winter Showcase 2025"
RECITAL_DATE="2026-02-15"

echo "========================================="
echo "Recital Preparation Pipeline"
echo "Recital: $RECITAL_NAME"
echo "Date: $RECITAL_DATE"
echo "========================================="

# Step 1: Student evaluations
echo "Step 1: Generating student evaluations..."
./send-task-to-marie.sh "Create batch evaluations for recital participants"
sleep 120

# Step 2: Choreography documentation
echo "Step 2: Documenting choreography..."
./send-task-to-marie.sh "Document all recital choreographies"
sleep 60

# Step 3: Rehearsal schedule
echo "Step 3: Creating rehearsal schedule..."
./send-task-to-marie.sh "Create rehearsal schedule for $RECITAL_NAME leading to $RECITAL_DATE"
sleep 60

# Step 4: Parent communications
echo "Step 4: Drafting parent communications..."
./send-task-to-marie.sh "Draft parent communication about recital expectations and schedule"
sleep 60

# Step 5: Readiness assessment
echo "Step 5: Compiling readiness assessment..."
./send-task-to-marie.sh "Create recital readiness assessment based on recent evaluations"
sleep 90

echo "========================================="
echo "Pipeline complete!"
echo "All documents saved to: workspaces/dance/studio/recitals/$RECITAL_NAME/"
echo "========================================="

# Generate summary report
echo "Generating summary report..."
cat > recital-prep-summary.md << EOF
# $RECITAL_NAME - Preparation Summary

**Generated**: $(date)

## Documents Created

- Student evaluations: $(ls workspaces/dance/studio/evaluations/formal/*.md | wc -l) files
- Choreography docs: $(ls workspaces/dance/studio/choreography/*.md | wc -l) pieces
- Rehearsal schedule: Created
- Parent communications: Drafted
- Readiness assessment: Completed

## Next Steps

1. Review all evaluations
2. Finalize rehearsal schedule
3. Send parent communications
4. Begin intensive rehearsals
5. Schedule costume fittings

**Target Date**: $RECITAL_DATE
EOF

cat recital-prep-summary.md
```

## Troubleshooting Examples

### Example 10: Debugging Task Processing

```bash
#!/bin/bash
# debug-marie-tasks.sh

echo "Marie Task Debugging Tool"
echo "=========================="

# Check container status
echo "1. Container Status:"
docker ps | grep marie
if [ $? -ne 0 ]; then
  echo "❌ Marie container not running!"
  echo "Start with: docker compose up marie -d"
  exit 1
fi
echo "✅ Container running"

# Check task directory
echo -e "\n2. Task Directory:"
task_count=$(ls core/shared/tasks/marie/*.json 2>/dev/null | wc -l)
echo "Pending tasks: $task_count"
if [ $task_count -gt 0 ]; then
  echo "Task files:"
  ls -lh core/shared/tasks/marie/
fi

# Check result directory
echo -e "\n3. Result Directory:"
result_count=$(ls core/shared/results/marie/*.json 2>/dev/null | wc -l)
echo "Completed tasks: $result_count"
if [ $result_count -gt 0 ]; then
  echo "Latest results:"
  ls -lht core/shared/results/marie/ | head -5
fi

# Check logs
echo -e "\n4. Recent Logs:"
docker logs marie --tail 20

# Check workspace
echo -e "\n5. Workspace Files:"
echo "Formal evaluations:"
ls -lh workspaces/dance/studio/evaluations/formal/ | tail -5

# Performance check
echo -e "\n6. Performance:"
if [ $task_count -gt 10 ]; then
  echo "⚠️  Warning: High task backlog ($task_count tasks)"
  echo "Marie processes tasks sequentially (~60s each)"
  echo "Estimated time to clear: $(( task_count * 60 / 60 )) minutes"
fi

# Recommendations
echo -e "\n7. Recommendations:"
if [ $task_count -gt 0 ] && [ $result_count -eq 0 ]; then
  echo "⚠️  Tasks submitted but no results yet"
  echo "   - Check if Marie is processing (docker logs marie -f)"
  echo "   - Verify task JSON format"
  echo "   - Wait 60-90 seconds for first result"
elif [ $result_count -gt 0 ]; then
  echo "✅ Marie is processing tasks successfully"
else
  echo "ℹ️  No tasks pending, ready for new work"
fi
```

## Best Practices

### Practice 1: Task Submission Pattern

```bash
# ✅ GOOD: Clear, structured request
./send-task-to-marie.sh "Create formal evaluation for Emma Rodriguez:
Attitude 18/20 - excellent engagement and leadership
Posture 15/20 - good alignment, needs core work
Energy 19/20 - constant high energy
Expression 16/20 - developing confidence
Execution 17/20 - strong technique"

# ❌ BAD: Vague request
./send-task-to-marie.sh "Evaluate Emma"
```

### Practice 2: Result Verification

```bash
# Always verify results were created
task_id="task-1700000000-abc123"

# Check result JSON
if [ -f "core/shared/results/marie/$task_id.json" ]; then
  # Parse result
  status=$(jq -r '.status' "core/shared/results/marie/$task_id.json")
  artifacts=$(jq -r '.artifacts[].path' "core/shared/results/marie/$task_id.json")

  echo "Task $task_id: $status"
  echo "Artifacts:"
  for artifact in $artifacts; do
    if [ -f "$artifact" ]; then
      echo "  ✅ $artifact"
    else
      echo "  ❌ $artifact (missing!)"
    fi
  done
else
  echo "❌ No result found for task $task_id"
fi
```

### Practice 3: Error Handling

```bash
#!/bin/bash
# robust-task-submission.sh

submit_task() {
  local description="$1"
  local max_retries=3
  local retry_count=0

  while [ $retry_count -lt $max_retries ]; do
    echo "Attempt $(( retry_count + 1 ))/$max_retries: Submitting task..."

    # Submit task
    task_id=$(./send-task-to-marie.sh "$description" | grep "task-" | cut -d: -f2 | tr -d ' ')

    if [ -z "$task_id" ]; then
      echo "Failed to get task ID"
      retry_count=$(( retry_count + 1 ))
      sleep 5
      continue
    fi

    # Wait for result (with timeout)
    local timeout=120
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
      if [ -f "core/shared/results/marie/$task_id.json" ]; then
        # Check status
        status=$(jq -r '.status' "core/shared/results/marie/$task_id.json")

        if [ "$status" == "complete" ]; then
          echo "✅ Task completed successfully"
          return 0
        elif [ "$status" == "error" ]; then
          echo "❌ Task failed with error"
          error_msg=$(jq -r '.errors[0].message' "core/shared/results/marie/$task_id.json")
          echo "Error: $error_msg"
          retry_count=$(( retry_count + 1 ))
          break
        fi
      fi

      sleep 5
      elapsed=$(( elapsed + 5 ))
    done

    if [ $elapsed -ge $timeout ]; then
      echo "⏱️  Timeout waiting for result"
      retry_count=$(( retry_count + 1 ))
    fi
  done

  echo "❌ Failed after $max_retries attempts"
  return 1
}

# Usage
submit_task "Create formal evaluation for Emma Rodriguez..."
```

## Conclusion

These examples demonstrate:

- **Basic Workflows**: Single operations (evaluations, notes, documentation)
- **Advanced Workflows**: Batch operations, multi-student processing
- **Integration Patterns**: Orchestrator delegation, continuous monitoring
- **Troubleshooting**: Debugging tools and error handling
- **Best Practices**: Robust task submission and result verification

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For migration instructions, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: CodeHornets-AI Team
