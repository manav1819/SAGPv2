'use client';

import { Bell, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge-ui';
import { ProgressBar } from '@/components/ui/progress-bar';

interface TopBarProps {
  title: string;
  notificationCount?: number;
  streak?: number;
  currentXP?: number;
  maxXP?: number;
}

export function TopBar({
  title,
  notificationCount = 0,
  streak = 0,
  currentXP = 450,
  maxXP = 1000,
}: TopBarProps) {
  const xpPercentage = (currentXP / maxXP) * 100;

  return (
    <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-700">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left: Title */}
        <h1 className="text-xl font-semibold text-white">{title}</h1>

        {/* Right: Controls */}
        <div className="flex items-center gap-6">
          {/* XP Progress Mini */}
          <div className="hidden sm:flex items-center gap-2 min-w-max">
            <div className="text-right">
              <p className="text-xs text-slate-400">Level Progress</p>
              <p className="text-sm font-medium text-white">
                {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
              </p>
            </div>
            <div className="w-24">
              <ProgressBar
                value={xpPercentage}
                className="h-2 bg-slate-700"
                indicatorClassName="bg-gradient-to-r from-teal-400 to-cyan-400"
              />
            </div>
          </div>

          {/* Streak Counter */}
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
              <Flame size={16} className="text-orange-400 animate-pulse" />
              <span className="text-sm font-semibold text-orange-400">
                {streak}
              </span>
            </div>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="md"
              className="text-slate-300 hover:bg-slate-800 hover:text-white relative"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
