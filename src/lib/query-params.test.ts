import { describe, it, expect } from "vitest";
import { parseStockQuery, toSkip } from "./query-params";

describe("parseStockQuery", () => {
  it("falls back to page 1 when page is missing or junk", () => {
    expect(parseStockQuery(new URLSearchParams("")).page).toBe(1);
    expect(parseStockQuery(new URLSearchParams("page=0")).page).toBe(1);
    expect(parseStockQuery(new URLSearchParams("page=abc")).page).toBe(1);
    expect(parseStockQuery(new URLSearchParams("page=-3")).page).toBe(1);
  });

  it("reads a valid page", () => {
    expect(parseStockQuery(new URLSearchParams("page=4")).page).toBe(4);
  });
});

describe("toSkip", () => {
  it("converts a 1-based page to the API's zero-based skip", () => {
    expect(toSkip(1)).toBe(0);
    expect(toSkip(3)).toBe(20);
  });
});
