# Story mode plan (proposal, for Robert to approve)

Status: proposal, 2026-10-12. Nothing is built yet. Robert agreed to the idea and to the rewards
choice (trophies, titles and story-only items; everything that exists today stays free, no coins).

## What changes for the player

- **Play** on the menu becomes two buttons:
  - **Mchezo wa haraka** (Quick game): exactly today's game, unchanged.
  - **Safari ya Bingwa** (The champion's journey): story mode.
- Story mode is a journey across pool spots. Each stop is one game against one character, at one
  computer level, on a table and background that suit the place. Win to open the next stop.
- You play the whole journey as one character, chosen when you start it (changeable on the map).

## The stops

Eight stops, getting harder. Each stop's table and background are already in the game, so no new
art is needed for the stops themselves.

| # | Stop | Opponent | Level | Table / background |
|---|---|---|---|---|
| 1 | Mtaani (your street) | Dogo Mbishi | Easy | Klasiki / Mbao |
| 2 | Kariakoo | Mama Ntilie | Medium | Kitenge / Kanga |
| 3 | Sinza | Mjanja | Medium | Tingatinga / Mbao |
| 4 | Mwenge | Bonge | Hard | Makonde / Makuti |
| 5 | Bagamoyo | Shangazi | Hard | Maasai / Nyota |
| 6 | Mzee Kobe's club | Mzee Kobe | Hard | Klasiki / Klasiki |
| 7 | Zanzibar | Malkia | Impossible | Zanzibar / Bahari |
| 8 | The final: Bingwa | Bingwa | Impossible | Zanzibar / Nyota |

- Stops 3, 4, 5 and 7 use player characters as computer opponents, so you meet more of the cast.
  Their strength is still only their level. If you chose that character for yourself, a different
  one takes the stop.
- Every stop is a single game, so no new saving of match series is needed.

## Stars

Each stop gives up to three stars, kept at your best result:

- 1 star: win.
- 2 stars: win without a foul.
- 3 stars: win without a foul, with at least 3 of the opponent's balls still on the table.

You can replay any opened stop to earn more stars.

## Rewards

- **A trophy for each stop you beat,** shown on the map. Bingwa's is a gold cup.
- **Titles** shown under your name in the player panel, by total stars (24 possible):
  6 stars "Mchezaji wa Mtaa", 12 "Fundi wa Meza", 18 "Mkali wa Bongo", beat Bingwa "Bingwa wa Bongo".
- **Three story-only items**, added to the existing pickers but locked until earned:
  - a gold-trimmed table "Dhahabu" for beating Bingwa;
  - a cue "Fimbo ya Bingwa" at 18 stars;
  - a background "Usiku wa Bingwa" (the bar at night with your trophies) at all 24 stars.
- A locked item shows a padlock and what earns it. Nothing that exists today gets locked.

## Screens

1. **Map:** the eight stops on a path, each with its stars or a padlock, your character and
   title at the top, and Back to the menu.
2. **Stop card:** tap a stop to see the place, the opponent's face and level, how to earn each
   star, and **Cheza** (Play).
3. **The game:** the normal table. The status line names the stop.
4. **End panel:** stars earned this time, a new trophy or reward if any, and **Endelea**
   (next stop), **Rudia** (try again) and **Ramani** (map). Untouched, it goes back to the map
   after 10 seconds, as Quick game does with the menu.

## Saving

- A new save slot `pool.story`: stars per stop, chosen character, rewards earned. Older saves start
  with an empty journey; nothing else in the save changes.
- A story game left half-way is saved like today's, with its stop, and Continue brings it back.
- Stats keep counting results per computer level, story games included.

## How it will be tested

- Unit: stars from a finished game (each rule and its edges), opening the next stop, titles and
  rewards by star total, older saves without `pool.story`, a damaged story save.
- Browser: Quick game unchanged; first stop to a win, stars shown, next stop opened; a loss keeps
  the stop closed; a replay keeps the best stars; rewards locked and unlocked in the pickers;
  Continue on a half-finished story game; the phone's back button on every new screen; English
  and Kiswahili; three screen sizes.
- The full existing suite still passes.

## Questions for Robert

1. Name: "Safari ya Bingwa"? (Claude's pick; any name works.)
2. Eight stops with player characters as some opponents, or only the four computer characters
   (four stops)?
3. The star rules above, or simpler (one star per win)?
4. Before November 1st or as the first update? Claude suggests building it now and deciding by
   how the Play account's closed test goes.
