import { ShieldCheck } from "lucide-react";

export function TeamBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="size-6" strokeWidth={1.8} />
      </div>
      <div>
        <div className="font-display text-lg font-bold">TEAM SHAHIN</div>
        {!compact && <div className="text-xs text-muted-foreground">Lead management workspace</div>}
      </div>
    </div>
  );
}