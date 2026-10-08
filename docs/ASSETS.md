# Asset Inventory

No art, audio or font files exist yet. Everything on screen is a labelled placeholder (the pool table shows "MEZA YA MAZOEZI: michoro ya muda" / "PRACTICE TABLE: placeholder art").

| Name | Type | Purpose | Status | Location | Replacement requirements |
|---|---|---|---|---|---|
| System font (`system-ui, sans-serif`) | Font | All text in the shell demo | Placeholder | Device font, no file | A licensed font with full Kiswahili/Latin coverage, readable at small sizes; decided with Pool UI design. |
| Shell demo screen (`PlaceholderScene`) | Scene | Proves the shell works in tests | Placeholder, never ships | `packages/shell/demo/` | Not replaced; the pool game uses its own scenes. |
| Background colour `#1d5c3a` | Colour | Shell demo background (table green) | Placeholder | `packages/shell/demo/main.ts` | Pool art direction. |
| Rotate prompt | DOM text | Asks player to turn the phone sideways | Final behaviour, placeholder styling | `packages/shell/src/rotateOverlay.ts` | Icon of a rotating phone, styled to match the game. |
| App icon, splash screen | Image | Android launcher and startup | Missing | n/a | Needed before the first device build (Release step 3). |
| Pool table | Generated texture (flat shapes) | Rails, cloth, pockets, cushion lines, baulk line | Placeholder | `packages/pool/src/scenes/TableView.ts`, colours in `config/layout.ts` | Table art at 1280x720 design size (cloth, wood rails, pockets), readable on a small screen; the cushion and pocket shapes must match `config/table.ts`. |
| Balls (cue, red, yellow, black) | Generated textures (flat circles) | Balls | Placeholder | `TableView.ts` | Shaded ball sprites, about 28 px across at design size; red and yellow must be told apart by colour-blind players (add a marking). |
| Cue stick | Line | Shows aim and pull-back | Placeholder | `AimView.ts` | Cue sprite. |
| Power bar | Rectangles | Power control | Placeholder | `PowerBar.ts` | Styled bar and handle. |
| Match HUD | Text, circles, rectangle | Player panels, potted-ball trays, status line, game-over panel, New game button | Placeholder styling | `MatchHud.ts` | Styled panels and buttons; a font chosen for Kiswahili readability. |
| Opponent picker | Text buttons on a dark rectangle | "Unacheza na nani?" panel with four choices; the last choice is yellow | Placeholder styling | `OpponentPicker.ts`, `ui.ts` | Styled panel and buttons; possibly an icon per level. |
| Main menu | Title text and text buttons on the background colour | "Pool ya Mtaani" title, Continue, Play, Stats, Rules, Settings | Placeholder | `MenuScene.ts`, `MENU` in `config/layout.ts` | Title logo, a background picture of a local bar, styled buttons. |
| Menu panels (Stats, Rules, Settings) | Text and buttons on a dark rectangle | Stats lines, rules text, language buttons, Back | Placeholder styling | `MenuScene.ts`, `ui.ts` (`Panel`) | Styled panels; the rules screen may need small diagrams. |
| Menu button on the table | Text button | Back to the main menu, bottom left | Placeholder styling | `TableScene.ts` | Styled button, possibly an icon. |
| Ball-in-hand ring | Circle outline | Shows the cue ball can be dragged | Placeholder | `AimView.ts` | Could become a hand icon. |
| Sounds | Audio | Cue strike, ball clicks, cushion, pocket | Missing | n/a | Short, small files; needed before release. Not in Milestone 1 scope. |
