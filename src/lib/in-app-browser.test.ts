import { describe, it, expect } from "vitest";
import { isInAppBrowser } from "./in-app-browser";

describe("isInAppBrowser", () => {
  it("detects Instagram iOS webview", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 334.0.0.27.94"
      )
    ).toBe(true);
  });

  it("detects Facebook / Messenger webview", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; ...) [FBAN/FBIOS;FBAV/...]")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14; ...) FB_IAB/FB4A;FBAV/...")).toBe(true);
  });

  it("detects WhatsApp, LINE, TikTok webviews", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; ...) WhatsApp/23.20.79")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; ...) Line/13.19.0")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14; ...) musical_ly_2022803030 ...")).toBe(true);
  });

  it("does NOT flag real Safari, Chrome, Firefox", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
      )
    ).toBe(false);
  });

  it("does NOT flag UAs that merely contain token substrings", () => {
    // Leading \b guard: "Outline/" must not match the "Line/" token.
    expect(
      isInAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Outline/1.2 Mobile/15E148")
    ).toBe(false);
    // Edge on Android is a real browser, not a webview.
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 EdgA/126.0.2592.56"
      )
    ).toBe(false);
  });

  it("returns false for empty/undefined", () => {
    expect(isInAppBrowser("")).toBe(false);
    expect(isInAppBrowser(undefined)).toBe(false);
  });
});
