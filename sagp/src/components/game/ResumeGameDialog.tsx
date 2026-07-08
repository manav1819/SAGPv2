'use client';

import { RotateCcw, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { SaveEnvelope } from '@/lib/game-save/types';

interface ResumeGameDialogProps<TState> {
  open: boolean;
  gameTitle: string;
  save: SaveEnvelope<TState> | null;
  onContinue: () => void;
  onStartNew: () => void;
}

function formatElapsed(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Generic "Continue / Start New Game" prompt.
 *
 * Shown by useGameSave() whenever a game mounts and a save already exists
 * for the current user. Works for any game — it only reads the
 * denormalised summary fields on the save envelope (level/score/elapsed),
 * never the game-specific `state` payload.
 */
export function ResumeGameDialog<TState>({
  open,
  gameTitle,
  save,
  onContinue,
  onStartNew,
}: ResumeGameDialogProps<TState>) {
  const elapsed = formatElapsed(save?.elapsedSeconds);

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume {gameTitle}?</DialogTitle>
          <DialogDescription>
            You have progress saved from {save ? formatRelativeTime(save.updatedAt) : 'a previous session'}.
          </DialogDescription>
        </DialogHeader>

        {save && (save.level || save.score != null || elapsed) && (
          <div className="grid grid-cols-3 gap-3 rounded-md border border-slate-700 bg-slate-900/60 p-3 text-center text-sm">
            {save.level && (
              <div>
                <p className="text-slate-500 text-xs">Level</p>
                <p className="font-semibold text-slate-200">{save.level}</p>
              </div>
            )}
            {save.score != null && (
              <div>
                <p className="text-slate-500 text-xs">Score</p>
                <p className="font-semibold text-slate-200">{save.score.toLocaleString()}</p>
              </div>
            )}
            {elapsed && (
              <div>
                <p className="text-slate-500 text-xs">Time Played</p>
                <p className="font-semibold text-slate-200">{elapsed}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onStartNew}
            className="sagp-btn sagp-btn-secondary flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Start New Game
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="sagp-btn sagp-btn-primary flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
