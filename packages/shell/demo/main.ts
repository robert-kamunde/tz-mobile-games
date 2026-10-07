import { createShellGame } from '../src';
import { PlaceholderScene } from './PlaceholderScene';
import { demoStrings } from './strings';

createShellGame({
  gameId: 'shell-demo',
  design: { width: 1280, height: 720 },
  orientation: 'landscape',
  backgroundColor: '#1d5c3a',
  strings: demoStrings,
  scenes: [PlaceholderScene],
  parent: 'game',
  rotateMessageKey: 'shell.rotate',
  logLevel: import.meta.env.MODE === 'production' ? 'warn' : 'info',
});
