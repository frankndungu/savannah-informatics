"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppHeader } from "./app-header";
import { useStockQuery } from "@/hooks/use-stock-query";
import { useDebounced } from "@/hooks/use-debounce";
import { fetchStock, fetchCategories } from "@/lib/stock";
import { PAGE_SIZE } from "@/lib/query-params";

const SORT_OPTIONS = [
  { value: "title-asc", label: "Name, A to Z" },
  { value: "title-desc", label: "Name, Z to A" },
  { value: "stock-asc", label: "Stock, low to high" },
  { value: "stock-desc", label: "Stock, high to low" },
];

export function StockListScreen() {
  const { query, update } = useStockQuery();
  const [searchInput, setSearchInput] = useState(query.q);
  const debouncedSearch = useDebounced(searchInput, 400);

  // Only the settled value reaches the URL. Writing every keystroke would fill
  // the history with every prefix the user typed.
  useEffect(() => {
    if (debouncedSearch !== query.q) update({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const stock = useQuery({
    queryKey: ["stock", query.q, query.category, query.sort, query.page],
    queryFn: () => fetchStock(query),
    placeholderData: keepPreviousData,
  });

  const total = stock.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(query.page * PAGE_SIZE, total);
  const listQs = new URLSearchParams({
    ...(query.q && { q: query.q }),
    ...(query.category && { category: query.category }),
    sort: query.sort,
    page: String(query.page),
  }).toString();

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-1">
              Search
            </label>
            <input
              id="search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search stock"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              id="category"
              value={query.category}
              disabled={Boolean(query.q)}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">All categories</option>
              {categories.data?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {query.q && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1.5">
                The stock API cannot filter a search by category. Clear the search to
                filter.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium mb-1">
              Sort by
            </label>
            <select
              id="sort"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <p
            className="text-xs text-slate-600 pt-3 border-t border-slate-200"
            aria-live="polite"
          >
            {stock.isError
              ? "Could not load stock"
              : total === 0 && !stock.isPending
                ? "No items"
                : `Showing ${first} to ${last} of ${total} items`}
          </p>
        </aside>

        <main>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {stock.isFetching && !stock.isPending && (
              <div className="h-0.5 bg-slate-900 animate-pulse" aria-hidden="true" />
            )}

            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-100">
              <div className="col-span-6">Item</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-3">Stock</div>
            </div>

            {stock.isPending && (
              <div
                className="px-5 py-16 text-center text-sm text-slate-500"
                role="status"
              >
                Loading stock
              </div>
            )}

            {stock.isError && (
              <div className="px-5 py-16 text-center" role="alert">
                <h3 className="font-semibold">Couldn&apos;t load stock</h3>
                <p className="text-sm text-slate-600 mt-1">
                  The server didn&apos;t respond.
                </p>
                <button
                  onClick={() => stock.refetch()}
                  className="mt-5 px-4 py-2 text-sm text-white bg-slate-900 rounded-lg"
                >
                  Try again
                </button>
              </div>
            )}

            {!stock.isPending && !stock.isError && total === 0 && (
              <div className="px-5 py-16 text-center">
                <h3 className="font-semibold">No items match</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {query.q
                    ? `Nothing in stock matches "${query.q}".`
                    : "This category has no items."}
                </p>
                <button
                  onClick={() => {
                    setSearchInput("");
                    update({ q: "", category: "" });
                  }}
                  className="mt-5 px-4 py-2 text-sm text-white bg-slate-900 rounded-lg"
                >
                  Clear filters
                </button>
              </div>
            )}

            {!stock.isError && total > 0 && (
              <ul
                className={`divide-y divide-slate-100 ${stock.isFetching ? "opacity-50" : ""}`}
                aria-busy={stock.isFetching}
              >
                {stock.data?.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/items/${p.id}?${listQs}`}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 px-5 py-4 sm:items-center hover:bg-slate-50"
                    >
                      <div className="col-span-6 min-w-0">
                        <p className="font-medium truncate">{p.title}</p>
                        {p.brand && (
                          <p className="text-xs text-slate-500 truncate">{p.brand}</p>
                        )}
                      </div>
                      <div className="col-span-3 text-sm text-slate-600">
                        {p.category}
                      </div>
                      <div className="col-span-3 text-sm tabular-nums">{p.stock}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {total > 0 && (
              <nav
                aria-label="Pagination"
                className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3"
              >
                <button
                  onClick={() => update({ page: query.page - 1 })}
                  disabled={query.page <= 1}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-md disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {query.page} of {lastPage}
                </span>
                <button
                  onClick={() => update({ page: query.page + 1 })}
                  disabled={query.page >= lastPage}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-md disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
