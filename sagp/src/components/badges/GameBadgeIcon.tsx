import Image from 'next/image';
import { LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeAsset, type BadgeAssetKey } from '@/lib/badges/badge-assets';

export type GameBadgeIconProps = {
  iconKey: BadgeAssetKey | string | null | undefined;
  name: string;
  size?: 'sm' | 'md' | 'lg' | number;
  earned?: boolean;
  selected?: boolean;
  showRarityRing?: boolean;
  className?: string;
};

const presetSizes = { sm: 40, md: 64, lg: 96 } as const;

const rarityRings: Record<string, string> = {
  common: 'ring-slate-400/70',
  uncommon: 'ring-emerald-400/70',
  rare: 'ring-cyan-400/80',
  epic: 'ring-purple-400/80',
  legendary: 'ring-amber-400/90',
  bronze: 'ring-orange-700/80',
  silver: 'ring-slate-200/80',
  locked: 'ring-slate-600/60',
};

export function GameBadgeIcon({
  iconKey,
  name,
  size = 'md',
  earned = true,
  selected = false,
  showRarityRing = true,
  className,
}: GameBadgeIconProps) {
  const asset = getBadgeAsset(iconKey);
  const pixels = typeof size === 'number' ? size : presetSizes[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 motion-reduce:transition-none',
        earned ? 'drop-shadow-[0_0_10px_rgba(34,211,238,0.22)]' : 'opacity-60 grayscale',
        showRarityRing && ['ring-2 ring-offset-2 ring-offset-slate-950', rarityRings[earned ? asset.rarity : 'locked']],
        selected && 'outline outline-2 outline-offset-4 outline-white',
        className,
      )}
      style={{ width: pixels, height: pixels }}
      aria-label={`${name} badge, ${earned ? 'earned' : 'locked'}`}
      data-badge-state={earned ? 'earned' : 'locked'}
      data-badge-rarity={earned ? asset.rarity : 'locked'}
    >
      <Image
        src={asset.icon}
        alt={asset.alt}
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        className="h-full w-full object-contain"
        unoptimized
      />
      {!earned && (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-slate-500 bg-slate-950 p-1 text-slate-200" aria-hidden="true">
          <LockKeyhole className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}
