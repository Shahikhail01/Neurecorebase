# SOLID Principles Quick Reference Guide - NeureCore Gold

**Purpose**: Ensure architectural consistency and maintainability across the enhanced UX implementation.

---

## 1️⃣ Single Responsibility Principle (SRP)

**Definition**: Each component/service should have only ONE reason to change.

### ✅ DO THIS

```typescript
// ✅ Good: Separated concerns
// service/dashboardService.ts
export class DashboardService {
  constructor(
    private agentRepo: IRepository<Agent>,
    private workflowRepo: IRepository<Workflow>
  ) {}

  async getMetrics(): Promise<CompanyMetrics> {
    // Only business logic, no API calls
  }
}

// service/api/RestClient.ts
export class RestClient implements IApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Only HTTP logic, no business rules
  }
}

// hooks/useDashboardData.ts
export function useDashboardData() {
  const service = useDashboardService();
  const [data, setData] = useState(null);
  // Only React hook logic, data syncing
}
```

### ❌ DON'T DO THIS

```typescript
// ❌ Bad: Multiple responsibilities
export class DashboardComponent {
  async loadData() {
    // API call
    const res = await fetch('/api/metrics');
    // Transform data
    const formatted = res.data.map(...);
    // Business logic
    const harmony = this.calculateHarmony(formatted);
    // State management
    this.setState(harmony);
    // Notifications
    this.showNotification('Data loaded');
    // Analytics
    this.logEvent('dashboard_loaded');
  }
}
```

### 🎯 Rule of Thumb
**Ask**: "Will this class change for multiple reasons?"  
**If Yes** → Split it up!

---

## 2️⃣ Open/Closed Principle (OCP)

**Definition**: Open for extension, closed for modification.

### ✅ DO THIS

```typescript
// ✅ Can add new strategies without changing existing code
interface INotificationStrategy {
  send(payload: NotificationPayload): Promise<void>;
}

class ToastNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) { /* ... */ }
}

class EmailNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) { /* ... */ }
}

class SlackNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) { /* ... */ }
}

// Next week: Add SMS notification
class SmsNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) { /* ... */ }
}
// ✓ No changes to existing classes!
```

### ❌ DON'T DO THIS

```typescript
// ❌ Bad: Must modify every time you add a notification type
export class NotificationService {
  notify(payload: NotificationPayload) {
    if (payload.type === 'TOAST') {
      this.showToast(payload);
    } else if (payload.type === 'EMAIL') {
      this.sendEmail(payload);
    } else if (payload.type === 'SLACK') {
      this.sendSlack(payload);
    }
    // Add SMS? Must modify here!
  }
}
```

### 🎯 Rule of Thumb
**Ask**: "To add a new feature, do I need to modify existing code?"  
**If Yes** → Use polymorphism/strategies!

---

## 3️⃣ Liskov Substitution Principle (LSP)

**Definition**: Subtypes must be substitutable for base types without breaking behavior.

### ✅ DO THIS

```typescript
// ✅ All adapters work identically
interface IDataAdapter<Raw, Transformed> {
  adapt(data: Raw): Transformed;
}

class AgentAdapter implements IDataAdapter<RawAgent, Agent> {
  adapt(raw: RawAgent): Agent {
    return { /* ... */ };
  }
}

class WorkflowAdapter implements IDataAdapter<RawWorkflow, Workflow> {
  adapt(raw: RawWorkflow): Workflow {
    return { /* ... */ };
  }
}

// Usage: Any adapter works the same way
function transformData<R, T>(
  adapter: IDataAdapter<R, T>,
  data: R
): T {
  return adapter.adapt(data); // Works with any adapter!
}
```

### ❌ DON'T DO THIS

```typescript
// ❌ Bad: Subtype behaves differently
interface IRepository {
  findAll(): Promise<Entity[]>;
}

class DatabaseRepository implements IRepository {
  async findAll(): Promise<Entity[]> {
    return await this.db.query('SELECT * FROM entities');
  }
}

class CacheRepository implements IRepository {
  findAll(): Entity[] { // ⚠️ Returns sync, not Promise!
    return this.cache.get('entities');
  }
}

// ❌ Caller expects Promise, gets sync → crashes!
const entities = await repo.findAll();
```

### 🎯 Rule of Thumb
**Ask**: "Can I replace this subclass with another without breaking code?"  
**If No** → Redesign the interface!

---

## 4️⃣ Interface Segregation Principle (ISP)

**Definition**: Clients should depend only on methods they actually use.

### ✅ DO THIS

```typescript
// ✅ Small, focused interfaces
interface IAgentProfile {
  id: string;
  name: string;
  role: string;
}

interface IAgentPerformance {
  getMetrics(): PerformanceData;
  calculateScore(): number;
}

interface IAgentManagement {
  updateSettings(settings: AgentSettings): Promise<void>;
  train(config: TrainConfig): Promise<void>;
}

// Component only needs what it uses
function AgentCard({ agent }: { agent: IAgentProfile }) {
  return <div>{agent.name} ({agent.role})</div>;
}

// Dashboard only needs performance
function PerformanceWidget({ agent }: { agent: IAgentPerformance }) {
  const score = agent.calculateScore();
  return <div>Score: {score}%</div>;
}
```

### ❌ DON'T DO THIS

```typescript
// ❌ Bad: Fat interface with everything
interface IAgent {
  // Profile
  id: string;
  name: string;
  role: string;
  // Performance
  getMetrics(): any;
  calculateScore(): number;
  // Management
  updateSettings(settings: any): Promise<void>;
  train(config: any): Promise<void>;
  // Communication
  chat(message: string): Promise<ChatResponse>;
  // ... 20 more methods
}

// Component forced to implement everything, even unused methods
class AgentCard implements IAgent {
  // Must implement all 25+ methods!
}
```

### 🎯 Rule of Thumb
**Ask**: "Does the client use every method in that interface?"  
**If No** → Split the interface!

---

## 5️⃣ Dependency Inversion Principle (DIP)

**Definition**: Depend on abstractions, not concrete implementations.

### ✅ DO THIS

```typescript
// ✅ Depends on abstraction (interface)
interface IApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
}

export class DashboardService {
  constructor(private apiClient: IApiClient) {} // ← Inject interface!

  async getMetrics(): Promise<Metrics> {
    return this.apiClient.get('/metrics');
  }
}

// Can swap implementations
const restClient = new RestClient();
const graphqlClient = new GraphQLClient();
const mockClient = new MockApiClient();

const service1 = new DashboardService(restClient);
const service2 = new DashboardService(graphqlClient);
const service3 = new DashboardService(mockClient); // ← All work!
```

### ❌ DON'T DO THIS

```typescript
// ❌ Bad: Depends on concrete class
import { RestClient } from './RestClient';

export class DashboardService {
  private apiClient = new RestClient(); // ← Hard-coded!

  async getMetrics(): Promise<Metrics> {
    return this.apiClient.get('/metrics');
  }
}

// Can't test with mock, can't swap implementations
```

### 🎯 Rule of Thumb
**Ask**: "Is this class directly instantiating its dependencies?"  
**If Yes** → Inject them instead!

---

## 📋 SOLID Checklist for Code Review

Use this checklist when reviewing code:

### Before Writing Code
- [ ] Did I define the interface first?
- [ ] Does my component have only ONE responsibility?
- [ ] Can I extend this without modifying existing code?
- [ ] Are all dependencies interfaces, not concrete classes?
- [ ] Is my interface focused on what clients actually need?

### During Code Review
```typescript
// ✅ Review these patterns
query.addEventListener('click', handleApprove) // Tightly coupled
      ↓
// Better:
<Button onClick={onApprove} /> // Loose coupling
```

### Red Flags 🚩
```typescript
❌ new [ClassName]()              → Inject instead
❌ this.apiClient = new AxiosInstance() → Use interface
❌ if (type === 'X') else if ... → Use polymorphism
❌ function(...) { ... 200 lines } → Split up
❌ interface IService { ... 50 methods } → Segregate
```

---

## 🎓 Real-World Example: Notification System

### ❌ Before SOLID

```typescript
export class NotificationService {
  notify(type: 'toast' | 'email' | 'slack', message: string) {
    if (type === 'toast') {
      // 50 lines of toast logic
    } else if (type === 'email') {
      // 60 lines of email logic
    } else if (type === 'slack') {
      // 40 lines of slack logic
    }
  }
}

// Problems:
// ❌ Single Responsibility: Has 3 responsibilities (toast, email, slack)
// ❌ Open/Closed: Must modify to add SMS
// ❌ Too many reasons to change
```

### ✅ After SOLID

```typescript
// 1️⃣ Interface Segregation - Small focused interfaces
interface INotificationStrategy {
  send(payload: NotificationPayload): Promise<void>;
}

// 2️⃣ Single Responsibility - Each class does ONE thing
class ToastNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) {
    toast.show(payload.message); // Only toast logic
  }
}

class EmailNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) {
    await emailService.send(payload.email, payload.message);
  }
}

class SlackNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) {
    await slackClient.postMessage(payload.channel, payload.message);
  }
}

// 3️⃣ Dependency Inversion - Service depends on interface
export class NotificationService {
  constructor(private strategies: INotificationStrategy[]) {}

  async notify(payload: NotificationPayload): Promise<void> {
    // Find applicable strategies
    const applicable = this.strategies.filter(s => s.supports(payload));
    await Promise.all(applicable.map(s => s.send(payload)));
  }
}

// 4️⃣ Open/Closed - Add SMS without modifying existing code
class SmsNotification implements INotificationStrategy {
  async send(payload: NotificationPayload) {
    await twilioClient.sendSms(payload.phone, payload.message);
  }
}

// 5️⃣ Liskov Substitution - All strategies work the same way
const service = new NotificationService([
  new ToastNotification(),
  new EmailNotification(),
  new SlackNotification(),
  new SmsNotification() // ← New type added seamlessly!
]);

// Benefits:
// ✅ Single Responsibility: Each class does one thing
// ✅ Open/Closed: Add new strategies without modifying existing
// ✅ Interface Segregation: Simple INotificationStrategy
// ✅ Dependency Inversion: Depends on interface, not concrete classes
// ✅ Liskov Substitution: All strategies are interchangeable
```

---

## 🛠️ Common SOLID Patterns

### Strategy Pattern (OCP + ISP)
```typescript
interface IStrategy {
  execute(): void;
}

// Swap implementations at runtime
class Service {
  constructor(private strategy: IStrategy) {}
  doWork() { this.strategy.execute(); }
}
```

### Repository Pattern (DIP)
```typescript
interface IRepository<T> {
  findAll(): Promise<T[]>;
}

class Service {
  constructor(private repo: IRepository<User>) {}
}
```

### Adapter Pattern (OCP)
```typescript
interface IDataAdapter<R, T> {
  adapt(raw: R): T;
}

class Repository {
  constructor(private adapter: IDataAdapter<RawData, Data>) {}
}
```

### Dependency Injection
```typescript
// Constructor injection
class Service {
  constructor(private dep1: IService1, private dep2: IService2) {}
}

// Factory injection
const service = factoryFunction(dep1, dep2);
```

---

## ⚠️ When NOT to Over-Engineer

SOLID is a guide, not a law. Avoid over-engineering:

```typescript
// ❌ Over-engineered: Simple utility function turned into strategy pattern
interface IStringFormatter { format(str: string): string; }
class TrimFormatter implements IStringFormatter { ... }
class UppercaseFormatter implements IStringFormatter { ... }

// ✅ Just use functions
const format = {
  trim: (str: string) => str.trim(),
  uppercase: (str: string) => str.toUpperCase(),
};
```

**Rule**: Use SOLID when you anticipate change or multiple implementations.

---

## 📚 Resources

- **Clean Code** by Robert C. Martin
- **SOLID Principles** by Pluralsight
- **Architecture Decision Records (ADRs)**
- **Example Projects**: zustand store examples, Next.js patterns

---

**Last Updated**: February 19, 2026  
**Status**: Active Guide  
**Questions?** → Ask in architecture reviews
