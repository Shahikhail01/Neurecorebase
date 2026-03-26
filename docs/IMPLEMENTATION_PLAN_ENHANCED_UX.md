# NeureCore Gold: Enhanced UX Implementation Plan (SOLID-Compliant)

**Version**: 1.0  
**Date**: February 19, 2026  
**Scope**: Tenant Frontend Enhanced UX  
**Architecture Pattern**: Clean Architecture + SOLID Principles

---

## 1. Executive Summary

Transform the tenant frontend from 30% to 100% alignment with the Enhanced UX Concept through systematic, SOLID-compliant architecture. This plan prioritizes human-friendliness, real-time insights, and intuitive company control.

**Total Effort**: 10-12 weeks (phased approach)  
**Team Size**: 4-5 developers  
**Tech Stack**: Next.js 15, React 19, Zustand, Socket.IO, TailwindCSS, Framer Motion

---

## 2. SOLID Principles Application

### 2.1 Single Responsibility Principle (SRP)
Each component/service handles **ONE** reason to change:

```
❌ Before:
Dashboard.tsx (1200 lines) - handles KPIs, charts, filters, socket events, exports

✅ After:
- DashboardPage.tsx (50 lines) - orchestrator
- useDashboardData.ts - data fetching logic
- KpiSection.tsx - KPI display
- ChartSection.tsx - chart rendering
- ActivityTimeline.tsx - timeline display
- DashboardActions.tsx - action handlers
- dashboardService.ts - business logic
```

### 2.2 Open/Closed Principle (OCP)
Components open for **extension**, closed for **modification**:

```typescript
// ✅ Extensible notification system
interface INotificationStrategy {
  notify(message: NotificationPayload): Promise<void>;
}

class ToastNotification implements INotificationStrategy { ... }
class EmailNotification implements INotificationStrategy { ... }
class SlackNotification implements INotificationStrategy { ... }

// Add new notification type without modifying existing code
```

### 2.3 Liskov Substitution Principle (LSP)
Subtypes must be substitutable for their base types:

```typescript
// ✅ All data adapters work identically
interface IDataAdapter {
  fetch(query: QueryParams): Promise<ApiResponse>;
  transform(data: unknown): TransformedData;
}

class WorkflowAdapter implements IDataAdapter { ... }
class AgentAdapter implements IDataAdapter { ... }
class TaskAdapter implements IDataAdapter { ... }
```

### 2.4 Interface Segregation Principle (ISP)
Clients depend only on methods they use:

```typescript
// ❌ Fat interface
interface IAgent {
  id: string;
  name: string;
  getPerformance(): any;
  updateSettings(): any;
  train(): any;
  chat(): any;
  // ... 20 more methods
}

// ✅ Segregated interfaces
interface IAgentProfile {
  id: string;
  name: string;
  role: string;
}

interface IAgentPerformance {
  getMetrics(): PerformanceData;
}

interface IAgentManagement {
  updateSettings(settings: AgentSettings): Promise<void>;
  train(config: TrainConfig): Promise<void>;
}

interface IAgentCommunication {
  chat(message: string): Promise<ChatResponse>;
}
```

### 2.5 Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions:

```typescript
// ❌ High-level depends on low-level
class DashboardService {
  constructor(private api: AxiosInstance) { }
}

// ✅ Both depend on abstraction
interface IApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: any): Promise<T>;
}

class DashboardService {
  constructor(private apiClient: IApiClient) { }
}
```

---

## 3. Architecture Overview

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (Pages, Layouts, Components)               │
├─────────────────────────────────────────────┤
│         Feature Layer                       │
│  (Feature-specific components & hooks)      │
├─────────────────────────────────────────────┤
│         Business Logic Layer                │
│  (Services, Stores, State Management)       │
├─────────────────────────────────────────────┤
│         Data Access Layer                   │
│  (API Clients, Adapters, Transformers)      │
├─────────────────────────────────────────────┤
│         Infrastructure Layer                │
│  (Socket.IO, Storage, Cache, Auth)          │
└─────────────────────────────────────────────┘
```

### 3.2 Directory Structure (SOLID-Compliant)

```
frontend-tenant/
├── src/
│   ├── app/                          # Next.js pages
│   │   ├── (authenticated)/          # Auth wrapper layout
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── tasks/
│   │   │   └── ...
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── layout.tsx
│   │
│   ├── features/                     # Feature-grouped logic
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── KpiSection.tsx
│   │   │   │   ├── ChartSection.tsx
│   │   │   │   ├── ActivityTimeline.tsx
│   │   │   │   └── DashboardActions.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDashboardData.ts
│   │   │   │   ├── useDashboardFilters.ts
│   │   │   │   └── useDashboardExport.ts
│   │   │   ├── services/
│   │   │   │   └── dashboardService.ts
│   │   │   ├── types/
│   │   │   │   └── dashboard.types.ts
│   │   │   └── page.tsx              # Orchestrator
│   │   ├── agents/
│   │   ├── notifications/
│   │   ├── reporting/
│   │   └── ...
│   │
│   ├── shared/                       # Shared across features
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ActivityStream.tsx
│   │   │   │   └── Inspector.tsx
│   │   │   ├── UI/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── ...
│   │   │   ├── Charts/
│   │   │   ├── Tables/
│   │   │   └── Forms/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useNotification.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── ...
│   │   ├── stores/                  # Zustand + persistent
│   │   │   ├── authStore.ts
│   │   │   ├── uiPreferencesStore.ts
│   │   │   ├── notificationStore.ts
│   │   │   └── ...
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── domain.ts
│   │   │   └── ...
│   │   └── constants/
│   │       ├── routes.ts
│   │       ├── api-endpoints.ts
│   │       └── ui-config.ts
│   │
│   ├── core/                        # Application core
│   │   ├── services/                # Business logic
│   │   │   ├── api/                 # API integrations
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── IApiClient.ts
│   │   │   │   │   ├── IDataAdapter.ts
│   │   │   │   │   └── ...
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── WorkflowAdapter.ts
│   │   │   │   │   ├── AgentAdapter.ts
│   │   │   │   │   └── ...
│   │   │   │   ├── clients/
│   │   │   │   │   ├── RestClient.ts
│   │   │   │   │   └── GraphQLClient.ts
│   │   │   │   └── transformers/
│   │   │   │       └── ResponseTransformer.ts
│   │   │   │
│   │   │   ├── notification/        # Notification system
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── INotificationService.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── ToastStrategy.ts
│   │   │   │   │   ├── EmailStrategy.ts
│   │   │   │   │   └── SlackStrategy.ts
│   │   │   │   ├── NotificationService.ts
│   │   │   │   └── notificationQueue.ts
│   │   │   │
│   │   │   ├── analytics/           # Analytics service
│   │   │   ├── reporting/           # Reporting engine
│   │   │   ├── ai-recommendations/  # AI suggestions
│   │   │   └── accessibility/       # A11y utilities
│   │   │
│   │   ├── repositories/            # Data layer abstraction
│   │   │   ├── interfaces/
│   │   │   │   └── IRepository.ts
│   │   │   ├── WorkflowRepository.ts
│   │   │   ├── AgentRepository.ts
│   │   │   └── ...
│   │   │
│   │   ├── state-management/        # Global state logic
│   │   │   ├── actions/
│   │   │   ├── selectors/
│   │   │   └── middleware/
│   │   │
│   │   └── infrastructure/          # Low-level infrastructure
│   │       ├── socket/
│   │       │   ├── SocketManager.ts
│   │       │   └── EventBus.ts
│   │       ├── storage/
│   │       │   ├── LocalStorageManager.ts
│   │       │   └── SessionStorageManager.ts
│   │       ├── auth/
│   │       │   └── TokenManager.ts
│   │       └── cache/
│   │           ├── CacheManager.ts
│   │           └── CacheStrategies.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── converters.ts
│   │   ├── analytics-helpers.ts
│   │   └── accessibility.ts
│   │
│   └── config/                      # Configuration
│       ├── api.config.ts
│       ├── ui.config.ts
│       ├── feature-flags.ts
│       └── theme.config.ts
│
├── __tests__/                       # Test files (mirror structure)
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal: Create SOLID-compliant base infrastructure**

#### 4.1.1 Layer 1: Interfaces & Abstractions
```typescript
// core/services/api/interfaces/IApiClient.ts
export interface IApiClient {
  get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

// core/services/api/interfaces/IDataAdapter.ts
export interface IDataAdapter<Raw, Transformed> {
  adapt(data: Raw): Transformed;
  reverse(data: Transformed): Raw;
}

// core/repositories/IRepository.ts
export interface IRepository<T> {
  findAll(query?: QueryParams): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

**Deliverables**:
- [ ] 10-15 core interfaces defined
- [ ] BaseService abstract class
- [ ] BaseRepository abstract class
- [ ] Type definitions for all domain entities

#### 4.1.2 Layer 2: Infrastructure Services
```typescript
// core/infrastructure/api/RestClient.ts
export class RestClient implements IApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenManager: ITokenManager,
    private readonly errorHandler: IErrorHandler
  ) {}
  
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...config,
        headers: {
          ...config?.headers,
          'Authorization': `Bearer ${this.tokenManager.getAccessToken()}`
        }
      });
      return this.errorHandler.handle(response);
    } catch (error) {
      throw this.errorHandler.wrap(error);
    }
  }
}

// core/infrastructure/socket/SocketManager.ts
export class SocketManager implements ISocketManager {
  private socket: Socket;
  private eventBus: EventBus;

  constructor(private readonly authService: IAuthService) {
    this.eventBus = new EventBus();
  }

  connect(): void {
    this.socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: {
        token: this.authService.getToken()
      }
    });
    this.socket.on('connect', () => this.eventBus.emit('socket:connected'));
  }
}
```

**Deliverables**:
- [ ] RestClient implementation
- [ ] SocketManager implementation
- [ ] TokenManager
- [ ] ErrorHandler
- [ ] EventBus/EventEmitter

#### 4.1.3 Layer 3: Data Access (Repositories & Adapters)
```typescript
// core/repositories/AgentRepository.ts
export class AgentRepository implements IRepository<Agent> {
  constructor(
    private readonly apiClient: IApiClient,
    private readonly adapter: AgentAdapter,
    private readonly cache: ICacheManager
  ) {}

  async findAll(query?: QueryParams): Promise<Agent[]> {
    const cacheKey = `agents:${JSON.stringify(query)}`;
    const cached = this.cache.get<Agent[]>(cacheKey);
    if (cached) return cached;

    const response = await this.apiClient.get<RawAgentData[]>('/agents', { params: query });
    const agents = response.data.map(raw => this.adapter.adapt(raw));
    this.cache.set(cacheKey, agents, { ttl: 5 * 60 });
    return agents;
  }
}

// core/repositories/adapters/AgentAdapter.ts
export class AgentAdapter implements IDataAdapter<RawAgentData, Agent> {
  adapt(raw: RawAgentData): Agent {
    return {
      id: raw.id,
      name: raw.firstName + ' ' + raw.lastName,
      role: raw.role,
      status: this.mapStatus(raw.lastActivity),
      performance: this.calculatePerformance(raw.metrics),
      // ... more transformations
    };
  }

  private mapStatus(lastActivity: string): AgentStatus {
    // Status mapping logic
  }

  private calculatePerformance(metrics: unknown): PerformanceData {
    // Performance calculation
  }
}
```

**Deliverables**:
- [ ] Repository implementations (Agent, Workflow, Task, Department, etc.)
- [ ] Data adapters for each entity
- [ ] CacheManager
- [ ] ErrorHandler implementations

---

### Phase 2: State Management & Business Logic (Weeks 3-4)
**Goal: Implement centralized state & business rules**

#### 4.2.1 Zustand Stores (with Middleware)
```typescript
// shared/stores/agentStore.ts
interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  loading: boolean;
  filters: AgentFilters;
  // Actions
  fetchAgents: (filters?: AgentFilters) => Promise<void>;
  selectAgent: (agent: Agent) => void;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  applyFilters: (filters: AgentFilters) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgent: null,
      loading: false,
      filters: {},

      fetchAgents: async (filters) => {
        set({ loading: true });
        try {
          const repository = new AgentRepository(...);
          const agents = await repository.findAll(filters);
          set({ agents, filters });
        } catch (error) {
          // Error handling
        } finally {
          set({ loading: false });
        }
      },

      selectAgent: (agent) => set({ selectedAgent: agent }),

      updateAgent: async (id, data) => {
        const repository = new AgentRepository(...);
        await repository.update(id, data);
        get().fetchAgents(get().filters);
      },

      applyFilters: (filters) => {
        set({ filters });
        get().fetchAgents(filters);
      },

      reset: () => set({ agents: [], selectedAgent: null, filters: {} })
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({ selectedAgent: state.selectedAgent })
    }
  )
);
```

#### 4.2.2 Business Logic Services
```typescript
// core/services/DashboardService.ts
export class DashboardService implements IDashboardService {
  constructor(
    private readonly agentRepository: IRepository<Agent>,
    private readonly workflowRepository: IRepository<Workflow>,
    private readonly taskRepository: IRepository<Task>,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async getCompanyMetrics(timeRange: TimeRange): Promise<CompanyMetrics> {
    const [agents, workflows, tasks] = await Promise.all([
      this.agentRepository.findAll(),
      this.workflowRepository.findAll(),
      this.taskRepository.findAll()
    ]);

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'ACTIVE').length,
      teamHarmony: this.calculateTeamHarmony(agents),
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      avgTaskTime: this.analyticsService.calculateAvgTime(tasks),
      // ... more metrics
    };
  }

  async getActivityTimeline(limit: number): Promise<ActivityEvent[]> {
    // Timeline logic
  }

  private calculateTeamHarmony(agents: Agent[]): number {
    // Harmony calculation based on collaboration metrics
  }
}
```

**Deliverables**:
- [ ] DashboardService
- [ ] WorkflowService
- [ ] AgentService
- [ ] TaskService
- [ ] AnalyticsService
- [ ] All stores refactored
- [ ] 100% test coverage on services

---

### Phase 3: Enhanced Features (Weeks 5-8)
**Goal: Implement advanced UX features**

#### 4.3.1 Notifications System (Strategy Pattern)
```typescript
// core/services/notification/INotificationService.ts
export interface INotificationStrategy {
  send(payload: NotificationPayload): Promise<void>;
  supports(type: NotificationType): boolean;
}

export interface INotificationService {
  notify(payload: NotificationPayload): Promise<void>;
  registerStrategy(strategy: INotificationStrategy): void;
  setPreferences(prefs: NotificationPreferences): void;
}

// core/services/notification/NotificationService.ts
export class NotificationService implements INotificationService {
  private strategies: INotificationStrategy[] = [];
  private preferences: NotificationPreferences;
  private queue: NotificationQueue;

  constructor(
    private readonly toastStrategy: ToastStrategy,
    private readonly emailStrategy: EmailStrategy,
    private readonly slackStrategy: SlackStrategy
  ) {
    this.strategies = [toastStrategy, emailStrategy, slackStrategy];
    this.queue = new NotificationQueue();
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.shouldNotify(payload)) return;

    const applicable = this.strategies.filter(s => s.supports(payload.type));
    await Promise.all(applicable.map(s => s.send(payload)));

    // Log to analytics
    this.logNotification(payload);
  }

  private shouldNotify(payload: NotificationPayload): boolean {
    // Check user preferences, quiet hours, etc.
    return this.preferences.isEnabled(payload.type);
  }

  private logNotification(payload: NotificationPayload): void {
    // Analytics
  }
}
```

**Features to implement**:
- [ ] Smart notification system with strategies
- [ ] Decision support (recommendations + risk scoring)
- [ ] What-if scenario simulator
- [ ] Advanced filtering & search
- [ ] Custom report builder
- [ ] Real-time collaboration (shared views)
- [ ] Performance insights & diagnostics

#### 4.3.2 Accessibility Layer
```typescript
// core/services/accessibility/AccessibilityService.ts
export class AccessibilityService {
  // Keyboard shortcuts
  registerShortcuts(): KeyboardShortcut[] {
    return [
      { key: 'Ctrl+K', action: 'openCommandPalette', label: 'Open Command Palette' },
      { key: 'Ctrl+Shift+A', action: 'openApprovals', label: 'Go to Approvals' },
      { key: 'Ctrl+N', action: 'newTask', label: 'Create New Task' },
      // ... 20+ shortcuts
    ];
  }

  // ARIA labels
  generateAriaLabel(component: string, context: any): string {
    // Generate contextual ARIA labels
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    // Use aria-live regions
  }
}

// shared/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  const accessibilityService = useAccessibilityService();
  
  useEffect(() => {
    const shortcuts = accessibilityService.registerShortcuts();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => matchesKeyCombo(e, s.key));
      if (shortcut) {
        e.preventDefault();
        executeAction(shortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accessibilityService]);
}
```

**Deliverables**:
- [ ] Keyboard shortcut system (20+ shortcuts)
- [ ] Screen reader optimization
- [ ] High-contrast mode
- [ ] Dyslexia-friendly font option
- [ ] Color-blind mode
- [ ] Text size customization
- [ ] Accessibility testing report

#### 4.3.3 Analytics & Reporting Engine
```typescript
// core/services/reporting/ReportBuilder.ts
export class ReportBuilder implements IReportBuilder {
  private selectedFields: ReportField[] = [];
  private filters: ReportFilter[] = [];
  private groupBy: GroupByField[] = [];
  private sortBy: SortField[] = [];

  selectFields(...fields: ReportField[]): this {
    this.selectedFields.push(...fields);
    return this;
  }

  addFilter(filter: ReportFilter): this {
    this.filters.push(filter);
    return this;
  }

  groupBy(...fields: GroupByField[]): this {
    this.groupBy.push(...fields);
    return this;
  }

  async build(): Promise<Report> {
    const data = await this.fetchData();
    const filtered = this.applyFilters(data);
    const grouped = this.applyGrouping(filtered);
    return {
      data: grouped,
      metadata: { fields: this.selectedFields, filters: this.filters },
      generatedAt: new Date()
    };
  }

  async export(format: 'csv' | 'pdf' | 'xlsx'): Promise<Blob> {
    const report = await this.build();
    return exporters[format](report);
  }
}
```

**Deliverables**:
- [ ] Custom report builder
- [ ] Pre-built report templates
- [ ] Scheduled report exports
- [ ] Comparative analysis
- [ ] Predictive analytics
- [ ] Data export (CSV, PDF, XLSX)

#### 4.3.4 Visual Components (Enhanced)
```typescript
// features/dashboard/components/ActivityTimeline.tsx
export function ActivityTimeline({ events, loading }: Props) {
  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <TimelineEntry key={event.id} event={event} isLast={idx === events.length - 1}>
          <TimelineIcon event={event} />
          <TimelineContent event={event} />
          <TimelineCollapse>
            {/* Detailed context story */}
          </TimelineCollapse>
        </TimelineEntry>
      ))}
    </div>
  );
}

// features/dashboard/components/PerformanceHeatmap.tsx
export function PerformanceHeatmap({ data, metric }: Props) {
  // D3.js or Recharts heatmap
  return <ResponsiveHeatmap data={data} />;
}

// features/dashboard/components/WorkflowAnimatedFlow.tsx
export function WorkflowAnimatedFlow({ workflow }: Props) {
  // Framer Motion animated flow
  return <AnimatedFlow workflow={workflow} />;
}
```

**Deliverables**:
- [ ] Activity timeline with storytelling
- [ ] Performance heatmaps
- [ ] Animated workflow diagrams
- [ ] Gantt charts for task scheduling
- [ ] Collaboration maps
- [ ] Scenario simulators

---

### Phase 4: Advanced UX & Polish (Weeks 9-11)
**Goal: Refinement, mobile, optimization**

#### 4.4.1 Mobile & PWA
```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'service-worker.js',
});

module.exports = withPWA({
  // Next.js config
});

// public/service-worker.ts
// Offline support, sync, notifications
```

**Deliverables**:
- [ ] PWA manifest
- [ ] Service worker with offline sync
- [ ] Mobile-responsive design (≤600px)
- [ ] Touch gestures (swipe to approve, etc.)
- [ ] Mobile app (iOS/Android via Capacitor or React Native)

#### 4.4.2 Voice Commands Integration
```typescript
// core/services/voice/VoiceCommandService.ts
export class VoiceCommandService {
  private recognition: SpeechRecognition;
  
  registerCommands(): VoiceCommand[] {
    return [
      { phrase: 'show me sales progress', action: 'navigateToDashboard' },
      { phrase: 'approve all pending requests', action: 'bulkApprove' },
      { phrase: 'create new task', action: 'openTaskForm' },
      // ... more commands
    ];
  }

  async listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (evt) => {
        const transcript = evt.results[0][0].transcript;
        resolve(transcript);
      };
      this.recognition.start();
    });
  }
}
```

**Deliverables**:
- [ ] Voice command recognition
- [ ] Voice response feedback
- [ ] Voice command logging
- [ ] Custom voice profiles

#### 4.4.3 Theme Customization
```typescript
// shared/stores/uiPreferencesStore.ts
interface UIPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'sans' | 'dyslexia-friendly';
  colorScheme: 'standard' | 'colorblind' | 'custom';
  customColors: Record<string, string>;
}

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      setTheme: (theme) => set((state) => ({
        preferences: { ...state.preferences, theme }
      })),
      setCustomColors: (colors) => set((state) => ({
        preferences: { ...state.preferences, customColors: colors }
      })),
    }),
    { name: 'ui-preferences' }
  )
);
```

**Deliverables**:
- [ ] Light/dark/high-contrast modes
- [ ] Custom color picker
- [ ] Font size adjustment
- [ ] Font family options
- [ ] Theme persistence

#### 4.4.4 Performance Optimization
```typescript
// next.config.ts
export default {
  swcMinify: true,
  compress: true,
  optimizeFonts: true,
  experimental: {
    optimizePackageImports: ['zustand', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  }
};

// Lazy loading strategy
const Dashboard = lazy(() => import('@/features/dashboard'));
const Analytics = lazy(() => import('@/features/analytics'));
// Automatic code splitting per route
```

**Deliverables**:
- [ ] Lighthouse score ≥ 90
- [ ] Bundle size < 250KB (gzipped)
- [ ] Time to Interactive < 2 seconds
- [ ] Code splitting per route
- [ ] Image optimization
- [ ] Font optimization

---

### Phase 5: Integration & Testing (Weeks 11-12)
**Goal: Integration, testing, deployment**

#### 4.5.1 Integration Tests
```typescript
// __tests__/integration/dashboard.test.ts
describe('Dashboard Integration', () => {
  it('should fetch and render KPIs when dashboard loads', async () => {
    const store = useAgentStore();
    await store.fetchAgents();
    
    const { getByText } = render(<Dashboard />);
    expect(getByText('Active Agents')).toBeInTheDocument();
  });

  it('should update KPIs when agent activity changes via socket', async () => {
    const { rerender } = render(<Dashboard />);
    
    // Emit socket event
    socket.emit('agent:updated', newAgentData);
    
    rerender(<Dashboard />);
    expect(getByText('2 Active Agents')).toBeInTheDocument();
  });
});
```

#### 4.5.2 E2E Tests
```typescript
// __tests__/e2e/user-flow.test.ts
describe('User Flow: Company Control', () => {
  it('CEO should manage company from start to finish', async () => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name=email]', 'demo@tenant.local');
    await page.fill('input[name=password]', 'password');
    await page.click('button:has-text("Sign In")');
    
    // View dashboard
    await expect(page).toHaveURL('http://localhost:3001/dashboard');
    
    // Create workflow
    await page.click('button:has-text("New Workflow")');
    // ... form filling
    
    // Delegate task
    await page.click('button:has-text("Delegate")');
    // ... delegation flow
    
    // Approve pending
    await page.click('text=Approvals');
    await page.click('button:has-text("Approve All")');
  });
});
```

**Deliverables**:
- [ ] 80%+ code coverage
- [ ] Integration test suite
- [ ] E2E test suite
- [ ] Performance benchmarks
- [ ] Accessibility audit
- [ ] Security audit

---

## 5. Component & Service Breakdown by SOLID

### 5.1 Key Components with Dependencies

```typescript
// ✅ Feature: Dashboard
// Location: features/dashboard/page.tsx
//
// Dependencies (Injected):
// - IDashboardService
// - IAgentRepository
// - IWorkflowRepository
// - INotificationService
// - IAnalyticsService
//
// Responsibilities:
// 1. Orchestrate feature
// 2. Pass data to sub-components
// 3. Handle user actions
//
// Sub-Components (Single-Responsibility):
// - KpiSection        → Display KPIs only
// - ActivityTimeline  → Display activity only
// - ChartSection      → Display charts only
// - DashboardActions  → Handle actions only

// ✅ Feature: Agents
// Sub-Components:
// - AgentGrid         → Display list
// - AgentCard         → Display card
// - AgentFilter       → Handle filtering
// - AgentSearch       → Handle search
// - AgentContextMenu  → Handle agent actions

// ✅ Feature: Notifications
// Services:
// - NotificationService     → Orchestrator
// - ToastStrategy           → Toast notifications
// - EmailStrategy           → Email notifications
// - SlackStrategy           → Slack notifications
// - NotificationQueue       → Queue management
// - NotificationPreferences → Preference store

// ✅ Feature: Reporting
// Services:
// - ReportBuilder               → Build reports
// - CSVExporter / PDFExporter   → Export formats
// - ReportScheduler             → Schedule exports
// - ReportAnalytics             → Analytics queries
```

---

## 6. Data Flow & Architecture Decisions

### 6.1 State Management Flow

```
User Action
    ↓
Component Handler
    ↓
Business Logic Service
    ↓
Repository
    ↓
API Client
    ↓
Backend
    ↓
Response
    ↓
Data Adapter (Transform)
    ↓
Cache Manager (Store)
    ↓
Zustand Store (Update)
    ↓
Component Re-render
```

### 6.2 Socket Events Flow

```
Backend emits: 'agent:updated'
    ↓
EventBus receives
    ↓
AgentRepository listens
    ↓
Repository invalidates cache
    ↓
Repository refetch data
    ↓
Zustand store updates
    ↓
Components re-render
    ↓
Notification triggered
```

### 6.3 API Error Handling

```
API Error
    ↓
RestClient catches
    ↓
ErrorHandler determines type
    ↓
If 401: TokenManager refreshes
    ↓
If 429: Retry with backoff
    ↓
Else: User notification
    ↓
ErrorEvent emitted
    ↓
Component handles gracefully
```

---

## 7. Testing Strategy (SOLID-Aligned)

### 7.1 Unit Tests

```typescript
// ✅ Test business logic, not implementation
describe('DashboardService', () => {
  let service: DashboardService;
  let mockAgentRepo: jest.Mocked<IRepository<Agent>>;

  beforeEach(() => {
    mockAgentRepo = mockRepository<Agent>();
    service = new DashboardService(mockAgentRepo, /* ... */);
  });

  it('should calculate correct team harmony', async () => {
    mockAgentRepo.findAll.mockResolvedValue([
      { id: '1', collaborationScore: 0.8 },
      { id: '2', collaborationScore: 0.9 },
    ]);

    const harmony = await service.getCompanyMetrics();
    expect(harmony.teamHarmony).toBe(0.85);
  });
});
```

### 7.2 Integration Tests

```typescript
// ✅ Test feature workflows
describe('Dashboard Feature', () => {
  it('should display KPIs after fetching data', async () => {
    const store = createTestStore();
    await store.fetchDashboardData();

    const { getByText } = render(<Dashboard store={store} />);
    expect(getByText('Team Harmony: 85%')).toBeInTheDocument();
  });
});
```

### 7.3 E2E Tests

```typescript
// ✅ Test user journeys
describe('CEO Workflow', () => {
  it('should manage delegation from start to finish', async () => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Delegate Task")');
    // ... assertions
  });
});
```

---

## 8. Key Technical Decisions

| Decision | Rationale | SOLID Principle |
|----------|-----------|-----------------|
| **Zustand + Persistence** | Lightweight, no boilerplate, built-in persistence | SRP |
| **Repository Pattern** | Abstraction over data sources | DIP, OCP |
| **Strategy Pattern (Notifications)** | Add new notification types without modifying existing | OCP |
| **Dependency Injection** | Loose coupling, testability | DIP |
| **Feature-based Structure** | Cohesive features, easier scaling | SRP |
| **Interface Segregation** | Small, focused contracts | ISP |
| **EventBus/EventEmitter** | Decoupled communication | DIP |
| **Adapter Pattern** | Data transformation isolation | SRP, OCP |
| **Middleware in Zustand** | Cross-cutting concerns (logging, analytics) | SRP |
| **Service Layer** | Business logic centralization | SRP |

---

## 9. Migration Strategy

### 9.1 Incremental Refactoring (No Breaking Changes)

```
Week 1-2:  Phase 1 (infrastructure)
           ✓ New files only, no existing changes
           ✓ No component changes yet

Week 3-4:  Phase 2 (state management)
           ✓ New stores alongside existing
           ✓ Gradual migration

Week 5-8:  Phase 3 (features)
           ✓ Replace old components incrementally
           ✓ Run old + new in parallel initially

Week 9-11: Phase 4 (polish)
           ✓ Deprecate old code
           ✓ Final cleanup

Week 12:   Phase 5 (testing)
           ✓ Comprehensive validation
```

### 9.2 Feature Flags for Gradual Rollout

```typescript
// config/feature-flags.ts
export const FEATURES = {
  ENHANCED_DASHBOARD: process.env.NEXT_PUBLIC_ENHANCED_DASHBOARD === 'true',
  NOTIFICATIONS_V2: process.env.NEXT_PUBLIC_NOTIFICATIONS_V2 === 'true',
  VOICE_COMMANDS: process.env.NEXT_PUBLIC_VOICE_COMMANDS === 'true',
  ADVANCED_REPORTING: process.env.NEXT_PUBLIC_ADVANCED_REPORTING === 'true',
};

// Usage in components
if (FEATURES.ENHANCED_DASHBOARD) {
  return <EnhancedDashboard />;
} else {
  return <LegacyDashboard />;
}
```

---

## 10. Resource Requirements

### 10.1 Team Composition
- **Tech Lead** (1): Architecture, SOLID guidance, code review
- **Senior Frontend Dev** (1): Core services, state management
- **Mid-level Frontend Dev** (2): Features, components
- **Junior Frontend Dev** (1): UI components, tests
- **QA/Testing** (1): Test strategy, automation

### 10.2 Tools & Infrastructure
- **Development**:
  - TypeScript, ESLint, Prettier
  - React dev tools, Redux DevTools
  - Storybook for component library
  
- **Testing**:
  - Jest, React Testing Library
  - Playwright (E2E)
  - Percy (Visual regression)
  
- **Monitoring**:
  - Sentry (error tracking)
  - LogRocket (session replay)
  - Datadog (analytics)

---

## 11. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Code Coverage | 80%+ | 40% |
| Lighthouse Score | 90+ | 75 |
| Bundle Size | <250KB | 320KB |
| Time to Interactive | <2s | 3.5s |
| Accessibility (WCAG 2.1 AA) | 100% | 60% |
| Feature Completion | 100% | 30% |
| Test Coverage (E2E) | 80% | 0% |

---

## 12. Timeline & Milestones

```
Week 1-2   → ✅ Foundation Complete
            - All interfaces defined
            - Infrastructure services working
            - Repositories functional

Week 3-4   → ✅ State & Logic Complete
            - All stores refactored
            - Business logic services tested
            - 50% feature coverage

Week 5-8   → ✅ Advanced Features Complete
            - Notifications system live
            - Analytics & reporting working
            - Accessibility at 90%

Week 9-11  → ✅ Polish & Optimization
            - Mobile fully responsive
            - Voice commands working
            - Performance optimized

Week 12    → ✅ Testing & UAT
            - E2E tests complete
            - Security audit passed
            - Ready for production
```

---

## 13. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Scope Creep** | Time overrun | Strict feature prioritization, sprint discipline |
| **Breaking Changes** | User disruption | Feature flags, parallel implementations |
| **Performance Regression** | Poor UX | Performance budgets, monitoring |
| **Testing Gaps** | Bugs in prod | TDD approach, coverage thresholds (80%+) |
| **Resource Turnover** | Knowledge loss | Comprehensive documentation, code review culture |

---

## 14. Documentation Requirements

### 14.1 Developer Documentation
- [ ] Architecture decision records (ADRs)
- [ ] Service & repository interfaces
- [ ] Component API documentation
- [ ] Data flow diagrams
- [ ] Deployment runbook

### 14.2 User Documentation
- [ ] Feature guides
- [ ] Video tutorials
- [ ] Keyboard shortcuts reference
- [ ] Accessibility guide
- [ ] Troubleshooting guide

---

## 15. Deployment Strategy

### 15.1 Environments
```
Development (local)
    ↓
Staging (pre-prod)
    ↓
Production (live)
```

### 15.2 Release Plan
```
Week 12:   Internal Alpha
           - Team testing
           - Refinement

Week 13:   Beta (Limited Users)
           - 10% of tenants
           - Feedback collection

Week 14:   Canary (25% Rollout)
           - Gradual expansion
           - Monitoring

Week 15:   GA (100% Rollout)
           - Full availability
           - Support ready
```

---

## 16. Next Steps

1. **Approve this plan** ✓
2. **Set up development environment**
   - Create feature branches
   - Configure feature flags
3. **Begin Phase 1 implementation**
   - Define interfaces
   - Build infrastructure
4. **Establish code review process**
   - SOLID principle checklist
   - Architecture review
5. **Set up monitoring & logging**
   - Error tracking
   - Performance monitoring

---

**Document Prepared By**: Architecture Team  
**Last Updated**: February 19, 2026  
**Status**: Ready for Implementation  
**Approval**: Required from Product & Engineering Leadership
