"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
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
