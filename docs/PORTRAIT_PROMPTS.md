# Character face prompts

Prompts for making the twelve character faces with an image tool (ChatGPT, Gemini, Midjourney or
similar). Each face is one picture file in `packages/pool/portraits/`, named after the character's
id (for example `fundi.png`). Swap a file and rebuild, and that face changes in the game with no
code change (and in the store feature graphic after `npm run icons -w @tzg/pool`).

## How to use them

1. Paste the **shared style** first, then one character's line, as one message. Ask for a square
   picture (in Midjourney add `--ar 1:1`).
2. Make all twelve in the same tool and, if it allows, the same conversation, so the style matches.
   If one face drifts (cartoonish, different lighting, text in the picture), ask again for that one.
3. Send the pictures back in the thread, or put them in `packages/pool/portraits/` yourself with the
   right names and run `npm run portraits -w @tzg/pool`. The script cuts each to its middle square,
   resizes it to 512 x 512 and keeps the file small; it changes nothing that is already right.
4. Check the tool's terms allow commercial use in an app you sell or show ads in. Do not ask for a
   real, recognisable person.

The game shows each face in a circle, about 76 pixels wide on the character picker and 28 pixels in
the player panel, so the face must be big, centred and clear, with a plain background.

## Shared style

> Square 1:1 portrait for a mobile pool game character. Realistic digital painting, the polished
> semi-realistic style of a premium mobile game character card: natural skin texture and real
> proportions, not a cartoon, not a photo. Head and shoulders, facing the viewer, the face centred
> and filling the middle of the frame, with space above the head so nothing touches the edges.
> Warm soft light from the upper left, gentle shadow on the right. Plain solid background in the
> colour given, no scenery, no text, no logo, no watermark, no border. Tanzanian person from Dar es
> Salaam. Friendly and full of character.

## The characters

Players choose these eight:

| File | Character | Prompt line |
|---|---|---|
| `fundi.png` | **Fundi**, the expert | A man in his forties, a skilled craftsman, with a neat black moustache and a warm confident smile. Orange work cap with a white stripe, navy work shirt with a mustard yellow collar. Background colour deep blue #2f5d8a. |
| `malkia.png` | **Malkia**, the queen | A woman in her late twenties with a regal, playful smile. Golden yellow headwrap with a plum pattern, gold hoop earrings, purple top. Background colour plum #6a2c70. |
| `mwamba.png` | **Mwamba**, the rock | A strong, broad-shouldered man in his thirties, shaved bald head, short stubble, calm steady look. Plain grey T-shirt. Background colour slate grey #4a4f55. |
| `bonge.png` | **Bonge**, the big guy | A big, heavy-set man in his thirties with a round face, short faded haircut and a wide happy grin. Red T-shirt. Background colour deep red #8a2d2d. |
| `shangazi.png` | **Shangazi**, auntie | A kind but no-nonsense woman in her fifties with thin-framed reading glasses and a knowing smile. Orange and blue kitenge headwrap, silver earrings, green top. Background colour forest green #2e6b3a. |
| `mjanja.png` | **Mjanja**, the clever one | A street-smart young man in his twenties with a sly smirk. Dark navy cap worn backwards with a red detail, thin gold chain, black T-shirt. Background colour dark indigo #3b3b58. |
| `bishoo.png` | **Bishoo**, the sharp dresser | A stylish young man in his late twenties with a sharp fade haircut, short goatee and dark sunglasses, a cool smirk. Dark blue-grey shirt with a crisp white collar. Background colour teal #1f6f78. |
| `kichwa.png` | **Kichwa**, the brain | A thoughtful university student in his twenties with a tall rounded afro and round clear glasses, calm and focused. Blue shirt. Background colour steel blue #3d5a80. |

The computer plays as these four, one per level:

| File | Character | Prompt line |
|---|---|---|
| `dogo-mbishi.png` | **Dogo Mbishi**, easy level | A cheeky, stubborn teenage boy of about fifteen with a defiant little pout. Blue baseball cap with a white detail, bright yellow T-shirt. Background colour mustard #c48a00. |
| `mama-ntilie.png` | **Mama Ntilie**, medium level | A cheerful, round-faced woman in her forties who sells street food, with a big laughing smile. Red headwrap with yellow dots, gold earrings, red top under a white apron. Background colour raspberry #9c3d54. |
| `mzee-kobe.png` | **Mzee Kobe**, hard level | A wise old man in his seventies with a full short grey beard, grey hair at the sides and round glasses, a calm patient look. White embroidered kofia cap with gold stitching, brown shirt. Background colour stone grey #5f6b73. |
| `bingwa.png` | **Bingwa**, impossible level | The champion of the street pool tables, a man in his mid thirties with neat cornrows, a short goatee, dark sunglasses and a confident smirk. Gold chain, black shirt with a gold collar. Background colour dark gold #7a5c12. |

## Story rivals (Safari ya Bingwa, chapters 2 and 3)

Ten more faces, for rivals met only in story mode. They are from other parts of Tanzania, so in the
shared style replace "from Dar es Salaam" with the place given. If the tool makes one sheet, ask for
a 5 x 2 grid in this order, left to right, top row first (the same way as the first twelve).

Chapter 2, Kaskazini (the north):

| File | Character | Prompt line |
|---|---|---|
| `kaka-tunda.png` | **Kaka Tunda**, the fruit seller (Morogoro) | A cheerful young man in his twenties who sells fruit at the market, with a bright open smile and short hair. Green and white striped T-shirt. Background colour lime green #5a7d1e. |
| `bwana-shamba.png` | **Bwana Shamba**, the farm officer (Dodoma) | A serious but friendly man in his forties, a farm extension officer, with a neat short beard and a wide-brimmed khaki bush hat. Khaki shirt with pockets. Background colour sand #9a7b4f. |
| `mama-pweza.png` | **Mama Pweza**, the seafood cook (Tanga) | A lively woman in her forties who sells grilled octopus by the sea, with a confident laugh. Turquoise headwrap with white waves, small gold earrings, white top. Background colour sea blue #1d6a8a. |
| `kahawa.png` | **Kahawa**, the coffee farmer (Moshi) | A calm young man in his thirties from the slopes of Kilimanjaro, short neat hair and a small smile. Warm brown knitted jumper over a collared shirt. Background colour coffee brown #5b3a29. |
| `mzee-simba.png` | **Mzee Simba**, the north's champion (Arusha) | A proud, strong man in his fifties with short grey-black hair, a trimmed grey beard and a fierce but fair look. Dark red and black checked shuka cloth over one shoulder. Background colour dark red #6e1f1f. |

Chapter 3, Magharibi hadi Visiwani (west and south to the islands):

| File | Character | Prompt line |
|---|---|---|
| `sato.png` | **Sato**, the fisherman (Mwanza) | A lean, sun-weathered man in his thirties who fishes on Lake Victoria, with a relaxed grin and short hair. Faded blue T-shirt. Background colour lake blue #2b5c7a. |
| `dada-ndizi.png` | **Dada Ndizi**, the banana trader (Bukoba) | A bright, quick-witted woman in her twenties with short natural hair and a warm smile. Yellow and green patterned top, small wooden bead earrings. Background colour leaf green #3f6b2a. |
| `kapteni.png` | **Kapteni**, the boat captain (Kigoma) | A tough, cheerful man in his fifties who runs a lake boat, with a short white beard and laughing eyes. White captain's cap with a black peak, navy jacket. Background colour navy #24324f. |
| `baridi.png` | **Baridi**, the cool one (Mbeya) | A relaxed young man in his twenties from the cold highlands, with a calm half smile. Grey woolly beanie and a thick dark green scarf. Background colour cold grey-blue #4d5d6b. |
| `mzee-karafuu.png` | **Mzee Karafuu**, the clove grower (Pemba) | A gentle, wise man in his sixties with a short white beard and a quiet smile. White embroidered kofia and a white kanzu. Background colour clove brown #6b3f2a. |
