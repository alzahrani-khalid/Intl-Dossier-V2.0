# 018 — AI Agents — Prompt Contracts

Defines input/output schemas so assistants can plug into services consistently.

## Triage Classifier

- Endpoint: `POST /api/intake/ai/triage`
- Input:

```json
{
  "title_en": "string",
  "description_en": "string",
  "dossier_context": { "type": "country|org|forum|theme", "tags": ["..."] }
}
```

- Output:

```json
{
  "request_type": "engagement|position|mou_action|foresight|inquiry",
  "sensitivity": "public|internal|confidential|secret",
  "urgency": "low|medium|high|critical",
  "queue": "Policy|Coordination|Foresight|Legal",
  "owner_suggestion": "uuid",
  "confidence": 0.0,
  "explanation": "string"
}
```

## Dedupe

- Endpoint: `GET /api/intake/{id}/dedupe`
- Output element:

```json
{
  "candidate_id": "uuid",
  "type": "intake|engagement|position",
  "similarity": 0.0,
  "reasons": ["string"],
  "suggest_merge": true
}
```

## After‑Action Extraction

- Endpoint: `POST /api/ai/after-action/extract`
- Input: `{ "minutes": "raw text", "language": "en|ar" }`
- Output:

```json
{
  "decisions": [{ "text": "string" }],
  "commitments": [{ "title": "string", "owner": "uuid?", "due_date": "ISO" }],
  "risks": [{ "text": "string", "severity": "low|medium|high" }],
  "summary_en": "string",
  "summary_ar": "string"
}
```

## Position Drafting

- Endpoint: `POST /api/ai/positions/draft`
- Input: `{ "topic": "string", "context": {"dossier_id": "uuid"} }`
- Output: `{ "content_en": "string", "content_ar": "string", "citations": ["url|doc_id"] }`
