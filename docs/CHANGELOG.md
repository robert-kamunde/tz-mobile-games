# Changelog

## 0.33.0 (unreleased) - Tables with depth
- Robert chose "Whole table" (2026-10-14): the tables looked flat, mostly because the pockets were plain black circles.
- **Pockets:** you can now see into each hole. The bottom is black, the inside wall shows on the far side, lit by the lamp over the table, and a leather rim catches the light.
- **Potted balls sink into the hole:** they shrink, darken and fade into the pocket over about a fifth of a second instead of vanishing. The rules count them potted as before.
- **Cushions** are shaded so they look rounded, and they cast a soft shadow on the cloth. **Rails** have a rounded, lit top. **Lamp light:** a warm pool of light in the middle of the cloth, darker into the corners.
- Looks only, on every table; physics, aiming and saves are unchanged.

## 0.32.0 (unreleased) - A quieter rumble, rolling dots and premium buttons
- Robert chose "Build all four" (2026-10-14).
- **Rumble:** the sound of a ball rolling under the table is about a third as loud as before, and deeper and softer.
- **Tube:** the pipe no longer lies over the table's rail. It ends in a dark opening at the rail's edge, darkening as it goes under the table, so a potted ball comes out of the dark. The tube and pipe cast a soft shadow.
- **Red balls:** the white dot now rolls with the ball during a shot: it moves round the ball, squashes towards the edge and disappears underneath, then comes back over the top. It does not move when balls are placed (a new rack, ball in hand, a loaded game). Looks only: the physics are unchanged.
- **Buttons:** deep teal-green with a thin gold border, a soft bevel and cream bold text. Main actions (CHEZA, Chagua, Anza) and the current choice are gold with dark text. A button sinks in a little while pressed, and every press gives a soft tick.
- **Popups:** a dark wooden frame with a gold edge, the title on a red ribbon like the logo's, the screen around it dimmed, and a short pop-in. The end-of-game panel pops in too.

## 0.31.0 (unreleased) - Robert's logo, menu background and app icon
- Robert made the pictures with ChatGPT from the prompts in `docs/ART_PROMPTS.md` (2026-10-14). They are now the game's title logo (with crossed cues), the menu and journey-map background, and the app icon on the phone and the Play store. The splash screen and the Play feature graphic are built from the same pictures, so everything matches.
- The pictures are files in `packages/pool/art/` (originals in `art/source/`): replacing one and rebuilding changes it, as with the faces. If a picture is missing the game falls back to the drawn version.
- The menu buttons sit a little lower to make room for the taller logo.
- Robert must pull and rebuild the Android app to get the new icon and splash.

## 0.30.0 (unreleased) - Balls take the long way to the tube
- Robert chose "Build it" (2026-10-14): a potted ball used to reach the tube at once from any pocket, which only looked right for the corner next to the tube. Now it rolls unseen under the table first, for longer the farther its pocket is from the tube: about 0.03 s from the corner by the tube, 0.6 s from the bottom corner on that side and the near middle pocket, 0.9 s from the far middle pocket, and 1.3 to 1.4 s from the two far corners (then the short roll along the pipe as before). For left-handed players the tube is on the other side, so the near and far pockets swap.
- New sounds: a soft rumble while a ball is under the table (longer for far pockets), a roll along the pipe, and the click as it lands in the tube. The pocket sound is now just the knock into the pocket.
- Balls potted in one shot take their place in the tube in the order they arrive. Nothing waits for them: the next shot can be played while a ball is still on its way. Rules are unchanged.

## 0.29.0 (unreleased) - A shorter main menu: CHEZA and Mapambo
- Robert chose "Build both" (2026-10-13): the main menu had grown to seven rows. It now has four: a big **CHEZA** (PLAY), then **Mapambo** (Customise) beside Takwimu, Sheria beside Mipangilio, and Toka (Android app only).
- **CHEZA** opens a page with Endelea na mchezo / Endelea na safari (when a game is waiting), Mchezo wa haraka, Safari ya Bingwa and Rudi. An orange dot on CHEZA says a game or journey game is waiting inside.
- **Mapambo** opens Meza, Fimbo and Mandhari, each showing how many are open (for example "Meza  2/9"), and Rudi.
- The phone's Back button on CHEZA or Mapambo goes back to the main page.

## 0.28.0 (unreleased) - Play reminders
- Robert chose "Build now" (2026-10-13). The Android app can remind a player to come back, with a phone notification the phone sets by itself (no internet, no server, no personal data). The reminder is about whatever is most useful: an unfinished journey game ("Mchezo wako wa Kariakoo bado unaendelea. Mama Ntilie anakusubiri!"), an unfinished game, a look one win away ("Ushindi 1 tu na upate meza ya Kitenge!"), the next journey stop, or simply "Meza iko tayari. Njoo ucheze!".
- Gentle by design: one reminder at a time, only after a day away, at least two days apart, always at 6 in the evening. Opening the game removes it.
- The player is asked to allow notifications once, after their first win against the computer, not when the game first opens. **Vikumbusho** in Mipangilio turns reminders on or off (only in the Android app).
- New: the notification plugin `@capacitor/local-notifications` 8.3.1 and a white status-bar icon. After pulling, run `npm install` before syncing the Android project.
- Birthday wishes were left out: they would need a date of birth (personal data).

## 0.27.0 (unreleased) - Quick game no longer loses the journey game
- Fix (Robert, 2026-10-13): starting a Quick game while a Safari ya Bingwa game was half-way replaced it, because both used the same save. They are now saved apart: the menu shows **Endelea na mchezo** for the Quick game and **Endelea na safari** for the story game, side by side when both are waiting. A story game saved by an older version moves to Endelea na safari on its own. (Stars already won were never lost; only the half-played stop game was.)

## 0.26.0 (unreleased) - Picker pages, earned looks and characters
- Fix (Robert, 2026-10-12): in Meza and Mandhari the ninth item (Ziwa) was cut off and could not be reached. The table, cue and scenery pickers now show a page at a time (8 per page) with ‹ › arrows beside Back and Chagua, and the page number after the title ("Chagua meza 1/2"). Robert chose pages over scrolling. A picker opens on the page of the current choice.
- **Only two of each look are free** (Robert, 2026-10-12): tables Klasiki and Zanzibar, cues Klasiki and Zanzibar, scenery Klasiki and Mbao. The other twelve open by playing, in this order, each at its story stop **or** after enough wins against the computer (3, 6, 9 ... 36), whichever comes first: Kitenge table (Kariakoo), Kitenge cue (Sinza), Kanga scenery (Mwenge), Maasai table (Bagamoyo), Maasai cue (Dodoma), Bahari scenery (Tanga), Tingatinga table (Babati), Tingatinga cue (Karatu), Nyota scenery (Bukoba), Makonde table (Mbeya), Makonde cue (Mtwara), Makuti scenery (Pemba). Story wins count toward the wins too. The chapter and star rewards of 0.25.0 are unchanged. No coins, no buying.
- **Two characters start locked** (Robert, 2026-10-12; both women stay free): Bishoo opens when chapter 1 is finished, Kichwa after 10 wins against the computer. Locked faces are faded with a padlock and what earns them, in every character picker.
- The end panel says when a game opened something ("Zawadi: meza ya Kitenge!", "Mhusika mpya: Kichwa!"), in Quick game too. A stop card names the look that stop earns.
- A look chosen before it was locked falls back to Klasiki until earned again.

## 0.25.0 (unreleased) - Safari ya Bingwa in three chapters
- Robert chose "3 chapters now" (2026-10-12). The journey is now 27 stops in three chapters of nine: **Sura 1: Dar es Salaam** (Mtaani to Mzee Kobe's club), **Sura 2: Kaskazini** (Morogoro to Arusha) and **Sura 3: Hadi Visiwani** (Mwanza to Zanzibar and the final against Bingwa). The map shows one chapter at a time, with arrows to the others; it opens on the chapter you are playing.
- **Ten new rivals** met only in story mode, named by Claude, with faces Robert made with ChatGPT (cut from his 5 x 2 sheet) and their own catchphrases: Kaka Tunda, Bwana Shamba, Mama Pweza, Kahawa, Mzee Simba, Sato, Dada Ndizi, Kapteni, Baridi, Mzee Karafuu.
- **Twists** on some stops, shown on the stop card: the rival breaks; win within a number of your shots (the shots left show in the status line); one foul and you lose; no spin. Twists start at the third stop.
- **New tables and backgrounds**, drawn in code: the Kilimanjaro table (coffee wood carved with snowy peaks, dusk felt) and Mlima background (Kilimanjaro at dusk) for finishing chapter 2; the Ziwa table (papyrus-green rails with fishing net and float beads, lake-blue felt) and Ziwa background (Lake Victoria at sunset with its rocks and boats) for finishing chapter 3.
- **Rewards and titles re-spread** over 81 stars: the Bingwa cue for finishing chapter 1; the Kilimanjaro and Ziwa sets for chapters 2 and 3; the Dhahabu table for beating Bingwa; the Vikombe background at 70 stars. Titles at 15, 35 and 55 stars, and Bingwa wa Bongo for beating Bingwa.
- A replayed stop always starts the way the stop is set (you break, unless the rival does).
- Stars already earned are kept: the eight stops of 0.24.0 are all still on the journey.
- Fix: the stop card's Cheza button was covered by Back when the card had a twist and a best score.

## 0.24.0 (unreleased) - Story mode: Safari ya Bingwa
- Robert (2026-10-12): "lets continue with the story mode, launch can wait". Built to `STORY_MODE.md` with Claude's picks for the open questions: the name **Safari ya Bingwa**, eight stops, three stars per stop.
- The menu's Play is now two buttons: **Mchezo wa haraka** (Quick game, the game as before) and **Safari ya Bingwa**.
- **The map:** eight stops on a path, Mtaani to the final against Bingwa, each with its rival's face, place and best stars. A beaten stop gets a small gold cup; a closed stop is faded with a padlock. Your character, title and total stars at the top; the three story rewards and what earns them along the bottom. The first visit asks for the journey's character ("Badilisha mhusika" changes it).
- **Stop card:** the rival and level, how to earn each star, and Cheza. Each stop plays on its own table and background.
- **Stars:** 1 for a win, 2 for a win with no foul, 3 for a win with no foul and at least 3 of the rival's balls still on the table. The best result is kept.
- **End panel in story mode:** the stars earned, any new title or reward, and **Endelea** (next stop), **Rudia** and **Ramani** (map). Untouched, it goes to the map after 10 seconds. The phone's back button there also goes to the map. The panel grows when a note needs two lines.
- **Rewards**, locked in the pickers with a padlock and what earns them: the **Dhahabu** table (beat Bingwa), the **Bingwa** cue (18 stars) and the **Vikombe** background, a trophy shelf wall (all 24 stars). Titles: Mchezaji wa Mtaa (6 stars), Fundi wa Meza (12), Mkali wa Bongo (18), Bingwa wa Bongo (beat Bingwa). Nothing that existed before is locked.
- If you play as a stop's rival, a stand-in takes the stop (Sinza: Kichwa for Mjanja; Mwenge: Mwamba for Bonge; Bagamoyo: Malkia for Shangazi; Zanzibar: Shangazi for Malkia).
- A story game left half-way is saved like any game, with its stop, and Continue brings it back. Starting a stop replaces a saved Quick game, as starting any new game does.
- The table and background pickers show four pictures per row to fit the new items.
- Fix (Robert, 2026-10-12): the OK button when changing the journey's character showed "ui.ok" (a missing label). It now says Sawa / OK. A new unit test checks that every label the code uses exists in both languages.

## 0.23.0 (unreleased) - Rematch and back to the menu after a game
- Robert (2026-10-12): the end-of-game panel (who won and why) now has two buttons. **Rudia** (Rematch) starts the next game at once with the same opponent and characters; the other player breaks, as with any rematch. **Menyu** goes to the menu.
- If nobody touches the screen, the panel goes to the menu on its own after 10 seconds (Robert chose 10 on the card), counting down on the button: "Menyu (10)", "Menyu (9)"... Any touch stops the count, so a player who is looking at the table or about to tap is never pulled away.

## 0.22.0 (unreleased) - Your character first
- Robert (2026-10-12): Play and New game now start with "Chagua mhusika" (choose your character), then "Unacheza na nani?" (the opponent). Against the computer, tapping a level starts the game. With two players, player 2 then chooses ("Mchezaji 2") and cannot take player 1's character. Back and the phone's back button step back in the same order; Back on your character closes the choice.
- The first step's button now says "Endelea" (Next) for everyone, since the opponent comes next.

## 0.21.0 (unreleased) - New character faces
- Robert made the twelve faces with ChatGPT from `PORTRAIT_PROMPTS.md` (2026-10-12), as one 4 x 3 sheet in picker order. Each face was cut from the sheet with a little room around the head so caps and wraps stay in, resized to 512 x 512 and saved as a JPEG (about 35 to 50 KB each, 0.5 MB for all twelve). The sheet is kept in `portraits/source/` for re-cutting.
- The store feature graphic shows the new faces of Malkia, Fundi and Bingwa.

## 0.20.0 (unreleased) - Character faces from picture files
- Robert (2026-10-12): the drawn faces are too cartoonish, and he wants to be able to replace them with pictures at any time. Each character's face is now a picture file in `packages/pool/portraits/`, named after the character (`fundi.png`, `mama-ntilie.png`...). Swap a file and rebuild, and that face changes; no code changes. PNG or JPEG, square.
- The first set of files is the current drawn faces, so the game looks the same until new pictures arrive. If a picture is missing or will not load, that character falls back to its drawn face.
- `npm run portraits -w @tzg/pool` gets new pictures ready: it cuts each to its middle square, resizes it to 512 x 512, keeps it under 300 KB (a photo-like PNG becomes a JPEG), and saves the drawn face for any character without a picture. `npm run icons` now uses the pictures for the store feature graphic too.
- `docs/PORTRAIT_PROMPTS.md`: one prompt per character, in one shared style, for making the faces with an image tool.
- Bingwa confirmed as the Impossible opponent's name (Robert, 2026-10-12).

## 0.19.0 (unreleased) - Art Part C: icon, splash, store pictures and better sounds
- **App icon:** a shiny 8-ball in front of a red and a yellow ball on green felt, at every Android size (square, round, and the adaptive icon's foreground inside its safe area).
- **Splash screen:** the menu's pool bar, a little darker, with the Bongo Pool Table logo, landscape and portrait at every size.
- **Store pictures:** a new 512 px icon; a feature graphic with the bar, the logo, "Pool ya bar, mfukoni mwako" and Malkia, Fundi and Bingwa; four new 1920x1080 screenshots (menu, how to play, the break, a match with balls in the tube). All are drawn by the game's own art code (`scripts/makeAppIcons.mjs` runs `scenes/art/storeArt.ts` in a browser), so they always match the game.
- **Sounds, version 2:** still synthesised, now built like the real sounds: the cue is a dull "tock" with the ball's ring; a ball hitting a ball is the bright, glassy click of resin balls; a cushion is a soft rubber thump with a knock from the wooden rail; a pocket is a hollow knock, the ball rolling down to the tube, and a click as it lands on the others. The synthesiser gained delays, soft starts, high-pass noise and a rattle. Not checked by ear by Claude (it cannot listen): Robert's ears decide.
- The "MICHORO YA MUDA" / "PLACEHOLDER ART" labels on the menu and the table are gone: every picture in the game is now drawn art.

## 0.18.0 (unreleased) - The potted-ball tube
- Robert's idea (2026-10-11): a see-through glass tube beside the table, on the side away from the power bar (left edge normally, right edge in left-handed mode), joined to the table by a short pipe near the top corner pocket. Every potted ball (not the cue ball) rolls in along the pipe and drops onto the stack with a small bounce, so the tube shows the balls in the order they went down. The name trays stay as they were.
- To make room the table is about 4% smaller (539 pixels per metre instead of 560) and sits a little further right; the status line, hint, fine-aim strip and panels over the table moved with it.
- A saved game shows its potted balls in the tube straight away, in ball-number order, because the save does not record the order they were potted.
- The 8-ball game type (striped and solid balls) was discussed and dropped by Robert.

## 0.17.0 (unreleased) - Art Part B: portraits, buttons, panels, logo and the menu bar
- **Portraits** for all 12 characters, replacing the coloured circles with a letter. Simple friendly faces drawn by the game, each with something to recognise them by: Fundi's orange cap and moustache, Malkia's gold headwrap, Mwamba's bald head, Bonge's round face and grin, Shangazi's kitenge wrap and glasses, Mjanja's cap turned back and chain, Bishoo's dark glasses and white collar, Kichwa's afro and glasses, Dogo Mbishi's big cap, Mama Ntilie's red headwrap and apron, Mzee Kobe's white kofia and grey beard, Bingwa's cornrows, dark glasses and gold chain. They show on the character picker and in the player panels (a little bigger there than before).
- **Buttons** are rounded and raised, white, or gold for the current choice. **Panels** (Settings, Stats, Rules, pickers, game over) are rounded with a thin gold edge.
- **Title logo:** "BONGO" in gold letters with an 8-ball as its first O, over a red "POOL TABLE" banner.
- **Menu background:** a neighbourhood pool bar at night: a two-tone painted wall, a barred window with the moon, a cue rack, coloured string lights, a lamp glowing behind the buttons, a chalk scoreboard, a counter with a radio, and the edge of a pool table along the bottom. No drinks anywhere (Robert).
- **Potted-ball trays** show the same shaded balls as the table.
## 0.16.0 (unreleased) - A stronger computer, Impossible, and a different break every game
- Robert found Hard easy to beat (2026-10-11). Every level now aims and judges power more accurately and looks at more shots; Medium also checks its best shots hold up if slightly mishit. In 20 to 30 games each, the new level beat the old one of the same name: Easy 23/30, Medium 18/20, Hard 15/20.
- New fifth opponent: **Bingwa (Haiwezekani / Impossible)**, almost no aiming or power error and the widest search. It beat the new Hard 24/30, potting about three shots in four and fouling on 2% of its shots. Bingwa has its own catchphrases. The name is Claude's choice, for Robert to confirm.
- Stats show Bingwa too; older saves keep their stats and start Bingwa at zero.
- The opponent picker on the table is taller so five choices and Back fit.
- A different rack every game (Robert: the same full-power break always potted a ball): the reds and yellows are placed in a random order (the black stays in the middle, the back corners are always one of each), and each ball sits a hair off its exact spot, as in a real rack. In 24 identical full-power breaks this gave 14 different results, and 7 potted nothing. Saved games are unaffected: a ball's number always has the same colour.

## 0.15.0 (unreleased) - Backgrounds behind the table
- From the personalisation list Robert approved (2026-10-11). A third button, "Mandhari" / "Scenery", joins Meza and Fimbo on one menu row and opens a picker of six backgrounds, all free: **Klasiki** (the plain dark screen, as before), **Mbao** (a wall of wooden planks), **Kanga** (an indigo kanga with printed borders above and below the table), **Bahari** (the sea at night with a crescent moon and dhow sails), **Nyota** (a starry sky with acacia trees), **Makuti** (woven palm leaves, like a beach bar's roof).
- The table covers most of the screen, so each design puts its detail in the bands above and below the table and in the controls column. Those bands get a dark wash so names, status and hint stay easy to read; a unit test checks every background colour against the text colours.
- The choice is saved (`background` in `pool.progress`) and used from the next time the table opens. Older saves get Klasiki.
- Performance: the background and the table are combined into one screen-sized picture when the table opens, so the screen is still drawn once per frame. Drawing them as two pictures doubled the drawing work, which slowed the test browser's software renderer enough to time out tests; a slow phone's graphics chip would feel it too. Klasiki draws only the table, exactly as before.

## 0.14.0 (unreleased) - Left-handed mode
- From the personalisation list Robert approved (2026-10-11). Settings has a new row, "Mkono wa kuchezea" / "Playing hand": Kulia (Right, as before) or Kushoto (Left).
- Left turns the table screen into a mirror image: the spin control and power bar move to the left edge, the table and everything on it (player panels, status, hint, fine-aim strip, game over, panels over the table) moves right by the same gap, and the Menu and New game buttons swap corners. Nothing changes in how the game plays.
- The choice is saved with the pool progress (`hand`) and used from the next time the table opens. Older saves are right-handed.
- The power bar, spin control and fine-aim strip are now drawn above the cue, which can reach across them when aiming towards them (in either hand).
- Tests: a `boundsOf` test hook gives an element's box, so the tests can check that the controls, buttons and table never overlap, in both languages and with New game's wide "Gusa tena kuanza upya" label showing.

## 0.13.0 (unreleased) - Catchphrases
- Robert asked for character catchphrases in Swahili or English to match the game's language (2026-10-11). Every character, the computer's three included, has lines for three moments: potting one of theirs and playing on, the other player fouling (a friendly tease), and winning. Examples: Fundi "Kazi ya fundi hiyo!" / "That's a craftsman's work!", Mama Ntilie "Moto kama chapati!" / "Hot like a fresh chapati!", Mzee Kobe "Haraka haraka haina baraka." / "Haste brings no blessing."
- The line shows in a white speech bubble under the speaker's name, pointing at their face, for about 3 seconds.
- Not every shot gets a line: about 4 in 10 pots and 6 in 10 fouls do, then the characters stay quiet for at least two shots, and the same line is never said twice in a row. A win always gets one.
- All lines are in `config/quips.ts`, Swahili and English side by side, so they are easy to change.
- Your own name (built earlier the same day, never released) was left out at Robert's request; players use the character names.

## 0.12.0 (unreleased) - Choose your cue
- Robert's idea (2026-10-11): pick the cue too. "Fimbo" (Cue) sits next to "Meza" on one menu row and opens a picker of six cues, one to match each table, all free and looks only (every cue plays the same): **Klasiki** (wood with a black wrap), **Zanzibar** (dark wood with brass rings), **Kitenge** (a kitenge-print grip), **Maasai** (red check butt with a beaded grip), **Tingatinga** (painted colour bands with dots), **Makonde** (ebony with bone-white inlays).
- The chosen cue is saved (`cue` in `pool.progress`) and shown for every shot on this phone, the computer's included. Older saves get Klasiki.
- The table picker became a general `LookPicker`, used for tables and cues.

## 0.11.0 (unreleased) - Choose your table
- Robert asked for different tables with African and local designs (2026-10-11). A new "Meza" (Tables) button on the main menu shows a small picture of each table; tap one, then "Chagua" (Choose). Back, or the phone's back button, leaves the choice as it was.
- Six tables, all free: **Klasiki** (wood, green felt), **Zanzibar** (dark carved wood with a rope border and brass studs like the Zanzibar doors, teal felt), **Kitenge** (a kitenge print of rings and dots, blue felt), **Maasai** (red shuka check with a line of beads, slate-blue felt), **Tingatinga** (bold painted sections with dots and waves, purple felt), **Makonde** (ebony with carved zigzags, sage felt).
- Patterns are on the rails only; the felt is plain. Every new felt keeps all four balls clearly visible, also for red-green colour blindness (checked by a unit test). Classic green is the hardest felt for that, which is why red balls carry a white spot.
- The choice is saved (`table` in `pool.progress`) and used from the next time the table opens, a game in progress included. Older saves play on Klasiki.
- Only the chosen table is kept in video memory at full size; the others are freed.
- Menu buttons moved up a little so seven fit (`MENU`).
- Tests: the frame-time checks on a 6x slower CPU (titles tagged `@timing`) now run in their own `timing` project, after all other tests and one at a time. With four tests sharing four CPUs, another browser could take the CPU in the middle of a measurement window, and the "computer thinking" check failed by a fraction of a millisecond. Run alone it passed 9 out of 9.

## 0.10.1 (unreleased) - Exit button
- Robert asked for an Exit button on the main menu (2026-10-11). "Toka" / "Exit" is the last menu button and closes the game.
- With a game in progress it asks first: "Toka kwenye mchezo?" and says the game is saved and "Endelea na mchezo" brings it back (Robert chose "Keep it saved"). Back, or the phone's back button, closes the popup. With no game in progress Exit closes at once.
- Settings are saved before closing. Exit shows only in the Android app: a web page cannot close itself, so the phone-browser build has no Exit button.
- The menu buttons sit a little closer together (`MENU.firstButtonY` 225, `buttonSpacing` 78) so six fit.

## 0.10.0 (unreleased) - Milestone 9 Part A: table art
- Robert chose "Claude now, designer later" for the art (2026-10-11). This is the first of three parts: the table and its controls.
- Table: wooden rails with grain and diamond markers, a cushion strip, felt with a soft sheen and speckle, pockets with depth and cushion jaws, a shadow under the table.
- Balls are shaded with a highlight and shine, and cast a soft shadow on the felt.
- Colour-blind help: red balls carry a white spot, so red and yellow can be told apart without colour. Checked on a simulation of the two common kinds of red-green colour blindness.
- The cue is a tapered wooden cue (blue tip, white ferrule, light shaft, dark butt with a grip wrap) with a shadow, instead of a line.
- Power bar: a rounded track, a green-to-red fill and a ridged handle. Spin control: a shaded cue-ball face with a red tip marker. Fine-aim strip: a darker track with a border.
- All of it is drawn by the game when it starts (Canvas 2D textures, A24); no image files were added, so the download size is unchanged. A designer can later replace any of these with an image.

## 0.9.1 (unreleased) - No ball count next to the names
- The player panels show only the character's name. The number of balls left is gone (Robert, 2026-10-11): the tray under each name already shows it.
- Robert approved the character names.

## 0.9.0 (unreleased) - Milestone 8: characters
- Characters, for looks only (Robert, 2026-10-11): they change how a player is shown and named, never how the game plays.
- 8 characters to play as, with fun Tanzanian street nicknames (Robert: nothing vulgar; 6 men, 2 women): Fundi, Malkia, Mwamba, Bonge, Shangazi, Mjanja, Bishoo, Kichwa.
- The computer plays as one character per level: Dogo Mbishi (Easy), Mama Ntilie (Medium), Mzee Kobe (Hard). The opponent picker and Stats use these names.
- New game flow: opponent, then "Chagua mhusika" (choose your character) with last time's choice selected, then Start. Two players choose in turn ("Mchezaji 1", "Mchezaji 2") and cannot take the same character. Back and the phone's back button step back through the choices.
- The table shows each player's face and name in the player panel (the face sits inside the ball-colour chip, which now shows as a ring) and in every message ("Bonge: zamu yako", "Mzee Kobe anacheza…", "Malkia ameshinda!").
- Faces are placeholders: a coloured circle with an initial (ASSETS.md).
- Saves: the chosen characters are kept with the game in progress and remembered for the next game (`picks` in `pool.match`, `lastPicks` in `pool.progress`). Games and stats saved by older versions load as before, with the default characters.

## 0.8.1 (unreleased) - Fix: no splash screen on Android 12 and newer
- Robert saw no splash screen on his ZTE Blade A35 (Android 14). Android 12 and newer ignore the splash image and show the app icon on a background colour from the theme, which was unset. The launch theme now sets that background to the game's dark colour (`splash_background`) and the icon to the app icon. The game's web view also loads on the same colour (`backgroundColor` in `capacitor.config.ts`) instead of white. Android 11 and older still show the splash image.
- The Android splash still lasts only until the game's first frame, so on a fast start it is brief.
- Checked by Robert on his ZTE Blade A35 (Android 14), 2026-10-11.

## 0.8.0 (unreleased) - Milestone 7: release readiness
- The game is now called **Bongo Pool Table** (Robert, 2026-10-10; was "Pool ya Mtaani"). Saves are unaffected: their key prefix stays `pool`.
- Android project (Capacitor 8.5) in `packages/pool/android`: app ID `com.fardatasolutions.bongopooltable`, landscape only, full screen with the system bars hidden, version taken from `package.json`. Not built yet (B1); build steps for Robert's computer in RELEASE.md.
- Android back button: closes a panel or the picker, takes the table to the menu (not while balls roll), and on the main menu sends the app to the background. Shared `BackButton` in core, routed from the phone by the shell.
- First game: a one-time "how to play" panel (aim, power, spin, fine aim). It is not shown again once closed (`pool.tips`).
- Placeholder app icon (all densities, adaptive and round), splash screens, 512 px store icon and feature graphic, drawn by `npm run icons -w @tzg/pool`.
- Store listing, privacy policy (Kiswahili and English) and store screenshots, as drafts.
- Offline check: a browser test plays with outside network blocked and the network off.

## 0.7.1 (unreleased) - Fix: no sound on iPhone
- Sound never started on iPhone (reported by Robert). The game tried to start sound only once, when the finger first touched the screen, but iPhones only allow it when the finger lifts. It now tries on every touch (down, up, tap or key) until sound is running, and plays one silent sample inside the touch, which older iPhones need.
- If the phone takes sound away while the game is in the background (a call, another app), the next touch brings it back.

## 0.7.0 (unreleased) - Milestone 6: sound
- Sounds for the cue strike, ball on ball, ball on cushion and a ball dropping into a pocket. Loudness follows how hard the hit was; a burst of contacts (the break) is thinned to at most 4 sounds per frame and 8 playing at once.
- Placeholder sounds are synthesised by the game at start-up (no audio files); see ASSETS.md.
- Settings: Sauti (Sound) Washa / Zima, kept between sessions.
- Sound starts on the first touch, stops in the background and comes back with the game. A phone with no Web Audio, or one that refuses to start it, plays silently.
- Physics: ball and cushion contact events carry the impact speed.
- Core: `renderSound` (seeded, deterministic synth). Shell: `SoundBoard` (Web Audio), Phaser's own audio turned off.
- Panels can hold labelled rows of choices (`scenes/ui.ts`).

## 0.6.1 (unreleased) - Fix: Menu reopened Settings
- After changing the language, tapping Menu on the table opened the Settings panel instead of the main menu (reported by Robert). Phaser reuses a scene's last start data when none is given; the table now always passes it.

## 0.6.0 (unreleased) - Milestone 5: spin and fine aim
- Spin control above the power bar: drag the dot on the cue-ball face for topspin, backspin or side spin. Resets after every shot; off during the computer's turn.
- Fine-aim strip under the table: drag along it to turn the aim slowly.
- With top or back spin set, the guide hides the cue ball's path after contact (it would be wrong; TD9).
- The power bar is shorter to make room for the spin control, and the controls hint sits just under the table.

## 0.5.1 (unreleased) - Break pot decides colours
- Rule change (Robert, 2026-10-08): potting only one colour on the break gives the breaker that colour, so their tray fills straight away. Before, the table stayed open after the break and the tray stayed empty until the next pot, which looked like a bug. Potting both colours on the break still leaves the table open.
- Rules screen text updated in both languages.

## 0.5.0 (unreleased) - Milestone 4: menus, saving and stats
- Main menu when the game opens: Continue (only when a game is saved), Play, Stats, Rules, Settings.
- A Menu button on the table goes back to the menu and keeps the game.
- The game in progress is saved at the start, after every shot and when the app goes to the background. If the app is closed mid-shot, it resumes from just before that shot. A finished game is removed. A damaged save is ignored (and backed up), so the menu opens normally.
- Stats: games played and won against each computer level, and two-player games.
- The opponent picker marks the last choice (also after New game, which now has Back).
- Settings: Kiswahili or English, kept between sessions.
- Rules screen in both languages.
- Core: an unreadable save is copied to `<key>.backup` before defaults replace it (TD2).
- The placeholder label moved under the power bar to make room for the Menu button. Shared button and panel helpers (`scenes/ui.ts`).
- Shell test hooks can read the text and data of named objects (e2e builds only).

## 0.4.0 (unreleased) - Milestone 3: computer opponent
- Opponent picker when the game opens and after New game: two players on one phone, or the computer at Easy, Medium or Hard.
- Computer opponent (`src/ai`): finds pots, plain hits and escape shots, plays them out on a copy of the table with the real physics and rules, places the cue ball for ball in hand, breaks, and shoots with level-dependent aim and power error. Hard double-checks its best shots against small aiming errors.
- Computer turns are paced on screen (thinking, placing, aiming, power) and its thinking runs in small slices each frame within a time limit. The player's controls are off during its turn.
- Core: seeded random numbers (`createRandom`).
- Strength ladder command: `npm run ai:ladder -w @tzg/pool`.

## 0.3.1 (unreleased) - Potted-ball trays
- Under each player's name, a row of 7 slots fills with their colour as their balls are potted (Robert's request). Hidden while the table is open.

## 0.3.0 (unreleased) - Milestone 2: Blackball rules and pass-and-play
- Rules engine (`src/rules`): break, open table, colours, fouls with ball in hand anywhere (R1), the black (any pocket, R2), re-rack on a black potted on the break (R3), win and loss.
- Two players on one phone: player panels with colour and balls left, status line with fouls and whose turn it is, game-over panel, New game (second tap needed mid-match), breaks alternate.
- Ball in hand: drag the cue ball to free cloth; held behind the baulk line before the break.
- Aim guide now stops at pockets. Larger text for small phones. Re-rack button replaced by New game.

## 0.2.0 (unreleased) - Milestone 1: pool table and physics
- New `@tzg/pool` package: UK 7 ft table, Blackball rack, deterministic physics with skid/roll, top/back and side spin, ball and cushion collisions, pocket jaws and drops.
- Practice table: drag on the table to aim with a guide line (ghost ball and predicted paths), pull the power bar to shoot, re-rack button. Potted cue ball comes back automatically (placeholder for ball in hand).
- Shell: test probes for game state, design-to-page conversion, CPU-time-per-frame stats (e2e builds only).
- Fixed: a system touch cancel on the power bar fired a shot.
- Shared `tooling/` for Vite and Playwright setup and browser-test helpers.
- Frame-budget tests now measure CPU time per frame instead of fps in a software-rendered browser.

## 0.1.0 (unreleased) - Milestone 0: foundation
- Monorepo with `@tzg/core` (logger, events, never-throwing storage, versioned saves, Kiswahili/English translator, fixed-timestep stepper, app lifecycle, settings) and `@tzg/shell` (Phaser 4 app shell: fit-to-screen scaling, services registry, settings persistence, rotate prompt, e2e-only test hooks).
- Shell halts the game loop while the app is in the background (Phaser alone does not).
- 38 unit tests, 33 browser test runs across three screen sizes.
- No gameplay yet; the shell demo is a labelled placeholder.
