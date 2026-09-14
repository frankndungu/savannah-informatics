"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!user) {
      const from = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(`/login?from=${encodeURIComponent(from)}`);
    }
  }, [user, pathname, params, router]);

  if (!user) return null;
  return <>{children}</>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
