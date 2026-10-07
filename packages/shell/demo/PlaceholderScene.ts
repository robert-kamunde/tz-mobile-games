import * as Phaser from 'phaser';
import { getServices } from '../src';

const STYLE_TITLE: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'system-ui, sans-serif', fontSize: '56px', color: '#ffffff', fontStyle: 'bold' };
const STYLE_BODY: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#f2c94c' };
const STYLE_BUTTON: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: '32px',
  color: '#101418',
  backgroundColor: '#ffffff',
  padding: { x: 28, y: 18 },
};

/**
 * Proves the shell end to end: services, translated text, persisted settings, touch input.
 * It is a clearly marked placeholder and will not ship in either game.
 */
export class PlaceholderScene extends Phaser.Scene {
  static readonly KEY = 'Placeholder';

  constructor() {
    super(PlaceholderScene.KEY);
  }

  create(): void {
    const { translator, updateSettings, getSettings } = getServices(this);
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, height * 0.3, '', STYLE_TITLE).setOrigin(0.5).setName('title');
    const note = this.add.text(width / 2, height * 0.45, '', STYLE_BODY).setOrigin(0.5).setName('placeholder');
    const language = this.add
      .text(width / 2, height * 0.68, '', STYLE_BUTTON)
      .setOrigin(0.5)
      .setName('languageButton')
      .setInteractive({ useHandCursor: true });

    const render = () => {
      title.setText(translator.t('demo.title'));
      note.setText(translator.t('demo.placeholder'));
      language.setText(translator.t('demo.language'));
    };

    language.on('pointerup', () => {
      updateSettings({ locale: getSettings().locale === 'sw' ? 'en' : 'sw' });
      render();
    });

    render();
  }
}
