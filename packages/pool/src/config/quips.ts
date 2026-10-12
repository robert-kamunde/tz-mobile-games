import type { StringTables } from '@tzg/core';

/**
 * Catchphrases (Robert, 2026-10-11): each character says a short line in a speech bubble at a few
 * moments, in the game's language. Looks and fun only; they never change play. Kiswahili not yet
 * checked by a native speaker (KNOWN_ISSUES U3).
 */

/** When a character speaks: potted one of theirs and plays on, the other player fouled, or won. */
export const QUIP_MOMENTS = ['pot', 'foul', 'win'] as const;
export type QuipMoment = (typeof QUIP_MOMENTS)[number];

export const QUIPS = {
  /** Chance of a line at each moment, so pots and fouls do not get a line every time. */
  chance: { pot: 0.4, foul: 0.6, win: 1 } satisfies Record<QuipMoment, number>,
  /** Shots that must pass after a line before another pot or foul line (a win always speaks). */
  quietShots: 2,
  /** How long the bubble stays up. */
  showMs: 2800,
  /** Longest line in characters, so every bubble fits beside the status line on a small phone. */
  maxLength: 34,
  /** Mixed into the match's seed so lines do not follow the computer's aiming error. */
  seedSalt: 0x9e3779b9,
} as const;

/** [Kiswahili, English] */
type Line = readonly [string, string];
type CharacterLines = Readonly<Record<QuipMoment, readonly Line[]>>;

/** Lines per character id (config/characters.ts). Foul lines tease the player who fouled. */
export const QUIP_LINES: Readonly<Record<string, CharacterLines>> = {
  fundi: {
    pot: [['Kazi ya fundi hiyo!', "That's a craftsman's work!"], ['Fundi hakosei.', 'A fundi never misses.']],
    foul: [['Pole, fundi atakufundisha.', 'Sorry, the fundi will teach you.']],
    win: [['Kazi imekamilika!', 'Job done!']],
  },
  malkia: {
    pot: [['Malkia anatawala meza!', 'The queen rules this table!'], ['Tazama na ujifunze.', 'Watch and learn.']],
    foul: [['Umeteleza, eeh?', 'Slipped up, did you?']],
    win: [['Taji ni langu!', 'The crown is mine!']],
  },
  mwamba: {
    pot: [['Mwamba haubabaiki!', "The rock doesn't shake!"], ['Imara kama mwamba.', 'Solid as a rock.']],
    foul: [['Umegonga mwamba!', 'You hit a rock!']],
    win: [['Mwamba bado umesimama!', 'The rock still stands!']],
  },
  bonge: {
    pot: [['Bonge la shoti!', 'What a huge shot!'], ['Hiyo ni bonge la kazi.', "That's big work."]],
    foul: [['Umejikwaa, mshkaji!', 'You tripped up, mate!']],
    win: [['Bonge la ushindi!', 'A massive win!']],
  },
  shangazi: {
    pot: [['Shangazi bado yupo!', "Auntie's still got it!"], ['Jifunze kwa shangazi.', 'Learn from Auntie.']],
    foul: [['Pole sana, mwanangu.', 'Oh dear, my child.']],
    win: [['Shangazi ameshinda, kaa chini!', 'Auntie wins, sit down!']],
  },
  mjanja: {
    pot: [['Ujanja mtupu!', 'Pure cleverness!'], ['Akili nyingi, nguvu kidogo.', 'More brains than muscle.']],
    foul: [['Umeingia mtegoni!', 'You walked into the trap!']],
    win: [['Mjanja ameshinda tena!', 'The clever one wins again!']],
  },
  bishoo: {
    pot: [['Kwa staili, bila jasho!', 'With style, no sweat!'], ['Safi sana!', 'So clean!']],
    foul: [['Hiyo haikuwa na staili.', 'That had no style.']],
    win: [['Staili na ushindi!', 'Style and victory!']],
  },
  kichwa: {
    pot: [['Kichwa kimefanya kazi!', 'The head did the work!'], ['Hesabu sahihi.', 'All calculated.']],
    foul: [['Tumia kichwa, ndugu!', 'Use your head, friend!']],
    win: [['Kichwa kimeshinda!', 'Brains win!']],
  },
  'dogo-mbishi': {
    pot: [['Nilisema naweza!', 'Told you I can!'], ['Dogo yupo kazini!', "The kid's on the job!"]],
    foul: [['Hahaa, umekosea!', 'Haha, you messed up!']],
    win: [['Dogo amewachapa wakubwa!', 'The kid beat the grown-ups!']],
  },
  'mama-ntilie': {
    pot: [['Moto kama chapati!', 'Hot like a fresh chapati!'], ['Hiyo ni tamu!', "Now that's tasty!"]],
    foul: [['Umeunguza wali, mwanangu.', 'You burnt the rice, dear.']],
    win: [['Haya, chakula tayari!', 'Right, dinner is served!']],
  },
  bingwa: {
    pot: [['Bingwa hakosei!', 'The champion never misses!'], ['Hii ni kazi ndogo.', 'This is easy work.']],
    foul: [['Asante kwa zawadi!', 'Thanks for the gift!']],
    win: [['Bingwa ni bingwa!', 'A champion is a champion!']],
  },
  'kaka-tunda': {
    pot: [['Tamu kama embe!', 'Sweet as a mango!'], ['Matunda ya kazi!', 'The fruit of hard work!']],
    foul: [['Umeiva mapema, eeh?', 'Ripe too soon, eh?']],
    win: [['Soko limefungwa!', 'Market closed!']],
  },
  'bwana-shamba': {
    pot: [['Mavuno mazuri!', 'A good harvest!'], ['Panda, vuna!', 'Plant it, reap it!']],
    foul: [['Shamba lako lina magugu.', 'Your field has weeds.']],
    win: [['Msimu ni wangu!', 'The season is mine!']],
  },
  'mama-pweza': {
    pot: [['Pweza amekamatwa!', 'Octopus caught!'], ['Moto kama mkaa!', 'Hot as charcoal!']],
    foul: [['Umeteleza kama pweza!', 'Slippery as an octopus!']],
    win: [['Chakula kiko tayari!', 'Dinner is served!']],
  },
  kahawa: {
    pot: [['Kali kama kahawa!', 'Strong as coffee!'], ['Taratibu, mlimani.', 'Steady, on the mountain.']],
    foul: [['Umepoa kama kahawa ya jana.', "Cold as yesterday's coffee."]],
    win: [['Kikombe ni changu!', 'The cup is mine!']],
  },
  'mzee-simba': {
    pot: [['Simba ananguruma!', 'The lion roars!'], ['Mfalme wa kaskazini.', 'King of the north.']],
    foul: [['Umemwamsha simba.', 'You woke the lion.']],
    win: [['Simba hashindwi nyumbani!', 'A lion never loses at home!']],
  },
  sato: {
    pot: [['Samaki ndani ya nyavu!', 'Fish in the net!'], ['Ziwa ni langu.', 'The lake is mine.']],
    foul: [['Ndoano tupu!', 'Empty hook!']],
    win: [['Mtego umefanikiwa!', 'A full catch!']],
  },
  'dada-ndizi': {
    pot: [['Ndizi moja, mbili!', 'One banana, two!'], ['Tamu sana!', 'So sweet!']],
    foul: [['Umeteleza kwenye ganda!', 'Slipped on a peel!']],
    win: [['Mkungu mzima!', 'The whole bunch!']],
  },
  kapteni: {
    pot: [['Bandari salama!', 'Safe harbour!'], ['Mbele kwa kasi!', 'Full speed ahead!']],
    foul: [['Meli yako inazama!', 'Your ship is sinking!']],
    win: [['Nahodha anashinda!', 'The captain wins!']],
  },
  baridi: {
    pot: [['Poa tu.', 'Just cool.'], ['Baridi kama barafu.', 'Cold as ice.']],
    foul: [['Umeganda, kaka?', 'Frozen up, bro?']],
    win: [['Mbeya baridi, mimi moto!', 'Cold Mbeya, hot me!']],
  },
  'mzee-karafuu': {
    pot: [['Harufu ya ushindi!', 'The smell of victory!'], ['Polepole, mwanangu.', 'Gently, my child.']],
    foul: [['Subira huvuta heri.', 'Patience brings good things.']],
    win: [['Karafuu ya Pemba!', 'Pemba cloves!']],
  },
  'mzee-kobe': {
    pot: [['Polepole ndio mwendo.', 'Slowly does it.'], ['Uzoefu, kijana.', 'Experience, young one.']],
    foul: [['Haraka haraka haina baraka.', 'Haste brings no blessing.']],
    win: [['Kobe hufika mwisho.', 'The tortoise gets there.']],
  },
};

/** String key of one line: `quip.<character>.<moment>.<n>`. */
export function quipKey(characterId: string, moment: QuipMoment, index: number): string {
  return `quip.${characterId}.${moment}.${index}`;
}

/** All lines as string tables, merged into the pool strings. */
export function quipStrings(): StringTables {
  const sw: Record<string, string> = {};
  const en: Record<string, string> = {};
  for (const [id, lines] of Object.entries(QUIP_LINES)) {
    for (const moment of QUIP_MOMENTS) {
      lines[moment].forEach(([swLine, enLine], i) => {
        sw[quipKey(id, moment, i)] = swLine;
        en[quipKey(id, moment, i)] = enLine;
      });
    }
  }
  return { sw, en };
}
