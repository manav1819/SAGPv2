export const BADGE_ASSET_KEYS = [
  'cyberguard-complete',
  'speed-demon',
  'vishing-simulator-complete',
  'phishing-simulator-complete',
  'threat-hunt-easy-cleared',
  'knowledge-seeker',
  'first-steps',
  'threat-hunt-medium-cleared',
  'month-master',
  'phishing-expert',
  'week-warrior',
  'perfect-score',
  'phish-hunter',
  'security-champion',
  'human-firewall-complete',
  'cyberforge-complete',
  'threat-hunt-legendary-cleared',
  'badge-locked',
  'badge-default',
] as const;

export type BadgeAssetKey = (typeof BADGE_ASSET_KEYS)[number];

export type BadgeRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'bronze'
  | 'silver'
  | 'locked';

export interface BadgeAsset {
  id: BadgeAssetKey;
  name: string;
  badgeType: string;
  rarity: BadgeRarity;
  icon: string;
  png128: string;
  png256: string;
  alt: string;
}

function asset(
  id: BadgeAssetKey,
  name: string,
  badgeType: string,
  rarity: BadgeRarity,
  alt: string,
): BadgeAsset {
  return {
    id,
    name,
    badgeType,
    rarity,
    icon: `/assets/badges/svg/${id}.svg`,
    png128: `/assets/badges/png/128/${id}.png`,
    png256: `/assets/badges/png/256/${id}.png`,
    alt,
  };
}

export const BADGE_ASSETS: Record<BadgeAssetKey, BadgeAsset> = {
  'cyberguard-complete': asset('cyberguard-complete', 'CyberGuard: Complete', 'completion', 'epic', 'Shield and lock badge'),
  'speed-demon': asset('speed-demon', 'Speed Demon', 'speed_run', 'rare', 'Lightning bolt with speed wings badge'),
  'vishing-simulator-complete': asset('vishing-simulator-complete', 'Vishing Simulator: Complete', 'completion', 'uncommon', 'Phone with voice waves badge'),
  'phishing-simulator-complete': asset('phishing-simulator-complete', 'Phishing Simulator: Complete', 'completion', 'uncommon', 'Email envelope and phishing hook badge'),
  'threat-hunt-easy-cleared': asset('threat-hunt-easy-cleared', 'Threat Hunt: Easy Cleared', 'completion', 'bronze', 'Bronze threat radar badge'),
  'knowledge-seeker': asset('knowledge-seeker', 'Knowledge Seeker', 'achievement', 'rare', 'Open book with spark badge'),
  'first-steps': asset('first-steps', 'First Steps', 'achievement', 'common', 'First footsteps badge'),
  'threat-hunt-medium-cleared': asset('threat-hunt-medium-cleared', 'Threat Hunt: Medium Cleared', 'completion', 'silver', 'Silver threat radar badge'),
  'month-master': asset('month-master', 'Month Master', 'streak', 'epic', 'Thirty day calendar streak badge'),
  'phishing-expert': asset('phishing-expert', 'Phishing Expert', 'completion', 'epic', 'Shield and phishing hook badge'),
  'week-warrior': asset('week-warrior', 'Week Warrior', 'streak', 'rare', 'Seven day flame streak badge'),
  'perfect-score': asset('perfect-score', 'Perfect Score', 'score', 'legendary', 'One hundred perfect score badge'),
  'phish-hunter': asset('phish-hunter', 'Phish Hunter', 'phish_hunter', 'rare', 'Target and phishing hook badge'),
  'security-champion': asset('security-champion', 'Security Champion', 'special', 'legendary', 'Security trophy champion badge'),
  'human-firewall-complete': asset('human-firewall-complete', 'Human Firewall: Complete', 'completion', 'epic', 'Brick firewall and shield badge'),
  'cyberforge-complete': asset('cyberforge-complete', 'CyberForge: Complete', 'completion', 'epic', 'Cyber anvil and circuit spark badge'),
  'threat-hunt-legendary-cleared': asset('threat-hunt-legendary-cleared', 'Threat Hunt: Legendary Cleared', 'completion', 'legendary', 'Golden crown and threat target badge'),
  'badge-locked': asset('badge-locked', 'Locked Badge', 'system', 'locked', 'Locked badge placeholder'),
  'badge-default': asset('badge-default', 'Default Badge', 'system', 'common', 'Default achievement badge'),
};

export function isBadgeAssetKey(value: unknown): value is BadgeAssetKey {
  return typeof value === 'string' && value in BADGE_ASSETS;
}

export function getBadgeAsset(iconKey: string | null | undefined): BadgeAsset {
  return isBadgeAssetKey(iconKey) ? BADGE_ASSETS[iconKey] : BADGE_ASSETS['badge-default'];
}

const BADGE_ASSET_BY_NAME = new Map(
  Object.values(BADGE_ASSETS).map((badge) => [badge.name.toLocaleLowerCase(), badge]),
);

export function getBadgeAssetByName(name: string | null | undefined): BadgeAsset {
  if (!name) return BADGE_ASSETS['badge-default'];
  return BADGE_ASSET_BY_NAME.get(name.trim().toLocaleLowerCase()) ?? BADGE_ASSETS['badge-default'];
}
