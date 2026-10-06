# LISIERE

Un jeu original d'exploration, de strategie et d'enigmes en 2D, jouable dans le navigateur et sur Android. Trois chapitres entre foret, machines et brume. Interface en francais, TypeScript, React et Canvas 2D.

L'atmosphere s'inscrit dans la tradition des jeux d'enigmes sombres. Le code, les niveaux, le personnage et les illustrations sont propres a ce projet : aucun asset de Limbo ou Inside n'est utilise. Le projet n'est ni une adaptation officielle, ni affilie a leurs createurs.

## Lancer le projet

Pre-requis : Node.js 22.18 ou plus recent, npm et un navigateur moderne.

```sh
npm ci
npm run dev
```

Ouvrez l'adresse locale affichee par Vite. Pour utiliser la version de Node recommandee avec nvm : `nvm use`.

## Compiler le jeu

```sh
npm run build
npm run preview
```

La compilation produit `dist/`. Le plugin Vite deja configure regroupe le JavaScript et le CSS dans `dist/index.html`. Les illustrations et le favicon sont copies dans `dist/`. Il faut publier **tout le dossier**, pas seulement le fichier HTML.

Cette compilation produit la version web HTML/JavaScript. Le dossier `android/` contient aussi une application Android native avec WebView, commandes tactiles et assets embarques hors ligne.

Pour un hebergement dans n'importe quel sous-dossier :

```sh
npm run build -- --base=./
```

## Deposer sur GitHub

Aucun depot distant n'est cree automatiquement. L'ajout sur GitHub necessite votre compte et vos autorisations. Aucun jeton personnel n'est demande ni stocke par l'application.

1. Telechargez l'archive depuis **Le projet > Telecharger le projet complet**, ou utilisez les fichiers source du projet.
2. Creez un depot GitHub, par exemple `lisiere`.
3. Placez le contenu du dossier `lisiere/` de l'archive a la racine du depot, y compris `.github/`, `android/`, `package.json` et `package-lock.json`. Ne televersez pas `node_modules/`.
4. Envoyez les fichiers sur la branche `main`, puis consultez l'onglet **Actions**.
5. Le workflow **Build APK** compile le jeu et l'application Android.

Exemple avec Git en ligne de commande, apres creation du depot :

```sh
git init
git add .
git commit -m "Initial Lisiere game"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/lisiere.git
git push -u origin main
```

Remplacez `VOTRE-COMPTE` et le nom du depot. Connectez-vous avec votre methode GitHub habituelle.

## Fichiers de compilation GitHub

| Fichier | Fonction |
| --- | --- |
| `.github/workflows/build-apk.yml` | Compile le jeu web, l'application Android et publie l'APK installable comme artefact GitHub pendant 30 jours. |
| `android/` | Projet Android Gradle, WebView securise, icone et copie automatique du jeu dans l'APK. |
| `tsconfig.json` | Verification TypeScript stricte. |
| `vite.config.ts` | Compilation Vite, React, Tailwind CSS v4 et regroupement JS/CSS. |
| `.nvmrc` | Version de Node recommandee. |

`build-apk.yml` est le seul workflow du dossier `.github/`. Il s'execute sur `main`, les pull requests et sur demande manuelle. L'APK se recupere dans **Actions > une execution reussie > Artifacts**. L'archive telechargee depuis le jeu contient les **sources** ; l'artefact GitHub contient l'**APK**.

## Jouer

| Action | Commandes |
| --- | --- |
| Se deplacer | Fleches gauche/droite, Q/D ou A/D |
| Sauter | Espace, fleche haut, Z ou W |
| Activer un levier | Appuyer sur E a proximite |
| Pousser une caisse | Maintenir E et une direction |
| Pause | Echap ou bouton Pause |
| Afficher un indice | Bouton Un indice ; la simulation s'arrete pendant la lecture |

Les commandes tactiles apparaissent sur les appareils mobiles. Le cadrage du jeu s'adapte a la taille de l'ecran. Le son est optionnel et ne commence qu'apres une action explicite. Une ambiance procedurale est generee avec Web Audio ; aucun fichier audio tiers n'est necessaire.

**La lisiere** : laissez la caisse sur la dalle, sautez les obstacles et rejoignez la porte.

**Les machines endormies** : activez le levier, observez le cycle du projecteur et traversez quand il s'eteint. La plateforme vous protege lorsque vous restez dessous.

**De l'autre cote** : combinez contrepoids, pont brise, abri et levier pour atteindre la derniere porte.

Les chapitres suivants sont debloques dans l'ordre. Les echecs recommencent le chapitre sans limite de tentatives. Une caisse perdue dans le vide relance aussi le chapitre. La progression est sauvegardee localement **par chapitre**, pas a chaque position. Les parametres du menu permettent d'effacer la sauvegarde et de reduire les animations.

## Android et APK GitHub

L'application native tourne en plein ecran paysage, charge les decors et le jeu depuis ses assets locaux, et affiche des commandes tactiles. Les fichiers sont servis avec `WebViewAssetLoader`, ce qui garde la sauvegarde locale sans origine `file://`. La partie fonctionne hors ligne ; seule la police web optionnelle demande une connexion.

Le projet `android/` genere une APK Debug a partir de `dist/`. Pour compiler en local, installez Java 17, Android SDK platform 35, build-tools 35.0.0, Gradle 8.11.1 et Node 22. Depuis la racine du depot :

```sh
npm ci
npm run build -- --base=./
gradle --no-daemon -p android :app:assembleDebug
```

L'APK apparait dans `android/app/build/outputs/apk/debug/app-debug.apk`. Gradle synchronise automatiquement `dist/` dans les assets Android, avant la compilation de l'APK.

Pour la compilation GitHub, ajoutez le projet a votre depot puis envoyez-le sur `main`. Le workflow **Build APK** compile aussi sur les pull requests et peut etre lance manuellement. Pour recuperer l'APK : **GitHub > Actions > Build APK > execution reussie > Artifacts > lisiere-android-debug-...**. Extrayez l'archive ZIP et installez `app-debug.apk` sur le telephone ; Android peut demander d'autoriser l'installation.

Cette APK Debug est destinee aux essais et au partage. La publication sur Google Play demande une cle de signature Release et un compte de developpeur ; aucune cle privee n'est incluse dans le depot.

## Architecture

```text
src/
  App.tsx                  Menu, progression et navigation
  index.css                Direction artistique et mise en page responsive
  exportProject.ts         Archive ZIP des sources et des illustrations
  components/              Interface, dialogues, aide, lecteur de jeu
  game/
    levels.ts              Definition des trois chapitres
    world.ts               Simulation pure, collisions, portes et projecteurs
    engine.ts              Rendu Canvas, boucle a pas fixe et commandes
  lib/
    storage.ts             Sauvegarde locale et preferences
    useAmbientAudio.ts     Ambiance et sons proceduraux
public/
  images/                  Trois illustrations originales generees pour le jeu
tests/
  world.test.ts            Tests unitaires de la simulation
.github/workflows/         Compilation de l'APK Android uniquement
android/                   Application native Android et configuration Gradle
  app/src/main/java/       WebView securise et commandes Retour Android
  app/build.gradle         Compilation Android et copie des assets web
```

La simulation fonctionne a 60 pas par seconde, independamment du taux de rafraichissement du rendu. Les dialogues suspendent la simulation. Le passage a un autre onglet met le jeu en pause.

L'export ZIP integre les fichiers source via les imports bruts de Vite et telecharge les illustrations depuis la meme origine. Les sources distribuees sont publiques : ne placez jamais de secret dans le code client. Les fichiers `.env` ne sont pas inclus dans l'export.

## Verifications

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/*.test.ts
npm run build
```

Les tests couvrent les collisions, le mouvement, le saut, les caisses, les dalles, les portes, les leviers, les projecteurs, les abris, la reinitialisation et la fin de chapitre. Ils se lancent en local avant chaque envoi ; le workflow `build-apk.yml` se concentre uniquement sur la production de l'APK.

## Accessibilite et donnees

Navigation clavier, dialogues natifs avec focus contenu, libelles en francais, aides textuelles, commandes tactiles et respect de `prefers-reduced-motion`. Le gameplay Canvas reste principalement visuel : il ne constitue pas une experience entierement jouable par lecteur d'ecran.

Pas de compte, de serveur de jeu, de cookies publicitaires ou d'analytique. Progression et preferences sont stockees uniquement dans le stockage local du navigateur. Les polices Google Fonts peuvent etre chargees depuis le reseau ; des polices systeme prennent le relais hors connexion. Le jeu ne demande aucun acces a votre compte GitHub.

## Licence

Code distribue sous licence MIT (voir `LICENSE`). Les dependances conservent leurs licences respectives. Les illustrations ont ete generees pour ce prototype ; elles ne proviennent pas des jeux cites comme references d'ambiance.