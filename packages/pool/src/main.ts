import { createShellGame } from '@tzg/shell';
import { COLORS, DESIGN } from './config/layout';
import { MenuScene } from './scenes/MenuScene';
import { SplashScene } from './scenes/SplashScene';
import { StoryScene } from './scenes/StoryScene';
import { TableScene } from './scenes/TableScene';
import { poolStrings } from './strings';

createShellGame({
  // Storage key prefix. Never change after release or players lose their settings and stats.
  gameId: 'pool',
  design: DESIGN,
  orientation: 'landscape',
  backgroundColor: COLORS.background,
  strings: poolStrings,
  // The first scene listed starts first.
  scenes: [SplashScene, MenuScene, TableScene, StoryScene],
  parent: 'game',
  rotateMessageKey: 'shell.rotate',
  logLevel: import.meta.env.MODE === 'production' ? 'warn' : 'info',
});
