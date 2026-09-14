"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { parseStockQuery, type StockQuery } from "@/lib/query-params";

export function useStockQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = parseStockQuery(new URLSearchParams(params.toString()));

  const update = useCallback(
    (patch: Partial<StockQuery>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === "" || value === undefined) next.delete(key);
        else next.set(key, String(value));
      }

      // Any change other than the page itself resets to page 1, so changing a
      // filter can never strand the user on a page that no longer exists.
      if (!("page" in patch)) next.delete("page");

      router.replace(next.toString() ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [params, router, pathname],
  );

  return { query, update };
}
