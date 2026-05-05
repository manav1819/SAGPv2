/**
 * Casino Quiz Scene - Slot machine / roulette aesthetic quiz game
 */

export const CasinoQuizSceneCode = `
class CasinoQuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CasinoQuizScene' });
  }

  init(data) {
    this.tokenId = data.tokenId || '';
    this.gameEventHandler = data.gameEventHandler || null;
    this.questions = data.questions || this.getDefaultQuestions();
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.lives = 3;
    this.maxScore = this.questions.length * 10;
    this.startTime = Date.now();
    this.answered = false;
    this.selectedAnswer = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background with casino theme
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a1a2e)
      .setDepth(0);

    // Golden accent bars
    this.add.rectangle(0, 50, width, 3, 0xffd700).setOrigin(0, 0);
    this.add.rectangle(0, height - 50, width, 3, 0xffd700).setOrigin(0, 0);

    // Create UI elements
    this.createHeader();
    this.createQuestionArea();
    this.createAnswerButtons();
    this.showQuestion(0);
  }

  createHeader() {
    const width = this.cameras.main.width;

    // Score display
    this.scoreText = this.add.text(30, 60, 'Score: 0', {
      font: 'bold 24px Arial',
      fill: '#ffd700',
    });

    // Lives display with hearts
    this.livesText = this.add.text(width / 2 - 50, 60, 'Lives: ❤️ ❤️ ❤️', {
      font: 'bold 24px Arial',
      fill: '#ff6b6b',
    });

    // Timer
    this.timerText = this.add.text(width - 200, 60, 'Time: 0s', {
      font: 'bold 24px Arial',
      fill: '#4ecdc4',
    });

    // Update timer every second
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerText.setText('Time: ' + elapsed + 's');
      },
      loop: true,
    });
  }

  createQuestionArea() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Question background
    this.questionBg = this.add.rectangle(
      width / 2,
      height / 2 - 50,
      width - 60,
      120,
      0x2d2d44
    );
    this.questionBg.setStrokeStyle(2, 0xffd700);

    // Question text
    this.questionText = this.add.text(width / 2, height / 2 - 50, '', {
      font: 'bold 20px Arial',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 100 },
    });
    this.questionText.setOrigin(0.5, 0.5);

    // Progress text
    this.progressText = this.add.text(width / 2, height / 2 + 40, '', {
      font: '16px Arial',
      fill: '#aaaaaa',
      align: 'center',
    });
    this.progressText.setOrigin(0.5, 0.5);
  }

  createAnswerButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonWidth = 350;
    const buttonHeight = 50;
    const startY = height / 2 + 100;

    this.answerButtons = [];

    for (let i = 0; i < 4; i++) {
      const y = startY + i * 70;
      const bg = this.add.rectangle(width / 2, y, buttonWidth, buttonHeight, 0x404060);
      bg.setStrokeStyle(2, 0x6666ff);
      bg.setInteractive({ useHandCursor: true });

      const text = this.add.text(width / 2, y, '', {
        font: '16px Arial',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
      });
      text.setOrigin(0.5, 0.5);

      const button = { bg, text, index: i };
      this.answerButtons.push(button);

      bg.on('pointerdown', () => this.selectAnswer(i));
      bg.on('pointerover', () => {
        if (!this.answered) {
          bg.setFillStyle(0x4d4d7f);
        }
      });
      bg.on('pointerout', () => {
        if (!this.answered) {
          bg.setFillStyle(0x404060);
        }
      });
    }
  }

  showQuestion(index) {
    this.currentQuestionIndex = index;
    this.answered = false;
    this.selectedAnswer = null;

    const question = this.questions[index];
    this.questionText.setText(question.text);
    this.progressText.setText('Question ' + (index + 1) + ' of ' + this.questions.length);

    // Update answer buttons
    question.answers.forEach((answer, i) => {
      if (i < this.answerButtons.length) {
        this.answerButtons[i].text.setText(answer);
        this.answerButtons[i].bg.setFillStyle(0x404060);
        this.answerButtons[i].bg.setStrokeStyle(2, 0x6666ff);
        this.answerButtons[i].bg.setInteractive();
      }
    });
  }

  selectAnswer(answerIndex) {
    if (this.answered) return;

    this.answered = true;
    this.selectedAnswer = answerIndex;
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;

    // Visual feedback
    const button = this.answerButtons[answerIndex];
    if (isCorrect) {
      button.bg.setFillStyle(0x28a745);
      button.bg.setStrokeStyle(2, 0x20c997);
      this.score += 10;
    } else {
      button.bg.setFillStyle(0xdc3545);
      button.bg.setStrokeStyle(2, 0xff7675);
      this.lives--;

      // Show correct answer
      const correctButton = this.answerButtons[question.correct];
      correctButton.bg.setFillStyle(0x28a745);
      correctButton.bg.setStrokeStyle(2, 0x20c997);

      // Emit life_lost event
      if (this.gameEventHandler) {
        this.gameEventHandler.addEvent(this.tokenId, 'life_lost', { lives: this.lives });
      }
    }

    // Update UI
    this.scoreText.setText('Score: ' + this.score);
    this.updateLivesDisplay();

    // Emit answer event
    if (this.gameEventHandler) {
      this.gameEventHandler.addEvent(this.tokenId, 'answer', {
        question_index: this.currentQuestionIndex,
        answer_index: answerIndex,
        correct: isCorrect,
      });
    }

    // Next question or end game
    this.time.delayedCall(1500, () => {
      if (this.lives <= 0) {
        this.completeGame(false);
      } else if (this.currentQuestionIndex < this.questions.length - 1) {
        this.showQuestion(this.currentQuestionIndex + 1);
      } else {
        this.completeGame(true);
      }
    });
  }

  updateLivesDisplay() {
    const hearts = Array(Math.max(0, this.lives)).fill('❤️').join(' ');
    this.livesText.setText('Lives: ' + hearts);
  }

  completeGame(success) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show completion screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.7);

    const message = success ? 'Quiz Complete!' : 'Game Over!';
    const messageColor = success ? '#28a745' : '#dc3545';

    this.add.text(width / 2, height / 2 - 60, message, {
      font: 'bold 48px Arial',
      fill: messageColor,
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

  getDefaultQuestions() {
    return [
      {
        text: 'What is the primary purpose of a phishing email?',
        answers: [
          'To steal sensitive information',
          'To improve email delivery',
          'To test network speed',
          'To provide helpful updates',
        ],
        correct: 0,
      },
      {
        text: 'Which of these is a common phishing indicator?',
        answers: [
          'Professional company letterhead',
          'Urgent requests to verify credentials',
          'Clear contact information',
          'Proper grammar and spelling',
        ],
        correct: 1,
      },
      {
        text: 'What should you do if you receive a suspicious email?',
        answers: [
          'Click links to verify authenticity',
          'Reply asking for more information',
          'Report it and delete it',
          'Forward it to coworkers',
        ],
        correct: 2,
      },
      {
        text: 'How can you verify a legitimate sender?',
        answers: [
          'Check the sender address carefully',
          'Assume it is legitimate if it looks professional',
          'Always reply to confirm',
          'Check the attachment',
        ],
        correct: 0,
      },
    ];
  }
}
`;

export default CasinoQuizSceneCode;
