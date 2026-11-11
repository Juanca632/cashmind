# Research: App Identity

## R1. Icon layers

- **Decision**: One drawing (open white C: ring radius 250 of 1024, stroke 104, round ends, open from 40° to 320°) exported to five 1024 px PNGs: `icon.png` (C on the gradient), `android-icon-background.png` (gradient only), `android-icon-foreground.png` and `android-icon-monochrome.png` (C at 85 % scale on transparent, white and black), `splash-icon.png` (white C on transparent).
- **Rationale**: Expo SDK 58 builds the adaptive icon from `android.adaptiveIcon.foregroundImage`, `backgroundImage` and `monochromeImage`. Launchers mask the adaptive icon and only the centre 66 % is always visible; at 85 % scale the C spans about 50 % of the canvas, inside that zone.
- **Source**: the SVG of each layer is kept in `assets/icon-source/`, so the PNGs can be exported again with any SVG tool.
- **Alternatives considered**: a generator script in the repo (needs a new dev dependency for one-off work).

## R2. Splash

- **Decision**: `expo-splash-screen` plugin with `backgroundColor: "#065F52"`, `image: ./assets/images/splash-icon.png`, `imageWidth: 200`.
- **Rationale**: SDK 58 docs list `backgroundColor`, `image`, `imageWidth` (default 100) and a `dark` variant; Android 12+ shows the image as the splash icon on that background. The dark variant waits for the dark mode feature.

## R3. Name

- **Decision**: `expo.name: "CashMind"` (launcher label). `slug`, `scheme` and `android.package` stay `cashmind` / `com.juancrestrepo.cashmind`.
- **Rationale**: the package name ties installs, updates and Android backups together; the slug ties the EAS project and its signing key. The home route's hidden header title becomes "CashMind" for consistency.

## R4. Production build

- **Decision**: add a `production` profile to `eas.json` with `"autoIncrement": true` and `"android": { "buildType": "apk" }`.
- **Rationale**: `appVersionSource` is already `remote`, so EAS keeps the version code and raises it each build, and it uses the same Android keystore for every profile of the project, so production APKs install over earlier ones.
