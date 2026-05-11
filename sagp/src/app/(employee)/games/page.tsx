'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge-ui';
import { Gamepad2, Shield, Clock, Award } from 'lucide-react';

const GAMES = [
  {
    id:          'phishing',
    title:       'Phishing Simulator',
    description: 'Can you spot the phishing emails? Test your instincts against 10 real-world email scenarios. Each correct identification keeps you in the game — one wrong move costs a life.',
    category:    'Security Awareness',
    difficulty:  'Medium',
    estimatedMins: 5,
    points:      500,
    icon:        '🎣',
    href:        '/game/phishing',
    available:   true,
  },
  {
    id:          'phishing-rpg',
    title:       'Phishing RPG',
    description: 'Play a role-based phishing detection adventure. Make choices, protect your team, and learn to spot spoofed messages in action.',
    category:    'Role Playing',
    difficulty:  'Medium',
    estimatedMins: 7,
    points:      650,
    icon:        '🛡️',
    href:        '/phishing-rpg',
    available:   true,
  },
  {
    id:          '3d-escape',
    title:       '3D Cyber Escape',
    description: 'Navigate a 3D environment, solve security challenges, and escape threats in a fully immersive browser-based training game.',
    category:    'Immersive Simulation',
    difficulty:  'Hard',
    estimatedMins: 8,
    points:      750,
    icon:        '🕹️',
    href:        '/3dGame',
    available:   true,
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Games</h1>
        <p className="mt-1 text-slate-400">
          Interactive security training games — test your skills and earn points
        </p>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(game => (
          <Card key={game.id} className="border-slate-700 bg-slate-800 flex flex-col">
            <div className="p-6 flex-1">
              {/* Icon + badges row */}
              <div className="mb-4 flex items-start justify-between">
                <span className="text-5xl">{game.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="border-0 bg-teal-900 text-teal-200">{game.difficulty}</Badge>
                  <Badge className="border-0 bg-slate-700 text-slate-300">{game.category}</Badge>
                </div>
              </div>

              {/* Title & description */}
              <h2 className="mb-2 text-lg font-bold text-white">{game.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{game.description}</p>

              {/* Meta row */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{game.estimatedMins} min
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {game.points} pts
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  3 lives
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-slate-700 p-4">
              {game.available ? (
                <Link href={game.href} className="block">
                  <Button variant="primary" className="w-full gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Play Now
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full cursor-not-allowed opacity-50">
                  Coming Soon
                </Button>
              )}
            </div>
          </Card>
        ))}

      </div>
    </div>
  );
}
