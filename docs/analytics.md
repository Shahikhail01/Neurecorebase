# Analytics - Design Notes

This document describes the analytics subsystem introduced in Phase 4. It follows SOLID principles and is intentionally modular.

Key components:
- `IAnalyticsProvider` - abstraction for providers exposing models and scoring.
- `IModelRunner` - runs model executions in isolated workers or containers.
- `AnalyticsService` - orchestrates feature selection and scores requests.

Data model notes:
- `analytics_features` stores precomputed features per tenant + timestamp.
- `analytics_models` stores model metadata and versions.

Operational notes:
- Models run in isolated containers with resource limits.
- Cold-run predictions should be rate-limited; cached results preferred.
