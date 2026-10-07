import type * as Phaser from 'phaser';
import {
  AppLifecycle,
  createLogger,
  createSettingsSlot,
  createTranslator,
  createWebStore,
  type KeyValueStore,
  type Logger,
  type LogLevel,
  type SaveSlot,
  type Settings,
  type StringTables,
  type Translator,
} from '@tzg/core';

/**
 * Everything a scene needs from outside Phaser. Created once per game and shared through the registry,
 * so scenes never construct their own storage, translator or lifecycle.
 */
export interface Services {
  readonly gameId: string;
  readonly logger: Logger;
  readonly store: KeyValueStore;
  readonly translator: Translator;
  readonly lifecycle: AppLifecycle;
  getSettings(): Readonly<Settings>;
  /** Applies a partial change, persists it, and returns the new settings. */
  updateSettings(change: Partial<Settings>): Readonly<Settings>;
}

const REGISTRY_KEY = 'tzg.services';

export interface CreateServicesOptions {
  gameId: string;
  strings: StringTables;
  logLevel: LogLevel;
}

export function createServices(options: CreateServicesOptions): Services {
  const logger = createLogger(options.gameId, options.logLevel);
  const store = createWebStore(() => window.localStorage, logger.child('storage'));
  const settingsSlot: SaveSlot<Settings> = createSettingsSlot(options.gameId, store, logger.child('settings'));

  const loaded = settingsSlot.load();
  logger.info(`settings ${loaded.outcome}`);
  let settings: Settings = loaded.data;

  const translator = createTranslator(options.strings, settings.locale, logger.child('i18n'));
  const lifecycle = new AppLifecycle(document, window, logger.child('lifecycle'));

  // Persist on every pause: Android may kill a backgrounded app without further notice.
  lifecycle.on('pause', () => settingsSlot.save(settings));

  return {
    gameId: options.gameId,
    logger,
    store,
    translator,
    lifecycle,
    getSettings: () => settings,
    updateSettings(change) {
      settings = { ...settings, ...change };
      translator.setLocale(settings.locale);
      settingsSlot.save(settings);
      return settings;
    },
  };
}

export function registerServices(game: Phaser.Game, services: Services): void {
  game.registry.set(REGISTRY_KEY, services);
}

export function getServices(scene: Phaser.Scene): Services {
  const services = scene.registry.get(REGISTRY_KEY) as Services | undefined;
  if (!services) throw new Error('Services not registered. Create the game with createShellGame().');
  return services;
}
