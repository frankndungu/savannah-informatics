import { describe, it, expect } from "vitest";
import { buildStockPath } from "./stock";
import type { StockQuery } from "./query-params";

const base: StockQuery = { q: "", category: "", sort: "title-asc", page: 1 };

describe("buildStockPath", () => {
  it("uses the search endpoint and drops the category, because the API ignores it there", () => {
    const path = buildStockPath({ ...base, q: "phone", category: "smartphones" });
    expect(path).toContain("/products/search");
    expect(path).toContain("q=phone");
    expect(path).not.toContain("smartphones");
  });

  it("uses the category endpoint when there is no search term", () => {
    const path = buildStockPath({ ...base, category: "smartphones" });
    expect(path).toContain("/products/category/smartphones");
  });

  it("converts the page to the API's skip", () => {
    expect(buildStockPath({ ...base, page: 3 })).toContain("skip=20");
  });

  it("falls back to the default sort when given an unknown value", () => {
    const path = buildStockPath({ ...base, sort: "nonsense" });
    expect(path).toContain("sortBy=title");
    expect(path).toContain("order=asc");
  });
});
