# NeureCore Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for NeureCore, following SOLID principles and optimized for Vercel deployment.

## Testing Pyramid

```
        /\
       /E2E\          ← Few, Slow, Expensive
      /------\
     /Integration\    ← Medium, Medium
    /------------\
   /    Unit      \  ← Many, Fast, Cheap
  /--------------\
```

## Test Types

### 1. Unit Tests (70%)

- **Location**: `**/*.spec.ts`
- **Purpose**: Test individual functions, classes, hooks
- **Mock**: All external dependencies
- **Run**: Every commit

### 2. Integration Tests (20%)

- **Location**: `**/*.integration-spec.ts`
- **Purpose**: Test component/service interactions
- **Mock**: External APIs only
- **Run**: Every PR

### 3. E2E Tests (10%)

- **Location**: `**/*.e2e-spec.ts`, `__tests__/e2e/*.ts`
- **Purpose**: Test full user flows
- **Mock**: None (real app)
- **Run**: Before release

## Backend (NestJS)

### Commands

```bash
npm run test          # All unit tests
npm run test:watch   # Watch mode
npm run test:cov     # With coverage
npm run test:e2e     # E2E tests
npm run test:unit    # Unit tests only
npm run test:ci      # CI pipeline
```

### Coverage Thresholds

- Global: 70%
- Modules: 75%

## Frontend (React/Next.js)

### Commands

```bash
npm run test              # Unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E
npm run test:e2e:ui      # Playwright UI
```

### E2E with Playwright

```bash
npx playwright install   # Install browsers
npm run test:e2e         # Run tests
```

## Naming Conventions

### Unit Tests

```typescript
describe("ServiceName", () => {
  it("should do X when Y", () => {});
  it("should return Z for invalid input", () => {});
});
```

### Integration Tests

```typescript
describe("API: /endpoint", () => {
  it("GET should return 200 with data", async () => {});
});
```

### E2E Tests

```typescript
test.describe("User Flow", () => {
  test("should login successfully", async ({ page }) => {});
});
```

## Best Practices

1. **Single Responsibility**: Each test should verify one behavior
2. **Test Isolation**: Tests should not depend on each other
3. **Meaningful Assertions**: Use specific matchers, not generic ones
4. **Arrange-Act-Assert**: Clear test structure
5. **Mock External Services**: Don't hit real APIs in unit tests

## CI/CD Integration

### GitHub Actions

- Run unit tests on every PR
- Run E2E before merge to main
- Fail build if coverage drops

## Vercel Deployment Notes

- E2E tests run in preview deployments
- Use environment variables for test credentials
- Clean up test data after each run
