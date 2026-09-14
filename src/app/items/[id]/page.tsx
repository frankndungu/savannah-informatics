import { Suspense } from "react";
import { RequireAuth } from "@/components/require-auth";
import { ItemDetailScreen } from "@/components/item-detail-screen";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <RequireAuth>
        <ItemDetailScreen id={id} />
      </RequireAuth>
    </Suspense>
  );
}
