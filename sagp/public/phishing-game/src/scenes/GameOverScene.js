// ============================================================
//  src/scenes/GameOverScene.js  –  Results / Report Screen
//  Security Awareness Training Game  |  Phaser 3
//
//  Displays:
//    - Win / Lose banner
//    - Score, Accuracy, Avg Response Time, Lives remaining
//    - Per-email breakdown table
//    - Download CSV button (for SAGP data collection)
//    - Play Again button
// ============================================================

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  // ----------------------------------------------------------
  //  INIT – receives data from InboxScene
  // ----------------------------------------------------------
  init(data) {
    this.sessionData = data.sessionData || {};
    this.won         = data.won         || false;
    this.playerName  = data.playerName  || 'Agent';
  }

  // ----------------------------------------------------------
  //  CREATE
  // ----------------------------------------------------------
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── SAGP Integration Bridge ─────────────────────────────────────────
    // Fire immediately when GameOverScene loads so the parent Next.js app
    // receives the completed session result.
    if (window.parent !== window && !window.__sagpPhishingResultSent) {
      window.__sagpPhishingResultSent = true;
      window.parent.postMessage({
        type:     'GAME_COMPLETE',
        score:    this.sessionData.finalScore ?? 0,
        passed:   this.won,
        maxScore: 500,
        accuracy: this.sessionData.accuracy ?? 0,
        avgResponseTimeMs: this.sessionData.avgResponseTimeMs ?? 0,
      }, window.location.origin || '*');
    }
    // ────────────────────────────────────────────────────────────────────

    this._buildBackground(W, H);
    this.scrollSpeeds = { far: 0.04, mid: 0.10, fg: 0.22 };

    this.cameras.main.fadeIn(700, 0, 0, 0);

    // Play result music
    if (this.won) {
      this.sound.add('winMusic', { loop: false, volume: 0.5 }).play();
    }

    // Character in bottom-right corner
    this.character = this.add.sprite(W - 90, H - 28, 'character')
      .setScale(2.2)
      .setOrigin(0.5, 1)
      .setDepth(12);

    // Single animation-complete handler for all states
    this.character.on('animationcomplete', (anim) => {
      if (anim.key === 'spell' || anim.key === 'cast') {
        this.character.play('idle');
      } else if (anim.key === 'death') {
        this.character.stop(); // hold last frame of death
      }
    });

    if (this.won) {
      this.character.play('spell');
    } else {
      this.character.play('death');
    }

    // Advisor NPC (bottom-left)
    const advisorIdx = Phaser.Math.Between(1, 4);
    const emotion    = this.won ? 'happy' : 'sad';
    this.add.image(70, H - 55, `sprite${advisorIdx}${emotion}`)
      .setScale(0.75)
      .setDepth(14);

    // Build the UI (via DOM for scroll + rich formatting)
    this._buildReportDOM(W, H);

    // Update loop for parallax
    this._startParallax();
  }

  // ----------------------------------------------------------
  //  UPDATE
  // ----------------------------------------------------------
  update() {
    if (!this.cloudsFar) return;
    this.cloudsFar.tilePositionX -= this.scrollSpeeds.far;
    this.cloudsMid.tilePositionX -= this.scrollSpeeds.mid;
    this.cloudsFg.tilePositionX  -= this.scrollSpeeds.fg;
  }

  // ----------------------------------------------------------
  //  REPORT DOM PANEL
  // ----------------------------------------------------------
  _buildReportDOM(W, H) {
    const sd  = this.sessionData;
    const won = this.won;

    const accuracy   = Math.round((sd.accuracy || 0) * 100);
    const avgTimeSec = ((sd.avgResponseTimeMs || 0) / 1000).toFixed(1);
    const correct    = (sd.emails || []).filter(e => e.correct).length;
    const total      = (sd.emails || []).length;
    const maxScore   = total * 175 + Math.max(0, total - 2) * 25;

    // Per-email rows HTML
    const rowsHTML = (sd.emails || []).map((e, i) => {
      const icon    = e.correct ? '✓' : '✗';
      const rowBg   = e.correct ? '#0d2a14' : '#2a0d0d';
      const iconClr = e.correct ? '#22cc66' : '#cc3333';
      const timeSec = (e.timeTakenMs / 1000).toFixed(1);
      const subj    = e.subject.length > 38 ? e.subject.substring(0, 37) + '…' : e.subject;
      const speed   = e.correct
        ? (e.timeTakenMs < 5000  ? '⚡' :
           e.timeTakenMs < 10000 ? '🚀' :
           e.timeTakenMs < 20000 ? '👍' : '')
        : '';

      return `
        <tr style="background:${rowBg}; border-bottom:1px solid #1a3355;">
          <td style="padding:5px 8px; color:${iconClr}; font-weight:bold; text-align:center; width:28px;">${icon}</td>
          <td style="padding:5px 8px; color:#aabbcc; font-size:11px; width:22px; text-align:center;">${i + 1}</td>
          <td style="padding:5px 8px; color:#c8dde8; font-size:11px; max-width:200px; overflow:hidden; white-space:nowrap;">${subj}</td>
          <td style="padding:5px 8px; color:#7aabcc; font-size:10px; text-align:center; width:85px;">${e.trueType}</td>
          <td style="padding:5px 8px; color:${e.correct ? '#7acc99' : '#cc7a7a'}; font-size:10px; text-align:center; width:85px;">${e.userGuess}</td>
          <td style="padding:5px 8px; color:#8899aa; font-size:10px; text-align:right; width:55px;">${timeSec}s ${speed}</td>
        </tr>
      `;
    }).join('');

    const heartsHTML = [0,1,2].map(i => i < (sd.livesRemaining || 0) ? '❤️' : '🖤').join(' ');

    const bannerColor = won ? '#22cc66' : '#cc3333';
    const bannerBg    = won ? '#0a2e14' : '#2e0a0a';
    const bannerText  = won
      ? '🏆  MISSION COMPLETE!'
      : '💀  MISSION FAILED';
    const bannerSub   = won
      ? 'You identified all phishing threats. Excellent work!'
      : 'You fell for too many phishing emails. Stay vigilant!';

    const panelHTML = `
      <div id="go-panel" style="
        width: 580px;
        max-height: 440px;
        overflow-y: auto;
        background: rgba(6, 14, 28, 0.97);
        border: 1.5px solid #2a5070;
        border-radius: 14px;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #c8dde8;
        box-shadow: 0 0 60px rgba(0,0,0,0.8);
        scrollbar-width: thin;
        scrollbar-color: #2a5070 transparent;
      ">

        <!-- Banner -->
        <div style="
          background: ${bannerBg};
          border-bottom: 1.5px solid ${bannerColor}44;
          padding: 18px 24px 14px;
          border-radius: 12px 12px 0 0;
          text-align: center;
        ">
          <div style="font-size:22px; font-weight:bold; color:${bannerColor}; letter-spacing:1px;">${bannerText}</div>
          <div style="font-size:11px; color:#8899aa; margin-top:5px;">${bannerSub}</div>
        </div>

        <!-- Stats row -->
        <div style="display:flex; gap:0; border-bottom:1px solid #1a3355;">
          ${this._statCell('🎯 Score',   sd.finalScore ? sd.finalScore.toLocaleString() : '0', '#e8f4ff')}
          ${this._statCell('📊 Accuracy', accuracy + '%',                                      accuracy >= 70 ? '#22cc66' : '#cc5533')}
          ${this._statCell('⏱ Avg Time', avgTimeSec + 's',                                    '#aaddff')}
          ${this._statCell('❤️ Lives',    heartsHTML,                                           '#ffffff')}
        </div>

        <!-- Score breakdown -->
        <div style="padding:10px 24px 6px; font-size:11px; color:#5577aa; display:flex; justify-content:space-between;">
          <span>✓ ${correct} / ${total} correct  &nbsp;·&nbsp;  ${total - correct} wrong</span>
          <span>Max possible: ${maxScore.toLocaleString()} pts</span>
        </div>

        <!-- Email results table -->
        <table style="width:100%; border-collapse:collapse; font-family:monospace; margin-bottom:2px;">
          <thead>
            <tr style="background:#0d1e30; border-bottom:1.5px solid #2a5070;">
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:center; width:28px;"></th>
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:center; width:22px;">#</th>
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:left;">Subject</th>
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:center; width:85px;">True Type</th>
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:center; width:85px;">Your Answer</th>
              <th style="padding:5px 8px; color:#4a7a9a; font-size:10px; text-align:right; width:55px;">Time</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>

        <!-- Buttons -->
        <div style="padding:14px 24px 18px; display:flex; gap:12px;">
          <button id="playAgainBtn" style="
            flex:1; padding:12px;
            background: linear-gradient(135deg, #0d3a5e, #1a5276);
            color:#ffffff; border:1.5px solid #4a9fd4; border-radius:8px;
            font-size:14px; font-family:'Segoe UI',Arial,sans-serif;
            font-weight:bold; cursor:pointer; letter-spacing:0.5px;
          ">▶  Play Again</button>
          <button id="dashboardBtn" style="
            flex:1; padding:12px;
            background: linear-gradient(135deg, #0d2e3a, #0d3a5e);
            color:#00d4ff; border:1.5px solid #00d4ff; border-radius:8px;
            font-size:14px; font-family:'Segoe UI',Arial,sans-serif;
            font-weight:bold; cursor:pointer; letter-spacing:0.5px;
          ">🏠  Dashboard</button>
          <button id="downloadBtn" style="
            flex:1; padding:12px;
            background: linear-gradient(135deg, #1a3d14, #0d2a0a);
            color:#ffffff; border:1.5px solid #22cc66; border-radius:8px;
            font-size:14px; font-family:'Segoe UI',Arial,sans-serif;
            font-weight:bold; cursor:pointer; letter-spacing:0.5px;
          ">📥  CSV</button>
        </div>

        <!-- Footer note -->
        <div style="
          padding: 0 24px 14px;
          font-size:10px; color:#334455; text-align:center; line-height:1.5;
        ">
          Session ID: ${sd.sessionId || '—'}  &nbsp;·&nbsp;  ${new Date(sd.sessionDate || Date.now()).toLocaleString()}<br>
          Results submitted to SAGP dashboard.
        </div>
      </div>
    `;

    // Mount DOM element centred (slightly left to leave room for character)
    this.domPanel = this.add.dom(W / 2 - 30, H / 2).createFromHTML(panelHTML);
    this.domPanel.setDepth(30);
    this.domPanel.setAlpha(0);

    this.tweens.add({ targets: this.domPanel, alpha: 1, duration: 600, delay: 300 });

    // Button listeners
    this.domPanel.addListener('click');
    this.domPanel.on('click', (e) => {
      if (e.target.id === 'playAgainBtn') {
        this._playAgain();
      } else if (e.target.id === 'dashboardBtn') {
        this._goToDashboard();
      } else if (e.target.id === 'downloadBtn') {
        this._downloadCSV();
      }
    });
  }

  // ----------------------------------------------------------
  //  Stat cell helper
  // ----------------------------------------------------------
  _statCell(label, value, valueColor) {
    return `
      <div style="flex:1; text-align:center; padding:12px 8px; border-right:1px solid #1a3355;">
        <div style="font-size:10px; color:#4a7a9a; margin-bottom:4px;">${label}</div>
        <div style="font-size:20px; font-weight:bold; color:${valueColor};">${value}</div>
      </div>
    `;
  }

  // ----------------------------------------------------------
  //  Play Again
  // ----------------------------------------------------------
  _playAgain() {
    if (this.domPanel) this.domPanel.destroy();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Start');
    });
  }

  // ----------------------------------------------------------
  //  Go to Dashboard  (re-fires postMessage then defers to parent)
  // ----------------------------------------------------------
  _goToDashboard() {
    if (window.parent !== window) {
      // Always re-send in case the auto-fire at create() was blocked
      window.__sagpPhishingResultSent = true;
      window.parent.postMessage({
        type:     'GAME_COMPLETE',
        score:    this.sessionData.finalScore ?? 0,
        passed:   this.won,
        maxScore: 500,
        accuracy: this.sessionData.accuracy ?? 0,
        avgResponseTimeMs: this.sessionData.avgResponseTimeMs ?? 0,
      }, window.location.origin || '*');
    }
  }

  // ----------------------------------------------------------
  //  Download CSV
  // ----------------------------------------------------------
  _downloadCSV() {
    const sd = this.sessionData;

    const lines = [
      // Header meta
      `PHISHING SIMULATOR — Session Report`,
      `Player Name,${sd.playerName}`,
      `Session ID,${sd.sessionId}`,
      `Date,"${new Date(sd.sessionDate || Date.now()).toLocaleString()}"`,
      `Final Score,${sd.finalScore}`,
      `Lives Remaining,${sd.livesRemaining}`,
      `Lives Used,${sd.livesUsed}`,
      `Accuracy,${Math.round((sd.accuracy || 0) * 100)}%`,
      `Avg Response Time (ms),${sd.avgResponseTimeMs}`,
      ``,
      // Email table header
      `#,Subject,True Type,Your Answer,Correct,Time (ms),Time (s)`,
      // Email rows
      ...(sd.emails || []).map(e =>
        [
          e.emailNum,
          `"${(e.subject || '').replace(/"/g, '""')}"`,
          e.trueType,
          e.userGuess,
          e.correct ? 'YES' : 'NO',
          e.timeTakenMs,
          (e.timeTakenMs / 1000).toFixed(2),
        ].join(',')
      ),
    ];

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `phishing_sim_${(sd.playerName || 'player').replace(/\s+/g, '_')}_${sd.sessionId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------------
  //  Background
  // ----------------------------------------------------------
  _buildBackground(W, H) {
    this.add.tileSprite(0, 0, W, H, 'sky')
      .setOrigin(0, 0).setScrollFactor(0);

    this.add.tileSprite(0, 0, W, H, 'bg_dark')
      .setOrigin(0, 0).setAlpha(0.35).setScrollFactor(0);

    this.cloudsFar = this.add.tileSprite(0, 0, W, H, 'clouds_far')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsMid = this.add.tileSprite(0, H * 0.18, W, H * 0.65, 'clouds_mid')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsFg = this.add.tileSprite(0, H - 185, W, 225, 'clouds_fg')
      .setOrigin(0, 0).setScrollFactor(0);
  }

  _startParallax() {
    // Parallax is handled in update() — nothing to do here
  }
}
