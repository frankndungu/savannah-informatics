import { Suspense } from "react";
import { RequireAuth } from "@/components/require-auth";
import { StockListScreen } from "@/components/stock-list-screen";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <RequireAuth>
        <StockListScreen />
      </RequireAuth>
    </Suspense>
  );
}
