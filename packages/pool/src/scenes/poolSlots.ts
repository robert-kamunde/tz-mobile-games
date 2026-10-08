import type * as Phaser from 'phaser';
import { getServices } from '@tzg/shell';
import { UK_7FT_TABLE } from '../config/table';
import { createPoolSlots, type PoolSlots } from '../progress/slots';

const REGISTRY_KEY = 'pool.slots';

/** The game's save slots, created once and shared by the menu and the table through the registry. */
export function getPoolSlots(scene: Phaser.Scene): PoolSlots {
  const existing = scene.registry.get(REGISTRY_KEY) as PoolSlots | undefined;
  if (existing) return existing;
  const services = getServices(scene);
  const slots = createPoolSlots(services.gameId, services.store, UK_7FT_TABLE, services.logger.child('saves'));
  scene.registry.set(REGISTRY_KEY, slots);
  return slots;
}
