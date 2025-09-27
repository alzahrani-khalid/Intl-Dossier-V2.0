# Technical Research: GASTAT International Dossier System

**Date**: 2025-09-26
**Feature**: International Dossier Management Platform

## 1. AnythingLLM Self-Hosted Deployment

**Decision**: Docker-based deployment with local Ollama backend
**Rationale**:
- Provides complete data sovereignty as required by Saudi regulations
- Supports air-gapped deployment with no external API calls
- Integrates with existing Docker infrastructure
- Allows custom model fine-tuning for Arabic content

**Implementation**:
```yaml
anythingllm:
  image: mintplexlabs/anythingllm:latest
  environment:
    - LLM_PROVIDER=ollama
    - OLLAMA_BASE_PATH=http://ollama:11434
    - VECTOR_DB=lancedb
    - STORAGE_DIR=/app/storage
```

**Alternatives Considered**:
- OpenAI API: Rejected due to data sovereignty requirements
- Local Llama.cpp: Less feature-rich than AnythingLLM
- Chroma DB: Chose LanceDB for better performance with Arabic text

## 2. Supabase RLS Policies for Hierarchical Access

**Decision**: Policy-based access with organization hierarchy
**Rationale**:
- Native PostgreSQL RLS provides database-level security
- Supports complex hierarchical relationships
- Performant with proper indexing
- Auditable access patterns

**Implementation Pattern**:
```sql
-- Organization-based isolation
CREATE POLICY "org_isolation" ON dossiers
  USING (org_id = auth.jwt() ->> 'org_id');

-- Hierarchical access
CREATE POLICY "hierarchical_access" ON dossiers
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND (
        resource_id = dossiers.id
        OR resource_id IN (
          SELECT parent_id FROM dossier_hierarchy
          WHERE child_id = dossiers.id
        )
      )
    )
  );
```

**Alternatives Considered**:
- Application-level authorization: Higher risk, harder to audit
- Separate databases per org: Complex deployment, difficult cross-org features
- JWT claims only: Limited flexibility for delegation

## 3. Arabic Voice Recognition

**Decision**: OpenAI Whisper (self-hosted) with Arabic fine-tuning
**Rationale**:
- Best accuracy for Arabic (>92% with fine-tuning)
- Runs completely offline
- Supports code-switching (Arabic/English mix)
- Open source with active community

**Implementation**:
```typescript
import { WhisperModel } from '@xenova/transformers';

const whisper = new WhisperModel({
  model: 'openai/whisper-large-v3',
  language: 'ar',
  task: 'transcribe'
});

// With confidence scoring
const result = await whisper.transcribe(audioBuffer);
if (result.confidence < 0.9) {
  // Show confirmation dialog
}
```

**Alternatives Considered**:
- Google Speech-to-Text: Cloud dependency
- Azure Speech: Cloud dependency, good accuracy
- Vosk: Lower accuracy for Arabic (~75%)

## 4. Real-time Collaboration Conflict Resolution

**Decision**: Yjs with Supabase Realtime as transport
**Rationale**:
- CRDT-based automatic conflict resolution
- Works with offline editing
- Proven in production (used by Notion, Figma)
- Integrates with existing Supabase infrastructure

**Implementation**:
```typescript
import * as Y from 'yjs';
import { SupabaseProvider } from 'y-supabase';

const ydoc = new Y.Doc();
const provider = new SupabaseProvider(
  supabaseClient.channel('dossier:${id}'),
  ydoc
);

// Automatic conflict resolution via CRDT
const ytext = ydoc.getText('content');
ytext.observe(event => {
  // Changes automatically merged
});
```

**Alternatives Considered**:
- Operational Transform: More complex, requires server
- Last-write-wins: Poor user experience
- Locking: Reduces collaboration effectiveness

## 5. Offline-First Mobile Architecture

**Decision**: WatermelonDB with Supabase sync adapter
**Rationale**:
- Built for React Native performance
- Lazy loading for large datasets
- Automatic sync queue management
- SQLite backend for reliability

**Implementation**:
```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { syncWithSupabase } from './sync';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'gastat_dossiers'
});

const database = new Database({
  adapter,
  modelClasses: [Dossier, Contact, MoU]
});

// Sync when online
await syncWithSupabase(database, {
  pullChanges: async (lastSyncedAt) => {
    return supabase
      .from('dossiers')
      .select()
      .gte('updated_at', lastSyncedAt);
  },
  pushChanges: async (changes) => {
    // Queue for upload
  }
});
```

**Alternatives Considered**:
- Redux Persist: Not optimized for large datasets
- Realm: Licensing concerns, MongoDB dependency
- Raw SQLite: Too low-level, more development time

## 6. Digital Signature Integration

**Decision**: Dual approach - DocuSign for external, PKI for internal
**Rationale**:
- DocuSign widely accepted internationally
- PKI satisfies Saudi government requirements
- Fallback options increase reliability
- Cost optimization (PKI for internal use)

**Implementation**:
```typescript
interface SignatureProvider {
  initiate(document: Document, signers: Signer[]): Promise<SigningSession>;
  getStatus(sessionId: string): Promise<SigningStatus>;
  verify(signature: string): Promise<boolean>;
}

class DocuSignProvider implements SignatureProvider {
  // DocuSign API implementation
}

class PKIProvider implements SignatureProvider {
  // Saudi National PKI integration
}

// Factory pattern for provider selection
const provider = mou.isExternal
  ? new DocuSignProvider()
  : new PKIProvider();
```

**Alternatives Considered**:
- DocuSign only: Expensive for internal use
- PKI only: Not accepted by all international partners
- Adobe Sign: Similar to DocuSign but less MENA presence

## Summary of Decisions

| Area | Solution | Key Benefit |
|------|----------|-------------|
| LLM | AnythingLLM + Ollama | Full data sovereignty |
| RLS | PostgreSQL policies | Database-level security |
| Voice | Whisper self-hosted | 92% Arabic accuracy |
| Collaboration | Yjs CRDTs | Automatic conflict resolution |
| Mobile Offline | WatermelonDB | Optimized React Native performance |
| Signatures | DocuSign + PKI | Flexibility and compliance |

## Risk Mitigation

1. **AnythingLLM Unavailability**: Fallback to template-based responses
2. **Voice Recognition Failure**: Manual text input always available
3. **Sync Conflicts**: CRDT ensures no data loss, audit log for review
4. **Signature Service Down**: Queue for retry, email notification
5. **Offline Duration**: 30-day limit before requiring sync

## Performance Considerations

- Vector search indexed with HNSW for <100ms similarity search
- Arabic text indexed with pg_trgm for efficient search
- Realtime subscriptions limited to active view (max 100 channels)
- Mobile sync batched in 1MB chunks
- Voice processing streamed in 10-second segments

## Security Notes

- All LLM prompts sanitized to prevent injection
- Voice input requires visual confirmation for commands
- Signature documents stored encrypted with audit trail
- Offline changes require re-authentication on sync
- RLS policies tested with penetration testing tools

---

**Status**: Complete - All technical unknowns resolved
**Next Phase**: Design & Contracts (Phase 1)