# Application Android Lisiere

Cette application Android native contient un WebView plein ecran, un chargement local securise des assets et le jeu compile en JavaScript. Le gameplay, les decors, les commandes tactiles, la sauvegarde, les indices et le son sont embarques dans l'APK : la connexion Internet n'est pas necessaire pour jouer. Internet est utilise seulement par les polices web optionnelles et les liens externes.

## Build local

Pre-requis : JDK 17, Android SDK platform 35 / build-tools 35.0.0, Gradle 8.11.1, Node.js 22.18 ou plus recent.

Depuis la racine du depot :

```sh
npm ci
npm run build -- --base=./
gradle -p android --no-daemon :app:assembleDebug
```

APK installable : `android/app/build/outputs/apk/debug/app-debug.apk`.

La tache Gradle `syncWebAssets` copie automatiquement la derniere compilation de `dist/` vers `android/app/src/main/assets/public/`. Ainsi, l'APK ne peut pas demarrer sur un ecran vide parce que les sources web n'auraient pas ete exportees.

L'application demarre en paysage et masque les barres systeme pour afficher le jeu. Le bouton Android Retour ouvre ou ferme la pause pendant une partie.

## Compilation GitHub

Le workflow `../.github/workflows/build-apk.yml` est le seul workflow du projet. Il installe Node, Java, Android SDK et Gradle, compile le site, puis genere un APK Debug installable a chaque push sur `main` et pour les pull requests.

Pour telecharger l'APK, ouvrez **GitHub > Actions > Build APK > execution verte > Artifacts**, puis telechargez `lisiere-android-debug-<commit>.zip`. Extrayez l'APK, envoyez-le au telephone et confirmez l'installation si Android vous le demande.

Cette version Debug est destinee aux essais et au partage. La publier sur Google Play necessite une cle de signature Release qui n'est volontairement pas incluse dans les fichiers publics.