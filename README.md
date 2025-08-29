# QA Testing Agent (Vite React + Express + OpenAI + Playwright)

A minimal full‑stack starter that lets you:
- Pick a project card (Lavinia / passagePrep / teaching channel)
- Choose a test type: exploratory / smoke / regression / feature
- Provide a URL or upload a screenshot
- Backend plans a test with OpenAI Responses API, records a session with Playwright, then generates an HTML report
- Notifies via Slack (webhook) and Email (SMTP), and serves artifacts (screenshots + video) over HTTP

> ⚠️ **API keys**: Never hardcode your OpenAI key. Use environment variables. If you pasted a key into chat, rotate it in the OpenAI dashboard immediately.

## Quick start

### 1) Backend

```bash
cd backend
cp .env.example .env
# edit .env with your values (OPENAI_API_KEY, SLACK_WEBHOOK_URL, SMTP creds)
npm i
npm run playwright:install
npm run dev
```

This serves:
- `POST /api/test-runs` to start a run (multipart form with fields described below)
- `GET  /artifacts/...` to access saved screenshots, videos, and `report.html`

### 2) Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_BASE to your backend (e.g. http://localhost:8787)
npm i
npm run dev
```

### Request payload (from the UI)

`POST /api/test-runs` (multipart/form-data)
- `projectId` (string) one of `lavinia|passagePrep|teachingChannel`
- `projectName` (string) friendly name
- `testType` (string) `exploratory|smoke|regression|feature`
- `targetKind` (string) `url|screenshot`
- `url` (string) if `targetKind=url`
- `screenshot` (file) if `targetKind=screenshot`

### Notes

- The test runner uses Playwright to **record a video** and **capture screenshots** of each planned step.
- In this starter, steps are passive (we only snapshot). Extend `runBrowserAndRecord()` to parse actions from the AI plan and interact with the page (click, type, etc.).
- Slack notifications use an **Incoming Webhook** URL (set `SLACK_WEBHOOK_URL`).
- Email uses Nodemailer with SMTP; set `MAIL_TO`, `MAIL_FROM`, and SMTP variables.
- Artifacts live under `backend/artifacts/{runId}/` and are served under `http://localhost:8787/artifacts/...`

## Security

- Keep `OPENAI_API_KEY`, SMTP, and Slack webhook in `.env` only.
- Rotate any keys that were shared in plaintext.

## License

MIT (starter template)
