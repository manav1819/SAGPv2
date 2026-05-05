/**
 * Phishing Inbox Scene - Simulated email inbox with phishing identification
 *
 * Features:
 * - Email inbox UI
 * - Emails with phishing indicators
 * - Must identify phishing before clicking
 * - Score based on correct identification
 */

export const PhishingInboxSceneCode = `
class PhishingInboxScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PhishingInboxScene' });
  }

  init(data) {
    this.tokenId = data.tokenId || '';
    this.gameEventHandler = data.gameEventHandler || null;
    this.emails = data.emails || this.getDefaultEmails();
    this.score = 0;
    this.maxScore = this.emails.length * 10;
    this.startTime = Date.now();
    this.processedEmails = new Set();
    this.selectedEmailId = null;
    this.gameCompleted = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add
      .rectangle(width / 2, height / 2, width, height, 0xf5f5f5)
      .setDepth(0);

    // Header
    this.add.rectangle(0, 0, width, 60, 0x2c3e50).setOrigin(0, 0);
    this.add.text(30, 30, 'Phishing Inbox Challenge', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0.5);

    // Instructions
    this.add.text(width - 250, 30, 'Identify phishing emails', {
      font: '14px Arial',
      fill: '#aaaaaa',
    }).setOrigin(1, 0.5);

    // Score display
    this.scoreText = this.add.text(30, 90, 'Score: 0 / ' + this.maxScore, {
      font: 'bold 18px Arial',
      fill: '#2c3e50',
    });

    // Timer
    this.timerText = this.add.text(width - 150, 90, 'Time: 0s', {
      font: 'bold 18px Arial',
      fill: '#e74c3c',
    });

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerText.setText('Time: ' + elapsed + 's');
      },
      loop: true,
    });

    // Create email list
    this.createEmailList();

    // Create email detail panel
    this.createDetailPanel();
  }

  createEmailList() {
    const listWidth = 350;
    const listX = 30;
    const listY = 130;

    // List header
    this.add.rectangle(listX + listWidth / 2, listY - 15, listWidth, 30, 0x34495e);
    this.add.text(listX + 10, listY - 15, 'From', {
      font: 'bold 14px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add.text(listX + 220, listY - 15, 'Status', {
      font: 'bold 14px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0.5);

    this.emailItems = [];
    const itemHeight = 60;

    this.emails.forEach((email, index) => {
      const y = listY + index * itemHeight;

      // Email item background
      const bg = this.add
        .rectangle(listX + listWidth / 2, y + itemHeight / 2, listWidth, itemHeight - 5, 0xecf0f1)
        .setStrokeStyle(1, 0xbdc3c7);

      bg.setInteractive({ useHandCursor: true });

      // Sender name
      const senderText = this.add.text(listX + 10, y + 15, email.from, {
        font: '14px Arial',
        fill: '#2c3e50',
      }).setOrigin(0, 0);

      // Subject
      const subjectText = this.add.text(listX + 10, y + 35, email.subject, {
        font: '12px Arial',
        fill: '#7f8c8d',
      }).setOrigin(0, 0);

      const item = {
        id: email.id,
        bg,
        senderText,
        subjectText,
        index,
      };

      this.emailItems.push(item);

      bg.on('pointerdown', () => this.selectEmail(email.id, item));
      bg.on('pointerover', () => {
        if (!this.processedEmails.has(email.id)) {
          bg.setFillStyle(0xd5dbdb);
        }
      });
      bg.on('pointerout', () => {
        if (!this.processedEmails.has(email.id)) {
          bg.setFillStyle(0xecf0f1);
        }
      });
    });
  }

  createDetailPanel() {
    const detailX = 420;
    const detailY = 130;
    const panelWidth = this.cameras.main.width - detailX - 30;
    const panelHeight = this.cameras.main.height - detailY - 30;

    // Panel background
    this.detailBg = this.add.rectangle(
      detailX + panelWidth / 2,
      detailY + panelHeight / 2,
      panelWidth,
      panelHeight,
      0xffffff
    );
    this.detailBg.setStrokeStyle(2, 0xbdc3c7);

    // Detail text
    this.detailText = this.add.text(detailX + 20, detailY + 20, 'Select an email to view details', {
      font: '14px Arial',
      fill: '#7f8c8d',
      wordWrap: { width: panelWidth - 40 },
    }).setOrigin(0, 0);

    // Action buttons
    this.reportButton = this.createButton(
      detailX + panelWidth / 2 - 110,
      detailY + panelHeight - 50,
      'Report Phishing',
      0xdc3545
    );
    this.reportButton.setActive(false);

    this.safeButton = this.createButton(
      detailX + panelWidth / 2 + 110,
      detailY + panelHeight - 50,
      'Mark as Safe',
      0x28a745
    );
    this.safeButton.setActive(false);
  }

  createButton(x, y, label, color) {
    const width = 180;
    const height = 40;

    const bg = this.add.rectangle(x, y, width, height, color);
    bg.setStrokeStyle(2, color);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      font: 'bold 14px Arial',
      fill: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const button = { bg, text, active: true };

    bg.on('pointerdown', () => {
      if (button.active && this.selectedEmailId) {
        this.handleEmailAction(label.includes('Report'));
      }
    });

    bg.on('pointerover', () => {
      if (button.active) {
        bg.setAlpha(0.8);
      }
    });

    bg.on('pointerout', () => {
      bg.setAlpha(1);
    });

    button.setActive = (active) => {
      button.active = active;
      bg.setAlpha(active ? 1 : 0.5);
      bg.setInteractive(active ? { useHandCursor: true } : false);
    };

    return button;
  }

  selectEmail(emailId, item) {
    this.selectedEmailId = emailId;
    const email = this.emails.find(e => e.id === emailId);

    if (!email) return;

    // Highlight selected item
    this.emailItems.forEach(it => {
      it.bg.setFillStyle(it.id === emailId ? 0xd5dbdb : 0xecf0f1);
    });

    // Show email details
    let details = 'From: ' + email.from + '\\n';
    details += 'To: ' + email.to + '\\n';
    details += 'Subject: ' + email.subject + '\\n\\n';
    details += 'Message:\\n' + email.body + '\\n\\n';

    if (email.indicators.length > 0) {
      details += '\\nWarning Indicators:\\n';
      email.indicators.forEach(ind => {
        details += '• ' + ind + '\\n';
      });
    }

    this.detailText.setText(details);

    // Enable action buttons
    this.reportButton.setActive(true);
    this.safeButton.setActive(true);
  }

  handleEmailAction(isReport) {
    if (!this.selectedEmailId) return;

    const email = this.emails.find(e => e.id === this.selectedEmailId);
    if (!email || this.processedEmails.has(this.selectedEmailId)) return;

    this.processedEmails.add(this.selectedEmailId);

    const isPhishing = email.isPhishing;
    const correct = (isReport && isPhishing) || (!isReport && !isPhishing);

    if (correct) {
      this.score += 10;

      // Visual feedback
      const item = this.emailItems.find(it => it.id === this.selectedEmailId);
      if (item) {
        item.bg.setFillStyle(0xd5f4e6);
        item.bg.setStrokeStyle(2, 0x28a745);
      }

      this.gameEventHandler?.addEvent(this.tokenId, 'phish_identified', {
        email_id: this.selectedEmailId,
        is_phishing: isPhishing,
        action: isReport ? 'report' : 'safe',
      });
    } else {
      // Visual feedback for wrong answer
      const item = this.emailItems.find(it => it.id === this.selectedEmailId);
      if (item) {
        item.bg.setFillStyle(0xf8d7da);
        item.bg.setStrokeStyle(2, 0xdc3545);
      }

      this.gameEventHandler?.addEvent(this.tokenId, 'phish_error', {
        email_id: this.selectedEmailId,
        is_phishing: isPhishing,
        action: isReport ? 'report' : 'safe',
      });
    }

    this.scoreText.setText('Score: ' + this.score + ' / ' + this.maxScore);

    // Check if all emails processed
    if (this.processedEmails.size === this.emails.length) {
      this.completeGame();
    }
  }

  completeGame() {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show completion screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.7);

    this.add.text(width / 2, height / 2 - 60, 'Inbox Challenge Complete!', {
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

  getDefaultEmails() {
    return [
      {
        id: 'email1',
        from: 'support@paypa1.com',
        to: 'user@company.com',
        subject: 'Urgent: Verify Your Account',
        body: 'Your PayPal account has been suspended. Click here to verify your credentials immediately.',
        isPhishing: true,
        indicators: [
          'Misspelled domain (paypa1.com instead of paypal.com)',
          'Urgent language demanding immediate action',
          'Request for credentials',
        ],
      },
      {
        id: 'email2',
        from: 'noreply@github.com',
        to: 'user@company.com',
        subject: 'Your repository has been starred',
        body: 'A user has starred your repository. Login to GitHub to see who.',
        isPhishing: false,
        indicators: [],
      },
      {
        id: 'email3',
        from: 'hr@company-secure.ru',
        to: 'user@company.com',
        subject: 'Employee Benefits Update',
        body: 'We need to update your benefits information. Please login here to continue.',
        isPhishing: true,
        indicators: [
          'Suspicious domain (.ru instead of company domain)',
          'Generic greeting',
          'Request to login',
        ],
      },
      {
        id: 'email4',
        from: 'billing@stripe.com',
        to: 'user@company.com',
        subject: 'Invoice #INV-2024-001',
        body: 'Your invoice is ready. You can view it in your Stripe dashboard.',
        isPhishing: false,
        indicators: [],
      },
    ];
  }
}
`;

export default PhishingInboxSceneCode;
