import { createShellGame } from '@tzg/shell';
import { COLORS, DESIGN } from './config/layout';
import { MenuScene } from './scenes/MenuScene';
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
  scenes: [MenuScene, TableScene],
  parent: 'game',
  rotateMessageKey: 'shell.rotate',
  logLevel: import.meta.env.MODE === 'production' ? 'warn' : 'info',
});
