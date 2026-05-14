# Indian Bank — Voice Intent Engine Demo

A bulletproof, **fully client-side simulation** of the Universal Intent Engine
running over an Indian Bank–style mobile UI. No backend, no LLM keys, no STT
dependency — every flow is driven by a deterministic in-browser engine, so
nothing can break in front of clients.

## Run it

```bash
cd client
npm install     # only the first time
npm run dev
```

Open <http://127.0.0.1:5173/> in any modern browser.

> Voice is **optional** — every interaction also works via typing in the
> input bar **and** via the floating **Demo control** panel on the right.

### Speech-to-Text backends

Two STT backends are wired up. Pick one with a single env flag.

| Backend                         | Pros                                                                | Trigger                                                                        |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Web Speech API** (default when unset) | Zero extra setup, no API key; browser does STT. | Omit flag or set `client/.env` → `VITE_USE_ELEVENLABS_STT=false`. Best in **Chrome / Edge** (limited elsewhere). |
| **ElevenLabs Scribe** (opt-in)   | Same model across browsers; server holds the key.                    | `client/.env` → `VITE_USE_ELEVENLABS_STT=true` + root `.env` → `ELEVENLABS_API_KEY=…`, `ELEVENLABS_STT_MODEL=scribe_v2` |

The ElevenLabs path is a small proxy: the browser captures audio with
`MediaRecorder` + a 1.5 s VAD silence-stop, POSTs the blob to
`POST /api/stt` on the Express server, which forwards it as
`multipart/form-data` to `https://api.elevenlabs.io/v1/speech-to-text`
with `model_id=$ELEVENLABS_STT_MODEL`. The API key never reaches the
client bundle. Hit `GET /api/health` to verify the model is wired up.

### OpenAI (intent extraction)

Spoken or typed lines like “send 500 to Rahul” are parsed on the **server** with **`OPENAI_API_KEY`** (repo **root** `.env`, loaded by `server/index.js`). Run the full stack from the repo root: **`npm run dev`** (starts API + Vite). If the key is missing or invalid, turns will not extract slots; the assistant will say the model is unavailable instead of looping on “didn’t catch that.”

## What the demo proves

Three end-to-end flows, each with full edge-case coverage:

| Flow                  | Trigger examples                              |
| --------------------- | --------------------------------------------- |
| UPI Transaction       | "Pay <contact> 500", "Send 1000 to <contact>" |
| Internal Transfer     | "Transfer 2000 from savings to current"       |
| Bill Payment          | "Pay electricity bill", "Recharge <operator>" |
| (Bonus) Check Balance | "What's my balance"                           |

For every flow the engine handles:

- **Missing parameters** — engine asks for whatever's missing (`ASK` event)
- **Ambiguous parameters** — multiple matching contacts → list / picker
  (`DISAMBIGUATE` event)
- **Multiple sub-options** — contact has multiple UPI handles → second-level
  picker (`CHOOSE` event)
- **Invalid amount** — zero, negative, non-numeric, over per-transaction limit
- **Unknown recipient / biller** — graceful "not found" + retry
- **Insufficient balance** — graceful failure with explanation
- **Same source = destination** — internal transfer guard
- **Cancellation at any step** — say "cancel", "nahi", "stop", "rd"
- **Bank decline / network error** — toggle on the demo panel before executing
- **Multi-lingual** — English, हिंदी, తెలుగు, தமிழ் (UI + bot replies + name resolution)
- **Gibberish** — engine never crashes; falls back to "didn't catch that"

## How to demo (2-minute script)

> The Demo control panel deliberately keeps **no contact, biller, or city
> names** baked into any clickable prompt. You speak (or type) every entity
> live, so name resolution, disambiguation, and multi-VPA pickers are all
> exercised end-to-end with real input — nothing is ever pre-filled.

1. **Open the app**, point at the Indian Bank home screen + balance card.
2. Click the **Demo control** panel (top-right) → tab "UPI · intents" → click
   `just say "pay"`. The engine asks for the recipient. Speak/type the name of
   any contact — try a name with multiple matches to trigger the
   disambiguation list, then pick a contact whose card has multiple UPI
   handles to trigger the multi-VPA picker. Finish on the confirm card and
   tap Confirm — confetti.
3. Same tab → `send 500 (no recipient)` to show the engine asking for the
   recipient with the amount already filled.
4. Switch tab to "UPI · invalid amount". After you've reached an amount-prompt
   in any flow, click `amount: 0`, `amount: -500`, `amount: 5 lakh`,
   `amount: "abc"` back-to-back. Engine rejects each gracefully and re-asks.
5. Switch to "Internal transfer" → `transfer 2000 from savings to current`,
   then `transfer 500 same account` (engine refuses).
6. Switch to "Bill payment" → `just say "pay bill"` (engine asks which bill),
   then `pay electricity bill (category)` to show category disambiguation.
7. Switch to "Multi-lingual" → click any Hindi/Telugu/Tamil script. Watch the
   UI and bot reply switch language automatically, then continue the flow by
   speaking the recipient name in that language.
8. In the panel, set the next-execution mode to **Bank decline** → run any
   payment. Show the failure card with retry. Hit Retry → success.
9. Click **↺** in the panel to reset balances at any time.

## Architecture

The whole engine lives in `client/src/engine/` and matches the master plan's
hybrid model:

```
src/
├── engine/
│   ├── simEngine.js   # state machine + dialogue event emitter
│   └── nlu.js         # multilingual pattern-based intent extraction
├── data/mock.js       # contacts, accounts, billers
├── i18n/strings.js    # UI strings + bot replies in 4 languages
├── components/
│   ├── PhoneFrame.jsx
│   ├── HomeScreen.jsx
│   ├── VoiceModal.jsx     # ASK / DISAMBIGUATE / CHOOSE rendering
│   ├── ConfirmCard.jsx    # CONFIRM event rendering
│   ├── ResultCard.jsx     # RESULT / CANCEL event rendering
│   └── DemoPanel.jsx      # scripted scenario launcher
└── hooks/useSpeech.js     # optional Web Speech API wrapper
```

The engine emits the same six dialogue events from the master plan
(`ASK`, `DISAMBIGUATE`, `CHOOSE`, `CONFIRM`, `RESULT`, `CANCEL`). The UI
components are pure renderers — same protocol, any surface.
