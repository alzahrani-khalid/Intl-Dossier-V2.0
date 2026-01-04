# Research: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`
**Created**: 2025-12-05

## LLM Provider Comparison

### OpenAI

- **Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Strengths**: Best overall quality, function calling, JSON mode
- **Weaknesses**: Cost, rate limits, no Arabic-specific model
- **Pricing**: GPT-4o: $2.50/$10 per 1M tokens (input/output)

### Anthropic

- **Models**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Strengths**: Long context (200k), excellent reasoning, safety
- **Weaknesses**: No function calling in older versions, no Arabic model
- **Pricing**: Sonnet: $3/$15 per 1M tokens

### Google

- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Strengths**: Very long context (1M), multimodal, competitive pricing
- **Weaknesses**: Quality slightly below GPT-4/Claude for complex tasks
- **Pricing**: Pro: $1.25/$5 per 1M tokens

### Private (vLLM/Ollama)

- **Models**: Llama 3.1 70B, Mistral, Aya-101 (Arabic)
- **Strengths**: Data privacy, no per-token cost, customizable
- **Weaknesses**: Hardware requirements, deployment complexity
- **Pricing**: Infrastructure only

## Embedding Model Selection

### BGE-M3 (Selected)

- **Dimensions**: 1024 (configurable, we use 1024)
- **Languages**: 100+ including Arabic and English
- **Strengths**: Multilingual, competitive quality, can run locally
- **Source**: BAAI on Hugging Face

### Alternatives Considered

| Model                         | Dims          | Languages | Pros         | Cons             |
| ----------------------------- | ------------- | --------- | ------------ | ---------------- |
| OpenAI text-embedding-3-small | 1536/512/1024 | 100+      | Quality, API | Cost, cloud only |
| multilingual-e5-large         | 1024          | 100+      | Quality      | Larger model     |
| jina-embeddings-v2            | 768           | Limited   | Fast         | Fewer languages  |

### Decision

BGE-M3 locally with OpenAI fallback provides best balance of:

- Arabic/English bilingual support
- Privacy (local execution)
- Cost (no per-call charges)
- Quality (competitive with commercial)

## Agent Framework Selection

### Mastra (Selected)

- TypeScript-native agent framework
- Built-in tool system
- Streaming support
- Good documentation
- Active development

### Alternatives Considered

| Framework     | Language   | Pros                      | Cons                  |
| ------------- | ---------- | ------------------------- | --------------------- |
| LangChain     | Python/JS  | Mature, many integrations | Complex, heavy        |
| LangGraph     | Python     | Graph-based workflows     | Python only           |
| Vercel AI SDK | TypeScript | Simple, streaming         | Limited agent support |
| AutoGen       | Python     | Multi-agent               | Complex setup         |

### Decision

Mastra for Phases 1-3. Can migrate to LangGraph if complex multi-agent workflows needed later.

## RAG Strategy

### Retrieval Pipeline

1. **Query Understanding**: Extract entities, intent from user query
2. **Hybrid Search**: Combine semantic (vector) + keyword (BM25)
3. **Re-ranking**: Cross-encoder for final relevance scoring
4. **Context Assembly**: Format retrieved docs for LLM context

### Chunking Strategy

- **Dossiers**: Chunk by section (background, overview, etc.)
- **Positions**: Keep full position text (usually short)
- **Commitments**: Individual commitment as chunk
- **Engagements**: Summary + participants + outcomes

### Vector Index Configuration

- **Algorithm**: IVFFlat (good balance of speed/accuracy)
- **Lists**: 100 (for ~100k vectors)
- **Distance**: Cosine similarity

## Streaming Implementation

### Server-Sent Events (SSE) - Web

```typescript
// Backend
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}
res.end();

// Frontend
const evtSource = new EventSource('/api/ai/chat');
evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle chunk
};
```

### WebSocket - Mobile

```typescript
// Backend
wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const stream = await chat(JSON.parse(message));
    for await (const chunk of stream) {
      ws.send(JSON.stringify(chunk));
    }
  });
});

// Mobile (React Native)
const ws = new WebSocket('wss://api/ai/ws-chat');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle chunk
};
```

## Cost Estimation

### Monthly Usage Assumptions

- 100 users, 50% active daily
- 5 briefs per user per week
- 20 chat messages per user per day
- 10 entity link proposals per day

### Token Estimates

| Feature     | Input Tokens | Output Tokens | Monthly Volume  |
| ----------- | ------------ | ------------- | --------------- |
| Brief Gen   | 4,000        | 2,000         | 2,000 briefs    |
| Chat        | 500          | 300           | 30,000 messages |
| Entity Link | 1,000        | 200           | 300 proposals   |

### Monthly Cost (GPT-4o)

- Brief Generation: ~$28 input + $40 output = $68
- Chat: ~$38 input + $90 output = $128
- Entity Linking: ~$0.75 input + $0.60 output = $1.35
- **Total: ~$200/month** at full adoption

### Cost Reduction Strategies

1. Use GPT-4o-mini for chat ($0.15/$0.60) - saves ~$100/month
2. Cache common queries - 20% reduction
3. Private LLM for internal use - variable savings

## Security Considerations

### Data Classification Routing

| Classification | Cloud Allowed  | Private Required       |
| -------------- | -------------- | ---------------------- |
| Public         | Yes            | No                     |
| Internal       | Yes            | No                     |
| Confidential   | Per org policy | If policy denies cloud |
| Secret         | No             | Yes                    |

### PII Handling

- Pre-process inputs to detect/mask PII before cloud LLM
- Log AI runs without storing full prompts for sensitive data
- Implement content moderation for outputs

### Audit Trail

- All AI runs logged with user, timestamp, feature
- Tool calls recorded separately
- Entity link approvals/rejections tracked

## Arabic Language Support

### Detection

```typescript
function detectArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  const arabicChars = (text.match(arabicPattern) || []).length;
  return arabicChars / text.length > 0.3;
}
```

### Model Routing

- If Arabic detected AND org has Arabic model configured → route to Arabic model
- Otherwise → use default model

### Arabic-Optimized Models

- **Aya-101** (Cohere): Multilingual with strong Arabic
- **Jais** (G42): Arabic-first model
- **ArabicGPT**: Smaller, specialized

## Performance Benchmarks

### Target Latencies (p95)

| Operation         | Target | Notes                    |
| ----------------- | ------ | ------------------------ |
| Brief generation  | < 60s  | Complex RAG + generation |
| Chat response     | < 5s   | Simple query             |
| Chat with tools   | < 10s  | Tool execution included  |
| Entity linking    | < 15s  | Search + scoring         |
| Embedding (batch) | < 2s   | 10 texts, local          |

### Concurrent Users

- Target: 50 concurrent without degradation
- Strategy: Request queuing, Redis caching, connection pooling

## References

- [Mastra Documentation](https://mastra.dev/docs)
- [BGE-M3 Model Card](https://huggingface.co/BAAI/bge-m3)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
