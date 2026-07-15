import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameBadgeIcon } from '@/components/badges/GameBadgeIcon';
import { BADGE_ASSETS, getBadgeAsset, getBadgeAssetByName } from '@/lib/badges/badge-assets';

test('known badge keys resolve to their professional asset', () => {
  const badge = getBadgeAsset('perfect-score');
  assert.equal(badge.name, 'Perfect Score');
  assert.equal(badge.rarity, 'legendary');
  assert.equal(badge.icon, '/assets/badges/svg/perfect-score.svg');
});

test('missing badge keys resolve to the safe default', () => {
  assert.equal(getBadgeAsset(null).id, 'badge-default');
  assert.equal(getBadgeAsset('not-a-real-badge').id, 'badge-default');
});

test('legacy badge rows resolve stable assets by name', () => {
  assert.equal(getBadgeAssetByName('Perfect Score').id, 'perfect-score');
  assert.equal(getBadgeAssetByName('  first steps ').id, 'first-steps');
  assert.equal(getBadgeAssetByName('Unknown legacy badge').id, 'badge-default');
});

test('every registered asset exists with its exact path', () => {
  for (const badge of Object.values(BADGE_ASSETS)) {
    for (const path of [badge.icon, badge.png128, badge.png256]) {
      assert.ok(existsSync(join(process.cwd(), 'public', path.replace(/^\/assets\//, 'assets/'))), path);
    }
  }
});

test('badge icon exposes earned and locked states accessibly', () => {
  const earned = renderToStaticMarkup(
    <GameBadgeIcon iconKey="first-steps" name="First Steps" earned />,
  );
  const locked = renderToStaticMarkup(
    <GameBadgeIcon iconKey="first-steps" name="First Steps" earned={false} />,
  );

  assert.match(earned, /aria-label="First Steps badge, earned"/);
  assert.match(earned, /data-badge-state="earned"/);
  assert.match(locked, /aria-label="First Steps badge, locked"/);
  assert.match(locked, /data-badge-state="locked"/);
});
