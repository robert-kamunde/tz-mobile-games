import { createShellGame } from '@tzg/shell';
import { COLORS, DESIGN } from './config/layout';
import { TableScene } from './scenes/TableScene';
import { poolStrings } from './strings';

createShellGame({
  // Storage key prefix. Never change after release or players lose their settings and stats.
  gameId: 'pool',
  design: DESIGN,
  orientation: 'landscape',
  backgroundColor: COLORS.background,
  strings: poolStrings,
  scenes: [TableScene],
  parent: 'game',
  rotateMessageKey: 'shell.rotate',
  logLevel: import.meta.env.MODE === 'production' ? 'warn' : 'info',
});
