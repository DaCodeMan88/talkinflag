import { describe, it, expect } from "vitest";
import { matchImageBlock } from "./RichText";

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
