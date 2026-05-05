/**
 * Drag Drop Scene - Match threats to mitigations or categorize emails
 *
 * Features:
 * - Drag and drop mechanics
 * - Match threats to mitigations
 * - Or sort emails into Safe/Phish bins
 * - Time pressure increases with difficulty
 * - Score based on correct matches
 */

export const DragDropSceneCode = `
class DragDropScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DragDropScene' });
  }

  init(data) {
    this.tokenId = data.tokenId || '';
    this.gameEventHandler = data.gameEventHandler || null;
    this.matchPairs = data.matchPairs || this.getDefaultMatchPairs();
    this.score = 0;
    this.maxScore = this.matchPairs.length * 10;
    this.startTime = Date.now();
    this.matchedPairs = new Set();
    this.draggedItem = null;
    this.gameCompleted = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x2d5016)
      .setDepth(0);

    // Header
    this.add.rectangle(0, 0, width, 60, 0x1a3a0a).setOrigin(0, 0);
    this.add.text(30, 30, 'Match the Threats to Mitigations', {
      font: 'bold 24px Arial',
      fill: '#90ee90',
    }).setOrigin(0, 0.5);

    // Score display
    this.scoreText = this.add.text(30, 80, 'Score: 0 / ' + this.maxScore, {
      font: 'bold 18px Arial',
      fill: '#90ee90',
    });

    // Timer
    this.timerText = this.add.text(width - 150, 80, 'Time: 0s', {
      font: 'bold 18px Arial',
      fill: '#ffcc00',
    });

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerText.setText('Time: ' + elapsed + 's');
      },
      loop: true,
    });

    // Create left panel (items to match)
    this.createLeftPanel();

    // Create right panel (targets)
    this.createRightPanel();
  }

  createLeftPanel() {
    const panelX = 50;
    const panelWidth = 350;
    const panelY = 130;
    const panelHeight = this.cameras.main.height - 160;

    // Panel background
    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x3d6b2e);
    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x5a9b4e).setAlpha(0.3);

    // Header
    this.add.text(panelX + 15, panelY + 10, 'Threats', {
      font: 'bold 16px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0);

    this.leftItems = [];
    const startY = panelY + 50;
    const itemHeight = 70;

    this.matchPairs.forEach((pair, index) => {
      const y = startY + index * itemHeight;

      const itemBg = this.add
        .rectangle(panelX + panelWidth / 2, y + itemHeight / 2, panelWidth - 20, itemHeight - 10, 0x5a9b4e)
        .setStrokeStyle(2, 0x90ee90);

      itemBg.setInteractive({
        draggable: true,
        useHandCursor: true,
      });

      const itemText = this.add.text(panelX + 15, y + 15, pair.threat, {
        font: 'bold 13px Arial',
        fill: '#ffffff',
        wordWrap: { width: panelWidth - 40 },
      }).setOrigin(0, 0);

      const item = {
        id: pair.id,
        bg: itemBg,
        text: itemText,
        pair,
        index,
      };

      this.leftItems.push(item);

      // Drag events
      itemBg.on('dragstart', () => {
        this.draggedItem = item;
        itemBg.setFillStyle(0x7ac97f);
        itemBg.setDepth(1000);
      });

      itemBg.on('dragend', () => {
        itemBg.setFillStyle(0x5a9b4e);
        itemBg.setDepth(0);
      });

      itemBg.on('pointerover', () => {
        if (!this.matchedPairs.has(pair.id)) {
          itemBg.setFillStyle(0x6db86a);
        }
      });

      itemBg.on('pointerout', () => {
        if (!this.matchedPairs.has(pair.id)) {
          itemBg.setFillStyle(0x5a9b4e);
        }
      });
    });
  }

  createRightPanel() {
    const width = this.cameras.main.width;
    const panelX = width - 400;
    const panelWidth = 350;
    const panelY = 130;
    const panelHeight = this.cameras.main.height - 160;

    // Panel background
    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x4a4a6a);
    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x6b6b8f).setAlpha(0.3);

    // Header
    this.add.text(panelX + 15, panelY + 10, 'Mitigations', {
      font: 'bold 16px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0);

    this.rightItems = [];
    const startY = panelY + 50;
    const itemHeight = 70;

    this.matchPairs.forEach((pair, index) => {
      const y = startY + index * itemHeight;

      const itemBg = this.add
        .rectangle(panelX + panelWidth / 2, y + itemHeight / 2, panelWidth - 20, itemHeight - 10, 0x6b6b8f)
        .setStrokeStyle(2, 0x9999ff);

      itemBg.setInteractive({
        useHandCursor: true,
      });

      const itemText = this.add.text(panelX + 15, y + 15, pair.mitigation, {
        font: 'bold 13px Arial',
        fill: '#ffffff',
        wordWrap: { width: panelWidth - 40 },
      }).setOrigin(0, 0);

      const item = {
        id: pair.id,
        bg: itemBg,
        text: itemText,
        pair,
        index,
      };

      this.rightItems.push(item);

      // Drop target
      this.input.setDraggable(itemBg, true);

      itemBg.on('drop', () => {
        if (this.draggedItem && this.draggedItem.pair.id === pair.id) {
          this.matchPair(this.draggedItem, item);
        }
      });

      itemBg.on('pointerover', () => {
        if (this.draggedItem && !this.matchedPairs.has(pair.id)) {
          itemBg.setFillStyle(0x7a7aaf);
        }
      });

      itemBg.on('pointerout', () => {
        if (!this.matchedPairs.has(pair.id)) {
          itemBg.setFillStyle(0x6b6b8f);
        }
      });
    });
  }

  matchPair(leftItem, rightItem) {
    if (leftItem.pair.id !== rightItem.pair.id) return;

    this.matchedPairs.add(leftItem.pair.id);
    this.score += 10;

    // Visual feedback
    leftItem.bg.setFillStyle(0x28a745);
    leftItem.bg.setStrokeStyle(2, 0x90ee90);
    rightItem.bg.setFillStyle(0x28a745);
    rightItem.bg.setStrokeStyle(2, 0x90ee90);

    // Disable interaction
    leftItem.bg.setInteractive(false);
    rightItem.bg.setInteractive(false);

    this.scoreText.setText('Score: ' + this.score + ' / ' + this.maxScore);

    // Emit event
    this.gameEventHandler?.addEvent(this.tokenId, 'pair_matched', {
      pair_id: leftItem.pair.id,
    });

    // Check if all pairs matched
    if (this.matchedPairs.size === this.matchPairs.length) {
      this.completeGame();
    }

    this.draggedItem = null;
  }

  completeGame() {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show completion screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.7);

    this.add.text(width / 2, height / 2 - 60, 'All Pairs Matched!', {
      font: 'bold 48px Arial',
      fill: '#28a745',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    this.add.text(
      width / 2,
      height / 2 + 20,
      'Final Score: ' + this.score + ' / ' + this.maxScore,
      {
        font: 'bold 32px Arial',
        fill: '#ffd700',
        align: 'center',
      }
    ).setOrigin(0.5, 0.5);

    // Update event handler
    if (this.gameEventHandler) {
      this.gameEventHandler.updateScore(this.tokenId, this.score, this.maxScore);
      this.gameEventHandler.completeSession(this.tokenId);
    }
  }

  getDefaultMatchPairs() {
    return [
      {
        id: 'pair1',
        threat: 'Phishing Email',
        mitigation: 'User Training & Email Filtering',
      },
      {
        id: 'pair2',
        threat: 'Weak Passwords',
        mitigation: 'Multi-Factor Authentication',
      },
      {
        id: 'pair3',
        threat: 'Unpatched Software',
        mitigation: 'Regular Updates & Patches',
      },
      {
        id: 'pair4',
        threat: 'Social Engineering',
        mitigation: 'Security Awareness Program',
      },
    ];
  }
}
`;

export default DragDropSceneCode;
