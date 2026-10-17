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
  // The menu picture lies on the page behind the canvas and fills the whole screen (scenes/pageBackdrop.ts);
  // the page itself has the same dark colour as COLORS.background, so other scenes look the same.
  transparent: true,
  strings: poolStrings,
  // The first scene listed starts first.
  scenes: [SplashScene, MenuScene, TableScene, StoryScene],
  parent: 'game',
  rotateMessageKey: 'shell.rotate',
  logLevel: import.meta.env.MODE === 'production' ? 'warn' : 'info',
});
