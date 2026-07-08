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

const LEVEL_SECTIONS = [
  {
    key: 'easy',
    title: 'Easy',
    description: 'Warm-up simulations that teach the basics of spotting suspicious behavior.',
    difficulty: 1 as const,
  },
  {
    key: 'medium',
    title: 'Medium',
    description: 'Balanced challenges that test judgment and awareness in realistic situations.',
    difficulty: 2 as const,
  },
  {
    key: 'hard',
    title: 'Hard',
    description: 'Advanced experiences built for high-pressure decision-making and deeper threat detection.',
    difficulty: 3 as const,
  },
];

export default function GamesPage() {
  const activeGames = GAMES.filter((game) => game.active);
  const groupedGames = LEVEL_SECTIONS.map((section) => ({
    ...section,
    games: activeGames
      .filter((game) => game.difficulty === section.difficulty)
      .sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((section) => section.games.length > 0);

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      {groupedGames.length === 0 ? (
        <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Gamepad2 className="h-12 w-12 sagp-text-muted opacity-30" />
          <p className="sagp-heading-3 sagp-text-muted">No games available</p>
          <p className="sagp-text-muted text-sm max-w-xs">
            Gamified security challenges will appear here once games are published.
          </p>
        </div>
      ) : (
        groupedGames.map((section) => (
          <section key={section.key} className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="sagp-heading-3">{section.title}</h2>
                  <span className={DIFFICULTY_COLOURS[section.difficulty]}>
                    {DIFFICULTY_LABELS[section.difficulty]}
                  </span>
                </div>
                <p className="sagp-text-muted text-sm">{section.description}</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
                {section.games.length} game{section.games.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {section.games.map((game) => (
                <Link
                  key={game.id}
                  href={gameHref(game)}
                  className="sagp-card group flex flex-col overflow-hidden transition-all hover:ring-2 hover:ring-(--sagp-primary) focus-visible:ring-2 focus-visible:ring-(--sagp-primary) outline-none"
                >
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
                        {game.icon ?? '🎮'}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-(--sagp-primary) px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                        Play <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="sagp-heading-3 leading-snug">
                        {game.icon && (
                          <span className="mr-1.5 select-none">{game.icon}</span>
                        )}
                        {game.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={DIFFICULTY_COLOURS[game.difficulty]}>
                        Level {DIFFICULTY_LABELS[game.difficulty]}
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                        {game.category}
                      </span>
                    </div>

                    <p className="sagp-text-muted text-sm line-clamp-3 flex-1">
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs sagp-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {game.estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {game.maxScore.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
