'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Trophy, Clock, ShieldCheck, Zap, Award } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScenarioResult } from '@/types/game';
import { RANK_THRESHOLDS } from '@/lib/stores/useGameStore';
import { getScenario } from '@/data/scenarios';

interface Props {
  result: ScenarioResult;
  onPlayAgain?: () => void;
  onLobby?: () => void;
}

function computeRank(xp: number) {
  const sorted = [...RANK_THRESHOLDS].sort((a, b) => b.minXP - a.minXP);
  return sorted.find((r) => xp >= r.minXP)?.rank ?? 'Intern';
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function EvaluationReport({ result, onPlayAgain, onLobby }: Props) {
  const scenario = getScenario(result.scenarioId);
  const rank = computeRank(result.totalXP);

  const outcomeColor = result.terminalOutcome === 'success'
    ? 'var(--sagp-green)'
    : result.terminalOutcome === 'partial'
    ? 'var(--sagp-warning)'
    : 'var(--sagp-danger)';

  const OutcomeIcon = result.terminalOutcome === 'success'
    ? CheckCircle
    : result.terminalOutcome === 'partial'
    ? AlertCircle
    : XCircle;

  const radarData = [
    { subject: 'Verify', value: result.scoreCategories.verification },
    { subject: 'Detect', value: result.scoreCategories.threatDetection },
    { subject: 'Protect', value: result.scoreCategories.informationProtection },
    { subject: 'Investigate', value: result.scoreCategories.investigation },
    { subject: 'Decide', value: result.scoreCategories.decision },
  ];

  const compositeScore = Math.round(
    result.scoreCategories.verification * 0.2 +
    result.scoreCategories.threatDetection * 0.25 +
    result.scoreCategories.informationProtection * 0.3 +
    result.scoreCategories.investigation * 0.1 +
    result.scoreCategories.decision * 0.15
  );

  return (
    <div className="min-h-screen sagp-main">
      <div className="sagp-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sagp-neon-card sagp-hero mb-6"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="sagp-eyebrow mb-2">MISSION DEBRIEF</p>
              <h1 className="sagp-hero-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {scenario?.title ?? result.scenarioId}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <OutcomeIcon size={20} style={{ color: outcomeColor }} />
                <span className="sagp-heading-font font-bold" style={{ color: outcomeColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {result.terminalOutcome === 'success' ? 'MISSION COMPLETE' : result.terminalOutcome === 'partial' ? 'PARTIAL SUCCESS' : 'MISSION FAILED'}
                </span>
                {result.isPerfectClear && (
                  <span className="sagp-badge sagp-badge-green">⭐ PERFECT CLEAR</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="sagp-mono text-xs mb-1" style={{ color: 'var(--sagp-text-muted)' }}>TOTAL XP EARNED</p>
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="sagp-heading-font text-5xl font-black"
                style={{ color: 'var(--sagp-cyan)', textShadow: '0 0 30px rgba(0,245,255,0.5)' }}
              >
                {result.totalXP.toLocaleString()}
              </motion.p>
              <p className="sagp-mono text-sm mt-1" style={{ color: 'var(--sagp-text-muted)' }}>RANK: {rank}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="sagp-grid-4 mb-6">
          {[
            { label: 'Composite Score', value: `${compositeScore}%`, icon: <ShieldCheck size={20} />, color: 'var(--sagp-cyan)' },
            { label: 'Call Duration', value: fmtTime(result.durationSeconds), icon: <Clock size={20} />, color: 'var(--sagp-purple)' },
            { label: 'Techniques Tagged', value: result.techniquesTaged.length, icon: <Zap size={20} />, color: 'var(--sagp-warning)' },
            { label: 'Clues Found', value: result.cluesFound.length, icon: <Award size={20} />, color: 'var(--sagp-green)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="sagp-neon-card"
            >
              <div className="sagp-stat-card-content">
                <div className="sagp-icon-tile" style={{ borderColor: `${stat.color}40`, background: `${stat.color}10`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="sagp-stat-label">{stat.label}</p>
                  <p className="sagp-stat-value">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sagp-grid-2 mb-6">
          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="sagp-neon-card sagp-card-content"
          >
            <p className="sagp-eyebrow mb-4">PERFORMANCE PROFILE</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(0,245,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(207,250,254,0.6)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <Tooltip
                    contentStyle={{ background: '#0f0f2e', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 4, color: '#fff' }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="var(--sagp-cyan)"
                    fill="rgba(0,245,255,0.18)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Event timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="sagp-neon-card"
          >
            <div className="sagp-card-header">
              <p className="sagp-eyebrow">XP TIMELINE</p>
            </div>
            <div className="sagp-card-content overflow-y-auto" style={{ maxHeight: 280 }}>
              <div className="space-y-2">
                {result.xpHistory.slice().reverse().map((evt) => (
                  <div key={evt.id} className="sagp-glass-row flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: 'var(--sagp-text-muted)' }}>{evt.label}</span>
                    <span
                      className="sagp-mono text-xs font-bold shrink-0"
                      style={{ color: evt.delta >= 0 ? 'var(--sagp-green)' : 'var(--sagp-danger)' }}
                    >
                      {evt.delta >= 0 ? '+' : ''}{evt.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Leaks + techniques */}
        <div className="sagp-grid-2 mb-6">
          {result.leaksCommitted.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="sagp-neon-card sagp-error-box"
            >
              <p className="sagp-eyebrow mb-3" style={{ color: 'var(--sagp-danger)' }}>INFORMATION LEAKS</p>
              <div className="space-y-1">
                {result.leaksCommitted.map((l) => (
                  <p key={l} className="text-sm">⚠ {l.replace(/_/g, ' ')}</p>
                ))}
              </div>
            </motion.div>
          )}
          {result.techniquesTaged.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="sagp-neon-card sagp-card-content"
            >
              <p className="sagp-eyebrow mb-3">TECHNIQUES IDENTIFIED</p>
              <div className="flex flex-wrap gap-2">
                {result.techniquesTaged.map((t) => (
                  <span key={t} className="sagp-badge sagp-badge-green">{t.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4"
        >
          {onPlayAgain && (
            <button onClick={onPlayAgain} className="sagp-btn sagp-btn-secondary sagp-btn-lg">
              <Trophy size={18} /> Play Again
            </button>
          )}
          {onLobby && (
            <button onClick={onLobby} className="sagp-btn sagp-btn-primary sagp-btn-lg">
              <ShieldCheck size={18} /> Back to Lobby
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
