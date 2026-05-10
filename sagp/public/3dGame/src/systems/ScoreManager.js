export class ScoreManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.securityScore = 100;
    this.riskScore = 0;
    this.completed = [];
  }

  applyOutcome(scenarioId, outcome, delta) {
    this.securityScore = Math.max(0, Math.min(200, this.securityScore + delta.security));
    this.riskScore     = Math.max(0, Math.min(100, this.riskScore + delta.risk));
    this.completed.push({ scenarioId, outcome });
  }

  getRiskCategory() {
    if (this.riskScore <= 25) return { label: 'LOW RISK', color: '#44ff88', emoji: '🛡️' };
    if (this.riskScore <= 60) return { label: 'MEDIUM RISK', color: '#ffaa00', emoji: '⚠️' };
    return { label: 'HIGH RISK', color: '#ff4444', emoji: '🚨' };
  }

  isChampion() {
    return this.securityScore >= 130;
  }

  allDone(total) {
    return this.completed.length >= total;
  }
}
