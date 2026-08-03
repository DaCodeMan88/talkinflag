import { describe, it, expect } from "vitest";
import { matchImageBlock, safeUrl } from "./RichText";

describe("matchImageBlock", () => {
  it("parses a standalone image token into { alt, url }", () => {
    expect(matchImageBlock("![A flag football play](https://cdn.example.com/posts/abc.png)")).toEqual({
      alt: "A flag football play",
      url: "https://cdn.example.com/posts/abc.png",
    });
  });

  it("allows an empty alt", () => {
    expect(matchImageBlock("![](https://cdn.example.com/x.jpg)")).toEqual({
      alt: "",
      url: "https://cdn.example.com/x.jpg",
    });
  });

  it("ignores surrounding whitespace", () => {
    expect(matchImageBlock("  ![alt](https://x.com/y.webp)  ")).toEqual({
      alt: "alt",
      url: "https://x.com/y.webp",
    });
  });

  it("does NOT match a normal link (so [text](url) stays a link, not an image)", () => {
    expect(matchImageBlock("[Talkin Flag](https://talkinflag.com)")).toBeNull();
  });

  it("does not match an image token embedded mid-paragraph (block must be exactly the token)", () => {
    expect(matchImageBlock("See this ![alt](https://x.com/y.png) here")).toBeNull();
  });

  it("does not match a bold heading", () => {
    expect(matchImageBlock("**Some Heading**")).toBeNull();
  });
});

describe("safeUrl", () => {
  it("allows http(s), mailto, and site-relative URLs unchanged", () => {
    expect(safeUrl("https://talkinflag.com")).toBe("https://talkinflag.com");
    expect(safeUrl("http://x.com/y")).toBe("http://x.com/y");
    expect(safeUrl("mailto:hi@talkinflag.com")).toBe("mailto:hi@talkinflag.com");
    expect(safeUrl("/players")).toBe("/players");
    expect(safeUrl("#section")).toBe("#section");
  });

  it("neutralizes active/unknown schemes to '#'", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("  javascript:alert(1)")).toBe("#");
    expect(safeUrl("data:text/html,<script>1</script>")).toBe("#");
    expect(safeUrl("vbscript:msgbox(1)")).toBe("#");
  });
});
