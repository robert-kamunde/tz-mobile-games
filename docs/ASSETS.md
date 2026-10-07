# Asset Inventory

No art, audio or font files exist yet. Everything on screen is a labelled placeholder.

| Name | Type | Purpose | Status | Location | Replacement requirements |
|---|---|---|---|---|---|
| System font (`system-ui, sans-serif`) | Font | All text in the shell demo | Placeholder | Device font, no file | A licensed font with full Kiswahili/Latin coverage, readable at small sizes; decided with Pool UI design. |
| Shell demo screen (`PlaceholderScene`) | Scene | Proves the shell works in tests | Placeholder, never ships | `packages/shell/demo/` | Not replaced; the pool game uses its own scenes. |
| Background colour `#1d5c3a` | Colour | Shell demo background (table green) | Placeholder | `packages/shell/demo/main.ts` | Pool art direction. |
| Rotate prompt | DOM text | Asks player to turn the phone sideways | Final behaviour, placeholder styling | `packages/shell/src/rotateOverlay.ts` | Icon of a rotating phone, styled to match the game. |
| App icon, splash screen | Image | Android launcher and startup | Missing | n/a | Needed before the first device build (Release step 3). |
