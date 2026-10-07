import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { phoneTestConfig } from '../../tooling/playwright.shared';

export default phoneTestConfig({ packageDir: path.dirname(fileURLToPath(import.meta.url)), port: 4174 });
