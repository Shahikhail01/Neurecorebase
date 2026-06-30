# Backend — AI Platform

**Last Updated:** 2026-06-30
**Last Verified:** 2026-06-30
**Audience:** Backend engineers, AI/ML engineers

---

## Overview

NeureCore AI platform integrates multiple LLM providers and provides a tool registry for AI agents to execute actions.

---

## AI Providers

### MiniMax (Primary)

```env
MINIMAX_API_KEY=...
MINIMAX_MODEL=...
```

Primary LLM provider for agent execution.

### Google AI (Gemini)

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

Used for Google integration (Calendar, Gmail, Drive).

### OpenAI

Available via `openai` package for specific use cases.

---

## Tool Registry

The backend maintains a `StructuredToolRegistry` with registered tools that agents can call.

### Tool Registration

Tools are registered at startup via `setTools()` calls in the agents module.

### Tool Execution

```bash
POST /api/v1/tools/execute
{
  "toolName": "web_search",
  "parameters": { "query": "..." }
}
```

---

## AI Actions

The `ai-actions` module handles orchestration of AI-driven actions:

- Token counting
- Cost tracking
- Latency monitoring
- Error handling

### Metrics

All AI actions emit Prometheus metrics:

- `neurecore_ai_action_invocations_total{status, actionId}`
- `neurecore_ai_action_duration_seconds{actionId}`
- `neurecore_ai_action_tokens_total{direction, actionId}`
- `neurecore_ai_action_cost_usd_total{model, actionId}`
- `neurecore_ai_action_errors_total{actionId, errorType}`

---

## LangGraph Integration

The `orchestration` module uses LangGraph for complex agent workflows:

```typescript
// Routine execution via LangGraph
const result = await routineGraph.invoke({
  agentId: '...',
  input: { ... }
});
```

---

## RAG Pipeline

The `knowledge` module provides RAG (Retrieval Augmented Generation):

- Document ingestion
- Embedding generation
- Vector storage
- Retrieval

---

## Related Documents

- `01-backend.md` — Backend architecture
- `../observability/01-observability.md` — Prometheus metrics
