import logo from '@/assets/team-shahin-logo.jpg.asset.json';

export function TeamBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logo.url} alt="TEAM SHAHIN logo" className="size-12 shrink-0 rounded-sm object-contain" />
      <div>
        <div className="font-display text-lg font-bold">TEAM SHAHIN</div>
        {!compact && <div className="text-xs text-muted-foreground">Lead management workspace</div>}
      </div>
    </div>
  );
}