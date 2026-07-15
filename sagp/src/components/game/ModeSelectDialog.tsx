'use client';

import { Shield, Flame } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export type GameDifficultyMode = 'basic' | 'challenge';

interface ModeSelectDialogProps {
  open: boolean;
  gameTitle: string;
  onSelect: (mode: GameDifficultyMode) => void;
}

/**
 * Pre-game "Basic / Challenge" mode picker.
 *
 * Shown before the game iframe ever mounts. The dialog has no close/dismiss
 * path other than picking a mode — the underlying <DialogContent> renders a
 * close (X) button by default, so this component simply never wires an
 * onOpenChange handler that could set `open` to false without a selection.
 */
export function ModeSelectDialog({ open, gameTitle, onSelect }: ModeSelectDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your mode</DialogTitle>
          <DialogDescription>
            How do you want to play {gameTitle}?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelect('basic')}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-cyan-500 hover:bg-slate-900"
          >
            <Shield className="h-7 w-7 text-cyan-400" />
            <span className="font-semibold text-slate-100">Basic Mode</span>
            <span className="text-xs text-slate-400">
              Learn at your own pace. No penalties for wrong tries.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect('challenge')}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-pink-500 hover:bg-slate-900"
          >
            <Flame className="h-7 w-7 text-pink-400" />
            <span className="font-semibold text-slate-100">Challenge Mode</span>
            <span className="text-xs text-slate-400">
              Wrong combinations cost you XP. Test what you really know.
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
