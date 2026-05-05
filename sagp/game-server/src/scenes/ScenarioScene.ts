/**
 * Scenario Scene - Branching narrative security scenarios
 *
 * Features:
 * - Story-based scenarios
 * - Multiple choice branches
 * - Consequence text for each decision
 * - Score impact based on decisions
 * - Path tracking
 */

export const ScenarioSceneCode = `
class ScenarioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScenarioScene' });
  }

  init(data) {
    this.tokenId = data.tokenId || '';
    this.gameEventHandler = data.gameEventHandler || null;
    this.scenarios = data.scenarios || this.getDefaultScenarios();
    this.currentScenarioIndex = 0;
    this.score = 0;
    this.maxScore = this.scenarios.length * 10;
    this.startTime = Date.now();
    this.currentPath = [];
    this.scenarioActive = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a1a2a)
      .setDepth(0);

    // Header
    this.add.rectangle(0, 0, width, 60, 0x8b4513).setOrigin(0, 0);
    this.add.text(30, 30, 'Security Scenario', {
      font: 'bold 24px Arial',
      fill: '#f4a460',
    }).setOrigin(0, 0.5);

    // Score display
    this.scoreText = this.add.text(30, 80, 'Score: 0 / ' + this.maxScore, {
      font: 'bold 18px Arial',
      fill: '#f4a460',
    });

    // Timer
    this.timerText = this.add.text(width - 150, 80, 'Time: 0s', {
      font: 'bold 18px Arial',
      fill: '#87ceeb',
    });

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerText.setText('Time: ' + elapsed + 's');
      },
      loop: true,
    });

    // Story text area
    this.storyText = this.add.text(width / 2, height / 2 - 60, '', {
      font: '16px Arial',
      fill: '#e0e0e0',
      align: 'center',
      wordWrap: { width: width - 100 },
    }).setOrigin(0.5, 0.5);

    // Consequence text (hidden initially)
    this.consequenceText = this.add.text(width / 2, height / 2 + 100, '', {
      font: '14px Arial',
      fill: '#ffcc00',
      align: 'center',
      wordWrap: { width: width - 100 },
    }).setOrigin(0.5, 0.5);

    // Choice buttons area
    this.choiceButtonsGroup = this.add.group();

    // Show first scenario
    this.showScenario(0);
  }

  showScenario(index) {
    this.currentScenarioIndex = index;
    this.scenarioActive = true;
    this.currentPath = [];

    const scenario = this.scenarios[index];
    this.storyText.setText(scenario.story);
    this.consequenceText.setText('');

    // Clear previous buttons
    this.choiceButtonsGroup.clear(true);

    // Create choice buttons
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonHeight = 40;
    const startY = height / 2 + 180;

    scenario.choices.forEach((choice, i) => {
      const y = startY + i * 70;

      const bg = this.add
        .rectangle(width / 2, y, 400, buttonHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x6495ed);

      bg.setInteractive({ useHandCursor: true });

      const text = this.add.text(width / 2, y, choice.text, {
        font: 'bold 14px Arial',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 380 },
      }).setOrigin(0.5, 0.5);

      const button = { bg, text, choice, index: i };

      bg.on('pointerdown', () => this.selectChoice(choice, button));
      bg.on('pointerover', () => {
        bg.setFillStyle(0x3a3a5a);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x2a2a4a);
      });

      this.choiceButtonsGroup.add(bg);
      this.choiceButtonsGroup.add(text);
    });
  }

  selectChoice(choice, button) {
    if (!this.scenarioActive) return;

    this.scenarioActive = false;

    // Disable all buttons
    this.choiceButtonsGroup.children.forEach((child) => {
      if (child.setInteractive) {
        child.setInteractive(false);
      }
    });

    // Visual feedback
    button.bg.setFillStyle(0x4a4a7a);
    button.text.setFill('#ffff00');

    this.currentPath.push(choice.text);

    // Show consequence
    this.consequenceText.setText('\\n' + choice.consequence);

    // Calculate score impact
    let scoreGain = 0;
    if (choice.impact > 0) {
      this.consequenceText.setColor('#90ee90'); // Green for positive
      scoreGain = 10;
    } else if (choice.impact < 0) {
      this.consequenceText.setColor('#ff6b6b'); // Red for negative
      scoreGain = 0;
    } else {
      this.consequenceText.setColor('#ffcc00'); // Yellow for neutral
      scoreGain = 5;
    }

    this.score += scoreGain;

    // Emit event
    this.gameEventHandler?.addEvent(this.tokenId, 'scenario_choice', {
      scenario_index: this.currentScenarioIndex,
      choice_index: button.index,
      impact: choice.impact,
    });

    // Next scenario or complete
    this.time.delayedCall(2500, () => {
      if (this.currentScenarioIndex < this.scenarios.length - 1) {
        this.scoreText.setText('Score: ' + this.score + ' / ' + this.maxScore);
        this.showScenario(this.currentScenarioIndex + 1);
      } else {
        this.completeGame();
      }
    });
  }

  completeGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show completion screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.7);

    this.add.text(width / 2, height / 2 - 60, 'Scenarios Complete!', {
      font: 'bold 48px Arial',
      fill: '#90ee90',
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

  getDefaultScenarios() {
    return [
      {
        story: 'You receive an email from someone claiming to be from your IT department asking you to confirm your password.',
        choices: [
          {
            text: 'Reply with your password',
            consequence: 'Account compromised. IT never asks for passwords via email.',
            impact: -10,
          },
          {
            text: 'Report to IT and ignore the email',
            consequence: 'Correct! You protected your account.',
            impact: 10,
          },
          {
            text: 'Click the link to verify',
            consequence: 'Phishing attempt detected. You fell for it.',
            impact: -5,
          },
        ],
      },
      {
        story: 'A coworker asks you to share a document with them over an unsecured email.',
        choices: [
          {
            text: 'Send it via email with an attachment',
            consequence: 'Data transmitted insecurely. Risk of interception.',
            impact: -8,
          },
          {
            text: 'Use the secure company document sharing system',
            consequence: 'Best practice! Using secure systems protects data.',
            impact: 10,
          },
          {
            text: 'Send via text message instead',
            consequence: 'Still insecure and against policy.',
            impact: -5,
          },
        ],
      },
      {
        story: 'Your system asks you to update your password. The update page looks slightly different than usual.',
        choices: [
          {
            text: 'Enter your current and new password',
            consequence: 'You gave credentials to a phishing site.',
            impact: -10,
          },
          {
            text: 'Cancel and manually navigate to the real settings page',
            consequence: 'Smart thinking! Always verify legitimate requests.',
            impact: 10,
          },
          {
            text: 'Ask a colleague if the page looks right',
            consequence: 'Good instinct, but report to IT directly instead.',
            impact: 5,
          },
        ],
      },
    ];
  }
}
`;

export default ScenarioSceneCode;
