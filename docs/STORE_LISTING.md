# Google Play store listing (draft)

Status: **draft, not submitted.** The Kiswahili text has not been reviewed by a native speaker (KNOWN_ISSUES U3). Everything marked **Robert** needs his input or his Play Console account.

## App details

| Field | Value |
|---|---|
| App name (max 30) | Bongo Pool Table |
| App ID | `com.fardatasolutions.bongopooltable` (chosen by Robert 2026-10-10; can never change after the first upload) |
| Default language | Kiswahili (sw). English (en-US) added as a translation. |
| App or game | Game |
| Category | Sports |
| Tags (pick up to 5 in Play Console) | Pool, Billiards, Offline, Two-player, Casual |
| Free or paid | Free. No ads and no purchases in this version. |
| Contact email | **Robert** (a support address players can write to; shown publicly) |
| Privacy policy URL | **Robert**: host `docs/PRIVACY_POLICY.md` on a public page (for example GitHub Pages or Google Sites) and paste the link. |

## Short description (max 80 characters)
- **sw:** Pool ya bar mfukoni mwako: cheza na rafiki au kompyuta, bila intaneti. (70)
- **en:** Bar pool in your pocket: play a friend or the computer, no internet needed. (75)

## Full description (max 4000 characters)

### Kiswahili
Bongo Pool Table ni pool ya bar kama unavyoicheza mtaani, sasa kwenye simu yako.

• Cheza na rafiki kwenye simu moja, au na kompyuta: Rahisi, Wastani au Ngumu.
• Sheria za Blackball: mipira 7 myekundu, 7 ya njano na mweusi. Faulo inampa mpinzani mpira mkononi.
• Lenga kwa kidole, vuta kipimo cha nguvu, weka mzunguko wa juu, chini au pembeni.
• Hakuna intaneti inayohitajika. Mchezo unacheza popote, hata bila bando.
• Mchezo wako unahifadhiwa: funga programu na uendelee baadaye.
• Kiswahili au Kiingereza.
• Hakuna matangazo, hakuna malipo ndani ya mchezo, na hakuna taarifa zako zinazokusanywa.

Imetengenezwa kwa simu za kawaida za Android.

### English
Bongo Pool Table is bar pool the way it's played in the neighbourhood, now on your phone.

• Play a friend on one phone, or the computer at Easy, Medium or Hard.
• Blackball rules: 7 reds, 7 yellows and the black. A foul gives your opponent ball in hand.
• Aim with your finger, pull the power bar, add top, back or side spin.
• No internet needed. Play anywhere, even without data.
• Your game is saved: close the app and carry on later.
• Kiswahili or English.
• No ads, no in-app purchases, and none of your data is collected.

Made for everyday Android phones.

## Graphics

| Asset | Requirement | File | Status |
|---|---|---|---|
| App icon | 512x512 PNG, 32-bit | `packages/pool/store/icon-512.png` | Placeholder (ASSETS.md) |
| Feature graphic | 1024x500 PNG or JPG | `packages/pool/store/feature-graphic-1024x500.png` | Placeholder |
| Phone screenshots | 2 to 8, 16:9, 320 to 3840 px per side | `packages/pool/store/screenshots/1-menu.png` … `4-match.png` (1920x1080) | Taken from the game with placeholder art; retake after the art pass |

The icon and feature graphic are drawn by `npm run icons -w @tzg/pool`.

## Content rating (IARC questionnaire): expected answers
- Violence, fear, sexual content, crude language, drugs: none.
- Gambling: no real or simulated gambling (no betting, no coins).
- Alcohol: none shown. The game is set "in the neighbourhood"; the menu art for a bar (backlog) must not show drinks if we want to keep this answer.
- Players can talk to each other or share content: no.
- Shares the player's location: no. Digital purchases: no.
- Expected result: rated for everyone (IARC 3+). The final rating is whatever the questionnaire gives.

## Target audience
Recommended: **13 and over**. Choosing ages under 13 brings in Google's Families policy (extra review and rules). The game would likely pass, but it adds work before the first release. **Robert** decides.

## Data safety form: answers for this version
- Does the app collect or share any of the required user data types? **No.**
- Saved games, stats and settings stay on the phone (Android app storage) and are never sent anywhere. Android's own backup may copy them to the player's Google account; that is Android's backup, not ours, and is not "collection" under Play's definition.
- No account, no ads, no analytics, no crash reporting, no network requests (checked by the offline browser test).
- Data encrypted in transit: not applicable (nothing is sent).
- Deletion: clearing the app's data or uninstalling removes everything.

If ads, analytics or online play are added later, this form and the privacy policy must change before that release.

## Release tracks
1. Internal testing (up to 100 testers by email) for the first device builds.
2. Closed testing: new personal developer accounts must run a closed test with at least 12 testers for 14 days before production. **Robert**: check the current rule for your account type in Play Console.
3. Production.
