# Research: Dark Mode

## R1. Following the system theme

- **Decision**: `expo.userInterfaceStyle: "automatic"` in app.json and `useColorScheme()` from react-native in `useTheme()`; Expo Router's `ThemeProvider` gets `DarkTheme` or `DefaultTheme`; the stack's header, content background and `statusBarStyle` come from the theme.
- **Rationale**: With `"light"` Android always reports light, so `useColorScheme()` never changes. `"automatic"` lets the app follow the system and update live.

## R2. Tokens

- **Decision**: one theme object per scheme (light, dark) with every color the screens use: `text`, `textSecondary`, `background`, `backgroundElement`, `accent` / `onAccent` (filled main action), `accentInk` (green used as text or border), `kindFill` (filled kind option with white text), `kindInk` (kind color as text or icon), `kindTint` (soft kind background), `savingsTrack`, `error` (text), `errorFill` (destructive button), `cardShadow`. `Hero` (month card) stays one fixed set for both themes.
- **Rationale**: in light mode the same color serves as fill and as ink; in dark mode ink must be lighter to read on dark backgrounds while fills with white text must stay dark. Splitting them keeps light mode identical (FR-004).
- **Dark palette**: background #0E1113, element #1A1F22, text #F1F3F5, secondary #9AA3AE; accentInk #5FD4BC; kindInk expense #FDBA8C, savings #6EE7B7, income #5EEAD4; kindTint expense #3A2418, savings #11342A, income #0F3330; error #FF8A80.
