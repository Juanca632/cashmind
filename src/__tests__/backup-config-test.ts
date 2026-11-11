import config from "../../app.json";

describe("My data comes back after reinstalling", () => {
  it("Restore on reinstall: the app configuration keeps Android automatic backup enabled", () => {
    expect(config.expo.android.allowBackup).toBe(true);
  });
});
