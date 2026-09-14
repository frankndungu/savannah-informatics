"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "./app-header";
import { fetchItem, updateStock, type Product } from "@/lib/stock";

export function ItemDetailScreen({ id }: { id: string }) {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const backHref = params.toString() ? `/?${params}` : "/";

  const item = useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id),
    staleTime: Infinity,
  });

  const [count, setCount] = useState("");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: (stock: number) => updateStock(Number(id), stock),
    onSuccess: (updated: Product) => {
      // The API accepts the PUT but stores nothing, so refetching would show the
      // correction reverting. Write the response into the cache instead.
      queryClient.setQueryData(["item", id], updated);
      setSaved(true);
    },
  });

  const current = item.data?.stock;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href={backHref} className="text-sm text-accent hover:underline">
          Back to stock list
        </Link>

        {item.isPending && (
          <p className="mt-6 text-sm text-muted" role="status">
            Loading item
          </p>
        )}

        {item.isError && (
          <div className="mt-6 bg-surface border border-line rounded-xl p-6" role="alert">
            <h2 className="font-semibold">Couldn&apos;t load this item</h2>
            <p className="text-sm text-muted mt-1">
              It may not exist, or the server didn&apos;t respond.
            </p>
            <button
              onClick={() => item.refetch()}
              className="mt-4 px-4 py-2 text-sm text-white bg-accent rounded-lg"
            >
              Try again
            </button>
          </div>
        )}

        {item.data && (
          <div className="mt-4 bg-surface border border-line rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{item.data.title}</h2>
              <p className="text-sm text-muted mt-1">
                {item.data.brand ? `${item.data.brand}, ` : ""}
                {item.data.category}
              </p>
              <p className="text-sm mt-3 max-w-prose">{item.data.description}</p>
            </div>

            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted">Current stock</p>
                <p className="text-3xl font-semibold tabular-nums">{current}</p>
              </div>
              {item.data.sku && (
                <div>
                  <p className="text-xs text-muted">SKU</p>
                  <p className="font-medium">{item.data.sku}</p>
                </div>
              )}
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="font-semibold mb-3">Correct stock count</h3>

              {save.isError && (
                <div
                  role="alert"
                  className="mb-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2"
                >
                  Correction not saved. The stock count is still {current}. Your entry is
                  kept below.
                </div>
              )}

              {saved && !save.isError && (
                <p role="status" className="mb-3 text-sm text-accent">
                  Stock updated to {current}.
                </p>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSaved(false);
                  save.mutate(Number(count));
                }}
                className="flex flex-col sm:flex-row gap-3 sm:items-end"
              >
                <div className="flex-1">
                  <label htmlFor="count" className="block text-sm font-medium mb-1">
                    New count
                  </label>
                  <input
                    id="count"
                    type="number"
                    min="0"
                    required
                    value={count}
                    disabled={save.isPending}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-surface disabled:bg-paper"
                  />
                  <p className="text-xs text-muted mt-1">
                    Enter the count from your physical check.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="px-5 py-2 text-sm text-white bg-accent rounded-lg disabled:opacity-60"
                >
                  {save.isPending ? "Saving" : "Save correction"}
                </button>
              </form>

              <p className="text-xs text-muted mt-3 bg-paper border border-line rounded px-3 py-2">
                Corrections apply for this session only. The stock API accepts the write
                but does not store it, so a reload restores the original count.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
