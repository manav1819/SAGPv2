'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useXPTickers, useIsScreenShaking } from '@/lib/stores/useGameStore';

export function XPTickerLayer() {
  const tickers = useXPTickers();
  const shaking = useIsScreenShaking();

  return (
    <>
      {/* Screen shake wrapper — applied to the viewport overlay */}
      {shaking && (
        <motion.div
          className="fixed inset-0 z-[999] pointer-events-none"
          animate={{ x: [0, -8, 8, -6, 6, -4, 4, 0], y: [0, 4, -4, 3, -3, 2, -2, 0] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}

      {/* Floating XP labels */}
      <div className="fixed inset-0 z-[998] pointer-events-none overflow-hidden">
        <AnimatePresence>
          {tickers.map((ticker) => (
            <motion.div
              key={ticker.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute sagp-heading-font font-black text-lg"
              style={{
                left: `${ticker.x}%`,
                top: `${ticker.y}%`,
                color: ticker.delta >= 0 ? 'var(--sagp-green)' : 'var(--sagp-danger)',
                textShadow: ticker.delta >= 0
                  ? '0 0 20px rgba(57,255,20,0.8)'
                  : '0 0 20px rgba(255,59,129,0.8)',
              }}
            >
              {ticker.delta >= 0 ? '+' : ''}{ticker.delta} XP
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
