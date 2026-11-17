# AI Video Cost Calculator (ai-video-cost-calculator)

## 1. In one sentence

How much does one AI comic-drama episode really cost: enter the script (length, shots, style, episode count) and compare model, batch-pipeline, outsourcing, and code-rendering costs in one table.

Live demo: to be filled in after deployment (GitHub Pages).

## 2. The problem it solves

AI video pricing is scattered and inconsistent: models charge per second, studios quote per episode, bulk orders have minimums, and code rendering claims zero cost but takes time. Planning 10 comic-drama episodes without comparing means often picking the most expensive route by gut feel. This tool puts the four routes side by side for the same script: what each model costs, what a batch pipeline costs, what outsourcing costs, and what code rendering costs, so the price gap is visible at a glance.

## 3. Input sources and coverage

- Script parameters (user input): episode count, shots per episode, seconds per shot, style, regeneration rate, exchange rate, QC minutes, hourly rate, code-render time.
- Model price table (src/lib/pricing.ts): 24 rows, verified against official pricing pages on 2026-11-18. Sora 2 is discontinued (current price removed); 6 Veo 3 rows bill per count (the official page does not say how many seconds 1 count is, so they are not converted to costs and do not join the comparison); 4 Kling 2.5 Turbo rows bill in Units per second (converted to USD at the Standard Package rate of USD 500 / 3250 Units); 4 Jimeng rows are split by membership tier (CNY per second); Hailuo 02 is listed as a historical model (tiered prices in its note, no single unit price); the current flagship MiniMax-H3 2K is CNY 0.80 per second; Runway Gen-4, Pika 2.5, Pika H3 Flex, and 4 Luma Ray 3.2 tiers bill in credits per generation (conversion basis recorded in the table). Any cost that went through a conversion is labeled as converted.
- Comic-drama outsourcing market prices (src/lib/pricing.ts): CNY 300-800 per episode, CNY 280 per episode for orders of 100+, sourced from 2026-11-17 research (Xiaohongshu and industry articles), status reference, not official pricing.
- Suggested regeneration rates by style: realistic 25%, animation 20%, comic-drama 35%. These are editable assumed defaults, not measured data.

## 4. Calculation rules

### 4.1 Totals

Total shots = episodes x shots per episode; total seconds = total shots x seconds per shot.

### 4.2 Direct model cost

Per-second models: direct cost = total seconds x unit price, times the exchange rate only for USD prices. Per-video models: direct cost = total shots x unit price, times the exchange rate only for USD prices. Units-per-second models (Kling 2.5 Turbo): Units are first converted to USD per second at the package rate (1 Unit = USD 0.15386), then priced per second; the result is labeled converted. Credits-per-generation models (Runway Gen-4, Pika, Luma): generations = total shots x ceil(seconds per shot / seconds per generation), rounding a partial generation up to one (assumption); cost = generations x credits per generation x USD per credit x exchange rate, labeled converted. Per-count models (Veo 3) are not converted to costs and do not join the comparison; discontinued models do not join either. Amounts are rounded to two decimals.

### 4.3 Expected cost with regeneration

Expected cost = direct cost x (1 + regeneration rate). The rate defaults to the style suggestion (35% for comic-drama) and is editable on the page, range 0 to 5.

### 4.4 Batch pipeline cost

Pipeline cost = expected cost + episodes x (QC minutes / 60) x hourly rate. With QC and hourly rate at 0, pipeline cost equals expected cost.

### 4.5 Outsourcing market prices

Single-episode rate: CNY 300-800 per episode x episode count. Bulk rate: CNY 280 per episode for orders of 100+, not applicable below 100 episodes. Savings = outsourcing price minus the cheapest model's expected cost, computed against both the low and high ends.

### 4.6 Code rendering cost

Direct cost is always 0 (local headless Chromium rendering plus ffmpeg, no API calls). Local render time = total seconds x render seconds per video second / 60 (minutes); the default is 6 seconds of compute per 1 second of video (about 0.2 seconds per frame at 30fps). Labor cost = render time (hours) x hourly rate; not counted when the hourly rate is 0.

### 4.7 Worked example (Scenario A: 10 comic-drama episodes, 5 shots each, 5 seconds per shot, 35% regeneration, rate 7.1)

250 seconds total, 50 shots. Cheapest is Luma Ray 3.2 360p at CNY 28.76 expected (direct CNY 21.30, converted); note this is the lowest resolution tier. Jimeng Super Flash is CNY 70.88, Kling 2.5 Turbo no-audio 720p is CNY 110.61 (converted), MiniMax-H3 2K is CNY 270.00. The cheapest model saves CNY 2971.24 against the outsourcing low price and CNY 7971.24 against the high price. Code rendering costs CNY 0 directly and takes 25 minutes. Scenario B (100 episodes): cheapest is still Luma Ray 3.2 360p at CNY 287.55, bulk outsourcing CNY 28000, code rendering 250 minutes. These numbers are locked by test assertions, see src/lib/costcalc.test.ts.

## 5. How to use it

Open the page, pick a sample scenario (10-episode small batch, 100-episode bulk, 1-episode test), then edit the script parameters: episode count, shots, seconds per shot, style, regeneration rate, exchange rate, QC time, hourly rate. Edit model prices directly in the table; results recompute live. Read the three cards (total footage, cheapest model, code rendering), then the model cost table, the outsourcing comparison, and the code-rendering comparison. Per-count and discontinued models do not join the comparison and their price fields cannot be edited.

## 6. Run it locally

```bash
npm install
npm test       # Vitest
npm run build  # tsc + vite build
npm run lint   # oxlint
npm run dev    # local dev server
```

## 7. Updating the data

When a model price changes, edit MODEL_PRICES in src/lib/pricing.ts: change price (native unit price), unit (billing unit), currency, secondsPerGeneration (seconds per generation for per-generation billing), usdPerNativeUnit and conversionBasis (conversion rate and basis), status, verifiedDate, and source (official pricing page link). When outsourcing prices change, edit MARKET_QUOTES with source and verification date. Edit STYLE_RETRY_SUGGESTIONS for style regeneration rates. Run the tests after any change; if the worked example numbers change, update README section 4.7 and the test assertions together.

## 8. Determinism

100% deterministic, zero LLM calls. Computed by code: total seconds, total shots, the four cost kinds, savings, sorting, code-render time. Looked up from tables: model prices, outsourcing prices, suggested regeneration rates. Entered by the user: script parameters, exchange rate, QC time, hourly rate, render time. Same input gives the same output, asserted by a determinism test. Nothing is uploaded; all input stays in the browser and is computed locally.

## 9. Compliance boundary

- No stocks, no crypto, no custody of funds; no purchasing, no ordering, no paying on behalf of anyone.
- Prices are decision references only: model prices were verified against official pricing pages on 2026-11-18, outsourcing prices are quoted from industry articles, and exchange rate and regeneration rate are assumptions. Rounding a partial generation up to one is an assumption, not an official rule.
- No invented data: prices without a source are left blank and marked unverified; defaults without measured evidence are labeled as assumptions; conversion relationships the official page does not give (such as how many seconds 1 count is) are never assumed.

## 10. Limitations and next steps

- Billing units are inconsistent: Veo 3 bills per count and the official page does not say how many seconds 1 count is, so those 6 rows do not join the cost comparison; Sora 2 is discontinued; Hailuo 02 has no single unit price (tiered prices are in its note).
- Conversions depend on package prices: Kling converts at the Standard Package rate (USD 500 / 3250 Units), Pika at the one-time top-up rate (60 credits = USD 1), Luma at the Plus plan rate (USD 30 / 10000 credits), Runway at the Unlimited plan rate (USD 95 / 9500 credits); buying credits under another plan changes the actual cost.
- Per-generation conversion carries an assumption: a partial generation is rounded up to one, which is not officially confirmed; monthly plans and free quotas are not modeled; worst-case whole-episode failures are not modeled.
- Regeneration rate and render time are assumed defaults, not calibrated by measurement; the 35% comic-drama suggestion is only a starting value.
- The exchange rate is a manually entered assumption, not a live rate.
- Next steps: run 3-5 real scripts and record how the estimates compare with actual bills in the README; update the table per section 7 when official prices change.
