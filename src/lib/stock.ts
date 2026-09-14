import { apiFetch } from "./api";
import { toSkip, PAGE_SIZE, type StockQuery } from "./query-params";

export type Product = {
  id: number;
  title: string;
  brand?: string;
  category: string;
  stock: number;
  description: string;
  price: number;
  sku?: string;
  thumbnail: string;
  images: string[];
};

export type ProductPage = { products: Product[]; total: number };

export type Category = { slug: string; name: string };

const SORT_FIELDS: Record<string, { sortBy: string; order: string }> = {
  "title-asc": { sortBy: "title", order: "asc" },
  "title-desc": { sortBy: "title", order: "desc" },
  "stock-asc": { sortBy: "stock", order: "asc" },
  "stock-desc": { sortBy: "stock", order: "desc" },
};

export function buildStockPath(query: StockQuery): string {
  const sort = SORT_FIELDS[query.sort] ?? SORT_FIELDS["title-asc"];
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String(toSkip(query.page)),
    sortBy: sort.sortBy,
    order: sort.order,
  });

  // The API ignores `category` on /products/search, so a search term and a
  // category cannot be combined. Search wins; the UI disables the filter.
  if (query.q) return `/products/search?q=${encodeURIComponent(query.q)}&${params}`;
  if (query.category) return `/products/category/${query.category}?${params}`;
  return `/products?${params}`;
}

export function fetchStock(query: StockQuery) {
  return apiFetch<ProductPage>(buildStockPath(query));
}

export function fetchCategories() {
  return apiFetch<Category[]>("/products/categories");
}

export function fetchItem(id: string) {
  return apiFetch<Product>(`/products/${id}`);
}

export function updateStock(id: number, stock: number) {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock }),
  });
}
