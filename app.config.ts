import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The demo variant (EXPO_PUBLIC_DEMO=1, the `demo` build profile) is a separate app: its own name
 * and package, so it installs next to the real CashMind and never touches its data.
 */
const IS_DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEMO ? 'CashMind Demo' : (config.name ?? 'CashMind'),
  slug: config.slug ?? 'cashmind',
  android: {
    ...config.android,
    package: IS_DEMO ? `${config.android?.package}.demo` : config.android?.package,
  },
});
