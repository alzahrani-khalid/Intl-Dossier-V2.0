# AnythingLLM Setup Guide

> **Access URL**: http://localhost:3001

## Current Configuration (Auto-configured)

| Setting          | Value                    |
| ---------------- | ------------------------ |
| Admin User       | `admin`                  |
| Admin Password   | `itisme123`              |
| LLM Provider     | OpenAI                   |
| LLM Model        | `gpt-4o`                 |
| Embedding Engine | OpenAI                   |
| Embedding Model  | `text-embedding-3-small` |
| Workspace        | `intl-dossier`           |

## One Manual Step Required

**Generate API Key for Backend:**

1. Open http://localhost:3001
2. Login with `admin` / `itisme123`
3. Go to **Settings (gear icon) > Developer**
4. Click **Generate New API Key**
5. Copy the key and update `backend/.env`:
   ```
   ANYTHING_LLM_API_KEY=<your-generated-key>
   ```

---

## Reference: Manual Setup (if starting fresh)

### Step 1: Initial Setup

1. Open http://localhost:3001 in your browser
2. Create your admin account (first user becomes admin)
3. Complete the onboarding wizard

### Step 2: Configure LLM Provider

Navigate to **Settings > LLM Preference** and choose one:

| Provider     | API Key Required       | Best For                   |
| ------------ | ---------------------- | -------------------------- |
| OpenAI       | Yes (`OPENAI_API_KEY`) | Production, high quality   |
| Azure OpenAI | Yes                    | Enterprise, data residency |
| Ollama       | No (local)             | Development, privacy       |
| LM Studio    | No (local)             | Local testing              |

**Recommended for this project**: OpenAI GPT-4 or GPT-3.5-turbo

```
Model: gpt-4-turbo-preview (or gpt-3.5-turbo for cost savings)
API Key: sk-... (from https://platform.openai.com/api-keys)
```

### Step 3: Configure Embedding Model

Navigate to **Settings > Embedding Preference**:

| Provider | Model                  | Dimensions | Notes          |
| -------- | ---------------------- | ---------- | -------------- |
| OpenAI   | text-embedding-3-small | 1536       | Recommended    |
| OpenAI   | text-embedding-3-large | 3072       | Higher quality |
| Ollama   | nomic-embed-text       | 768        | Local, free    |

**Recommended**: `text-embedding-3-small` (cost-effective, good quality)

### Step 4: Configure Vector Database

Navigate to **Settings > Vector Database**:

- **LanceDB** (default): Built-in, no setup required ✅
- **Chroma**: If you need external vector DB
- **Pinecone**: For cloud-scale deployments

**Recommended**: Keep LanceDB (default) for development.

### Step 5: Create Workspace

1. Click **+ New Workspace**
2. Name it: `intl-dossier`
3. Configure workspace settings:
   - **Chat Mode**: Chat (conversational)
   - **Temperature**: 0.7 (balanced creativity)
   - **History**: 20 messages

## Project-Specific Configuration

### For Intl-Dossier AI Features

Create these workspaces:

| Workspace           | Purpose                    | Suggested Prompt                                   |
| ------------------- | -------------------------- | -------------------------------------------------- |
| `brief-generation`  | Generate diplomatic briefs | "You are a diplomatic analyst assistant..."        |
| `document-analysis` | Analyze uploaded documents | "Analyze documents and extract key information..." |
| `general-chat`      | General Q&A                | Default                                            |

### API Integration

The backend connects to AnythingLLM via:

```
ANYTHINGLLM_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=<your-api-key>
```

**To get your API key**:

1. Go to **Settings > Developer**
2. Click **Generate New API Key**
3. Copy and add to `backend/.env`

## Docker Management

```bash
# Start AnythingLLM
docker compose --profile ai up -d

# View logs
docker logs -f intl-dossier-anythingllm

# Restart
docker compose --profile ai restart anythingllm

# Stop
docker compose --profile ai down
```

## Data Persistence

Data is stored in Docker volume `anythingllm_data`:

- `/app/server/storage/documents` - Uploaded documents
- `/app/server/storage/vector-cache` - Vector embeddings
- `/app/server/storage/lancedb` - LanceDB data

**Backup**:

```bash
docker run --rm -v intl-dossierv20_anythingllm_data:/data -v $(pwd):/backup alpine tar czf /backup/anythingllm-backup.tar.gz /data
```

## Troubleshooting

### Container won't start

```bash
docker logs intl-dossier-anythingllm
```

### Reset to fresh state

```bash
docker compose --profile ai down
docker volume rm intl-dossierv20_anythingllm_data
docker compose --profile ai up -d
```

### Connection refused from backend

Ensure backend uses Docker network hostname:

- Inside Docker: `http://intl-dossier-anythingllm:3001`
- From host: `http://localhost:3001`

## Environment Variables Reference

| Variable            | Description       | Default               |
| ------------------- | ----------------- | --------------------- |
| `STORAGE_DIR`       | Data storage path | `/app/server/storage` |
| `SERVER_PORT`       | HTTP port         | `3001`                |
| `JWT_SECRET`        | Auth secret       | Auto-generated        |
| `DISABLE_TELEMETRY` | Disable analytics | `true`                |

---

_Last updated: 2025-12-06_
