# Technical Requirements Document

## Architecture

- **Frontend:** semantic HTML, responsive CSS, and browser JavaScript ES modules. Vite provides local development and a static build.
- **Web/API server:** Node.js `server.mjs` serves only the public app files and handles `/api/assist/*`. `server.js` remains a compatibility entry point.
- **Copilot SDK:** the Node server compares bounded listing conditions with an allowlisted `search_jobs` tool.
- **Microsoft Agent Framework:** the FastAPI service uses Foundry `FoundryChatClient` to suggest a clearer posting description. The Node server proxies the request.
- **Demo persistence:** `localStorage` stores sample applications, bookmarks, and farmer-created listings; it is not shared across browsers or devices.
- **Hosting:** the Docker image runs the Node server on port `8080` and the optional Agent Framework service on loopback port `8001`. Azure App Service deployment is supported but not performed by this repository.

## Runtime configuration

Copy `.env.example` to an untracked `.env` for local use.

| Variable | Purpose |
|---|---|
| `COPILOT_GITHUB_TOKEN` | Server-side authentication for Copilot listing comparison. |
| `FOUNDRY_PROJECT_ENDPOINT` | Microsoft Foundry project endpoint. |
| `FOUNDRY_MODEL` | Foundry model deployment name. |
| `AZURE_CLIENT_ID` | Optional user-assigned managed identity client ID. |
| `PORT` | Node listener; defaults to `3001` locally and `8080` in the container. |

Use managed identity with minimum required permissions in Azure. Provider secrets must remain in environment settings and must not be committed.

## API

- `GET /api/health` reports Node process health.
- `GET /api/assist/status` reports whether provider settings are present; it does not verify connectivity.
- `POST /api/assist/match` accepts a short preference and up to ten bounded listing records.
- `POST /api/assist/posting` accepts bounded title, category, location, and description fields.
- Unknown API paths return 404; unsupported assistant methods return 405.
- Request bodies are limited to 8 KiB, validated with strict schemas, and limited to eight assistance requests per in-memory peer address per minute.
- Obvious email and phone-number patterns are rejected from AI inputs. This is not complete personal-information detection; users must not submit names or other private data.
- Provider errors return user-safe messages while retaining only diagnostic error types in server logs. Missing configuration returns 503; non-AI product flows remain usable.

## Data and privacy

- Application contact fields are stored only in local storage and are not submitted to the server. Use example data only.
- Copilot receives the preference and listing fields needed to compare work conditions; application data is never included.
- Microsoft Agent Framework receives the draft title, category, location, and description only.
- AI output is advisory and must be reviewed. It must not be treated as verified work conditions or used to fill missing date, hours, pay, or headcount.
- Authentication, durable server-side persistence, consent and retention policies, production abuse controls, and monitoring are not implemented.

## Local development and verification

```powershell
npm.cmd install
npm.cmd run dev
```

In another terminal, run the Node API/static server:

```powershell
npm.cmd start
```

Vite proxies `/api` to `127.0.0.1:3001`. To test the optional Foundry service locally, install `agent_service/requirements.txt`, set Foundry variables, authenticate through `DefaultAzureCredential`, and run:

```powershell
python -m uvicorn agent_service.main:app --host 127.0.0.1 --port 8001
```

Run `npm.cmd test` for API validation tests and `npm.cmd run build` for the static bundle.

## Azure container

Build the included image with `docker build -t ilsonieum .`. Configure the Linux App Service container port as `8080`; provide provider settings through App Service configuration and prefer managed identity for Foundry access. Confirm `/api/health` after deployment. No live Azure resource or URL is supplied by this repository.
