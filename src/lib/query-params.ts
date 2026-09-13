export type StockQuery = {
  q: string;
  category: string;
  sort: string;
  page: number;
};

export const PAGE_SIZE = 10;

export function parseStockQuery(params: URLSearchParams): StockQuery {
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    sort: params.get("sort") ?? "title-asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function toSkip(page: number): number {
  return (page - 1) * PAGE_SIZE;
}
