"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminSearchInputProps {
  placeholder: string;
  paramName?: string;
}

export function AdminSearchInput({ placeholder, paramName = "q" }: AdminSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get(paramName) ?? "";

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, paramName],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        defaultValue={current}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 h-9 w-full sm:w-72"
        disabled={isPending}
      />
      {current && (
        <button
          onClick={() => update("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
