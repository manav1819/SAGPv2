'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Clock, Star, ChevronRight } from 'lucide-react';
import { GAMES, DIFFICULTY_LABELS, gameHref } from '@/config/games.config';

const DIFFICULTY_COLOURS: Record<1 | 2 | 3, string> = {
  1: 'sagp-badge sagp-badge-green',
  2: 'sagp-badge sagp-badge-warning',
  3: 'sagp-badge sagp-badge-danger',
};

export default function GamesPage() {
  const activeGames = GAMES.filter((g) => g.active);

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      {activeGames.length === 0 ? (
        <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Gamepad2 className="h-12 w-12 sagp-text-muted opacity-30" />
          <p className="sagp-heading-3 sagp-text-muted">No games available</p>
          <p className="sagp-text-muted text-sm max-w-xs">
            Gamified security challenges will appear here once games are published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {activeGames.map((game) => (
            <Link
              key={game.id}
              href={gameHref(game)}
                className="sagp-card group flex flex-col overflow-hidden transition-all hover:ring-2 hover:ring-(--sagp-primary) focus-visible:ring-2 focus-visible:ring-(--sagp-primary) outline-none"
            >
              {/* Thumbnail */}
              <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                {game.thumbnail ? (
                  <Image
                    src={game.thumbnail}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl select-none">
                    {game.icon ?? '\u{1F3AE}'}
                  </div>
                )}
                {/* Overlay play button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full bg-(--sagp-primary) px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                    Play <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="sagp-heading-3 leading-snug">
                    {game.icon && (
                      <span className="mr-1.5 select-none">{game.icon}</span>
                    )}
                    {game.title}
                  </h2>
                  <span className={DIFFICULTY_COLOURS[game.difficulty]}>
                    {DIFFICULTY_LABELS[game.difficulty]}
                  </span>
                </div>

                <p className="sagp-text-muted text-sm line-clamp-3 flex-1">
                  {game.description}
                </p>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1 text-xs sagp-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {game.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {game.maxScore.toLocaleString()} pts
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px]">
                    {game.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
