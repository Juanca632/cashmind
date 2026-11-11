import config from "../../app.json";
import eas from "../../eas.json";

describe("Recognize the app on the phone", () => {
  it("Launcher: the name shown on the phone is CashMind", () => {
    expect(config.expo.name).toBe("CashMind");
  });

  it("Updates keep working: the package name and the EAS slug do not change", () => {
    expect(config.expo.android.package).toBe("com.juancrestrepo.cashmind");
    expect(config.expo.slug).toBe("cashmind");
  });

  it("Start: the splash screen background is #065F52", () => {
    const splash = config.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    ) as [string, { backgroundColor: string }] | undefined;
    expect(splash?.[1].backgroundColor.toUpperCase()).toBe("#065F52");
  });
});

describe("Build the release APK", () => {
  it("Production build: the production profile builds an APK", () => {
    expect(eas.build.production.android.buildType).toBe("apk");
  });

  it("Updates install on top: the production profile raises the build number on every build", () => {
    expect(eas.build.production.autoIncrement).toBe(true);
  });
});
