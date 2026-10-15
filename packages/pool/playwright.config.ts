import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { phoneTestConfig } from '../../tooling/playwright.shared';

/**
 * Every test starts with the first-launch language choice made (Kiswahili, as before 0.37.0); the
 * first-launch test clears it. Kept in step with core's settings save (version 1).
 */
export const CHOSEN_LANGUAGE = JSON.stringify({ v: 1, data: { locale: 'sw', soundVolume: 1, musicVolume: 0.7, languageChosen: true } });

export default phoneTestConfig({ packageDir: path.dirname(fileURLToPath(import.meta.url)), port: 4174, storage: { 'pool.settings': CHOSEN_LANGUAGE } });
