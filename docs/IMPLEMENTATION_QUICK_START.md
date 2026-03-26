# Implementation Quick Start Guide

## Table of Contents
1. [Repository Setup](#repository-setup)
2. [Development Environment](#development-environment)
3. [Phase-by-Phase Checklists](#phase-by-phase-checklists)
4. [Team Structure](#team-structure)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Repository Setup

### Initial Structure
```bash
NeureCore-Gold/
├── backend/                    # NestJS API service
│   ├── src/
│   ├── prisma/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── docker-compose.prod.yml
│   ├── .env.example
│   └── package.json
│
├── frontend-tenant/            # Tenant Portal (Next.js)
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── frontend-admin/             # Super Admin Portal (Next.js)
│   ├── src/
│   ├── public/

│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── PHASED_IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE_AND_API_SPEC.md
│   ├── IMPLEMENTATION_QUICK_START.md     ← You are here
│   ├── DEVELOPER_GUIDELINES.md
│   ├── TESTING_STRATEGY.md
│   └── DEPLOYMENT_GUIDE.md
│
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml
│   │   ├── frontend-ci.yml
│   │   └── deploy.yml
│   └── CODEOWNERS
│
├── .gitignore
└── README.md
```

### Initial Git Commands
```bash
# Create repo structure
git init
git add docs/
git commit -m "docs: Add implementation plans and architecture docs"

# Feature branch workflow
git checkout -b phase-1/foundation
```

---

## Development Environment

### Prerequisites
```
Node.js: 20+ LTS
npm: 10+
Docker: 24+
PostgreSQL: 16 (or use docker-compose)
Redis: 7 (or use docker-compose)
```

### Local Setup Script

```bash
#!/bin/bash
# setup-dev.sh

set -e

echo "🚀 NeureCore Gold Development Setup"
echo "===================================="

# Create project directories
mkdir -p backend frontend-tenant frontend-admin
cd backend

# Backend setup
echo "📦 Setting up backend..."
npm init -y
npm install \
  @nestjs/core @nestjs/common @nestjs/platform-express \
  typescript @types/node \
  prisma @prisma/client \
  zod socket.io \
  redis bcryptjs jsonwebtoken \
  langchain openai anthropic \
  dotenv

npm install -D \
  @types/express @types/jsonwebtoken \
  jest @types/jest ts-jest \
  eslint prettier \
  ts-node nodemon

# Create .env file
cat > .env.example << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/neurecore_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-your-key
EOF

cp .env.example .env

# Frontend setup
cd ../frontend-tenant
echo "📦 Setting up frontend-tenant..."
npx create-next-app@latest . --typescript --tailwind --no-git
npm install zustand axios socket.io-client

cd ../frontend-admin
echo "📦 Setting up frontend-admin..."
npx create-next-app@latest . --typescript --tailwind --no-git
npm install zustand axios socket.io-client

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd backend && docker-compose up -d"
echo "2. npm run migrate"
echo "3. npm run dev"
echo "4. In another terminal: cd frontend-tenant && npm run dev"
echo "5. In another terminal: cd frontend-admin && npm run dev"
```

### Docker Compose for Local Development

```yaml
# backend/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: neurecore
      POSTGRES_PASSWORD: password
      POSTGRES_DB: neurecore_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U neurecore"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgvector:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: neurecore
      POSTGRES_PASSWORD: password
      POSTGRES_DB: neurecore_vectors
    ports:
      - "5433:5432"
    volumes:
      - pgvector_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  redis_data:
  pgvector_data:
```

---

## Phase-by-Phase Checklists

### Phase 1: Foundation (Weeks 1-6)

#### Week 1: Project Initialization
- [ ] Repository created with folder structure
- [ ] Backend NestJS project initialized
- [ ] Frontend-tenant Next.js project initialized
- [ ] Frontend-admin Next.js project initialized
- [ ] Docker Compose set up for local development
- [ ] GitHub Actions CI/CD pipeline scaffolding started
- [ ] Team access configured (GitHub, repositories)
- [ ] Documentation structure created
- [ ] Slack channel for updates

**Commits**:
```
git commit -m "chore: Setup NeureCore Gold monorepo structure"
git commit -m "feat(backend): Initialize NestJS project with core dependencies"
git commit -m "feat(frontend): Initialize Next.js apps for tenant and admin"
git commit -m "chore: Docker Compose setup for development"
```

#### Week 2-3: Authentication & Identity Service

**Backend Tasks**:
- [ ] User model created
- [ ] Tenant model & isolation enforced
- [ ] Role model (owner, admin, user)
- [ ] Password hashing (bcryptjs)
- [ ] JWT token generation & verification
- [ ] Login endpoint working
- [ ] Register endpoint working
- [ ] Refresh token logic implemented
- [ ] Session management (Redis)
- [ ] RBAC middleware implemented
- [ ] Unit tests for auth service
- [ ] Integration tests for auth endpoints

**Frontend Tasks**:
- [ ] Login page UI created
- [ ] Register page UI created
- [ ] Auth context/store setup
- [ ] Token storage (localStorage/secure cookie)
- [ ] API client with token injection
- [ ] Protected routes
- [ ] Logout functionality
- [ ] Auto-refresh token handling

**Commits**:
```
git commit -m "feat(auth): Implement user authentication service"
git commit -m "feat(auth): JWT token generation and verification"
git commit -m "feat(auth): User registration and login endpoints"
git commit -m "feat(frontend): Login and register pages"
git commit -m "test(auth): Unit and integration tests for authentication"
```

#### Week 4: Database & API Gateway

**Backend Tasks**:
- [ ] Prisma schema for Phase 1 tables
- [ ] Database migrations
- [ ] API Gateway with error handling
- [ ] Request logging middleware
- [ ] CORS configuration
- [ ] Rate limiting setup
- [ ] Input validation (Zod)
- [ ] Standard response format
- [ ] Error handling middleware

**Commits**:
```
git commit -m "feat(database): Prisma schema and initial migrations"
git commit -m "feat(api): API Gateway with error handling and logging"
git commit -m "feat(api): Input validation with Zod"
```

#### Week 5: Frontend Scaffold & WebSocket

**Frontend Tasks**:
- [ ] Layout components (Header, Sidebar)
- [ ] Main dashboard page
- [ ] Navigation structure
- [ ] Responsive design with Tailwind
- [ ] WebSocket client setup
- [ ] Connection handling
- [ ] Reconnection logic

**Backend Tasks**:
- [ ] Socket.IO server integration
- [ ] WebSocket authentication
- [ ] Event namespace setup
- [ ] Basic event broadcasting

**Commits**:
```
git commit -m "feat(frontend): Layout and navigation components"
git commit -m "feat(websocket): Socket.IO server integration"
```

#### Week 6: Local Testing & Documentation

- [ ] All services running locally
- [ ] Basic happy path tested
- [ ] Developer documentation completed
- [ ] Setup guide validated
- [ ] Team trained on setup

**Commits**:
```
git commit -m "docs: Add developer setup guide"
git commit -m "test: Add smoke tests for Phase 1"
```

**Phase 1 Completion Checklist**:
```
Backend:
✅ Running on localhost:3000
✅ Authentication functional
✅ Database connected
✅ API Gateway working
✅ WebSocket server ready

Frontend:
✅ Tenant portal running on localhost:3001
✅ Admin portal running on localhost:3002
✅ Login/Register working
✅ Basic navigation working
✅ WebSocket connected

Infrastructure:
✅ Docker Compose functional
✅ Database migrations working
✅ CI/CD pipeline basics configured
✅ Team setup complete
```

---

### Phase 2: Agent Runtime & Core Services (Weeks 7-12)

#### Week 7-8: Agent Runtime Foundation

**Backend Tasks**:
- [ ] IAgent interface defined
- [ ] AgentService scaffold
- [ ] Agent database model
- [ ] Agent creation endpoint
- [ ] Agent listing endpoint
- [ ] Agent detail endpoint
- [ ] Unit tests for agent service

**Key Files**:
```typescript
// src/modules/agents/interfaces/agent.interface.ts
export interface IAgent {
  id: string;
  name: string;
  type: AgentType;
  role: string;
  permissions: string[];
  authority: AuthorityLevel;
  tools: string[];
  status: AgentStatus;
  execute(task: Task): Promise<ExecutionResult>;
}

// src/modules/agents/services/agent.service.ts
@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger
  ) {}

  async createAgent(input: CreateAgentDto): Promise<Agent> {
    // Implementation
  }

  async getAgent(id: string): Promise<Agent> {
    // Implementation
  }
}
```

**Commits**:
```
git commit -m "feat(agents): Agent entity and database model"
git commit -m "feat(agents): Agent service implementation"
git commit -m "test(agents): Unit tests for agent service"
```

#### Week 8-9: LangChain Integration

**Backend Tasks**:
- [ ] LangChain chain setup
- [ ] Agent planner module
- [ ] Agent executor with tool calling
- [ ] Memory abstraction
- [ ] CacheMemory for conversations
- [ ] Integration with OpenAI
- [ ] Fallback model handling

**Key Implementation**:
```typescript
// src/modules/agents/services/planner.service.ts
import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';

@Injectable()
export class PlannerService {
  private chain: LLMChain;

  constructor(private config: ConfigService) {
    const model = new ChatOpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
      modelName: 'gpt-4',
      temperature: 0.7
    });

    const template = `You are {role}. Plan the next steps for: {task}`;

    const prompt = new PromptTemplate({
      template,
      inputVariables: ['role', 'task']
    });

    this.chain = new LLMChain({ llm: model, prompt });
  }

  async plan(role: string, task: string): Promise<string> {
    return this.chain.call({ role, task });
  }
}
```

**Commits**:
```
git commit -m "feat(agents): LangChain integration for planning"
git commit -m "feat(agents): Tool calling and execution"
git commit -m "feat(agents): Memory management with LangChain"
```

#### Week 9-10: Memory & Tools Service

**Backend Tasks**:
- [ ] Memory abstraction layer
- [ ] Vector database setup (pgvector)
- [ ] Embedding service
- [ ] Semantic search
- [ ] Memory storage
- [ ] Memory retrieval
- [ ] Tool interface defined
- [ ] Tool registry
- [ ] Built-in tools (5-10 basics)

**Commits**:
```
git commit -m "feat(memory): Memory abstraction and storage"
git commit -m "feat(memory): Semantic search with vector DB"
git commit -m "feat(tools): Tool interface and registry"
git commit -m "feat(tools): Built-in tool implementations"
```

#### Week 10-11: Orchestration Service

**Backend Tasks**:
- [ ] Task model & database
- [ ] Task router
- [ ] Task scheduler
- [ ] Dependency resolver
- [ ] Retry logic
- [ ] Failure recovery
- [ ] Event emission
- [ ] Task execution endpoints

**Commits**:
```
git commit -m "feat(orchestration): Task routing and scheduling"
git commit -m "feat(orchestration): Retry and failure recovery"
git commit -m "feat(orchestration): Task execution API"
```

#### Week 11-12: Frontend Portal & Real-time Updates

**Frontend Tasks**:
- [ ] Agent list page
- [ ] Agent details page
- [ ] Create agent form
- [ ] Agent control buttons (pause, resume)
- [ ] Real-time status updates via WebSocket
- [ ] Task list page
- [ ] Task creation form
- [ ] Backend integration complete

**Commits**:
```
git commit -m "feat(frontend): Agent management pages"
git commit -m "feat(frontend): Real-time status updates"
git commit -m "feat(frontend): Task management interface"
```

**Phase 2 Completion Checklist**:
```
Backend:
✅ Agent runtime operational
✅ LangChain chains working
✅ Memory system persisting
✅ Tools executing
✅ Orchestration routing tasks
✅ Real-time events broadcasting

Frontend:
✅ Agent management UI complete
✅ Task creation working
✅ Real-time WebSocket events
✅ User can see agent status
✅ Basic workflows visible

Architecture:
✅ No shared code between frontend/backend
✅ HTTP/WebSocket communication only
✅ SOLID principles applied
✅ Microservice-ready structure
```

---

### Phase 3: Governance, Observability & Production Ready (Weeks 13-18)

#### Week 13-14: Governance Service

**Backend Tasks**:
- [ ] Governance rules database model
- [ ] Rule engine
- [ ] Rule validation before execution
- [ ] Spending limits
- [ ] Authority enforcement
- [ ] Audit logging
- [ ] Approval workflow

**Commits**:
```
git commit -m "feat(governance): Rule engine and enforcement"
git commit -m "feat(governance): Spending limits and authority"
git commit -m "feat(governance): Audit trail logging"
```

#### Week 14-15: Observability & Monitoring

**Backend Tasks**:
- [ ] Prometheus metrics setup
- [ ] Custom metric collectors
- [ ] Structured logging (Pino)
- [ ] Trace context propagation
- [ ] Cost calculation
- [ ] Success rate metrics
- [ ] Performance metrics
- [ ] Grafana dashboard config

**Commits**:
```
git commit -m "feat(observability): Prometheus metrics"
git commit -m "feat(observability): Structured logging"
git commit -m "feat(observability): Cost tracking"
```

#### Week 15-16: Complete Portal UIs

**Frontend Tasks**:
- [ ] Tenant portal: All 8 modules complete
- [ ] Admin portal: All 9 modules complete
- [ ] Responsive design throughout
- [ ] Dark theme support
- [ ] Accessibility improvements (WCAG AA)
- [ ] Performance optimization (lazy loading)
- [ ] Error handling & user feedback

**Commits**:
```
git commit -m "feat(frontend-tenant): Complete dashboard"
git commit -m "feat(frontend-tenant): Workflows module"
git commit -m "feat(frontend-tenant): Approvals module"
git commit -m "feat(frontend-tenant): Analytics module"
git commit -m "feat(frontend-admin): Platform Brain Map"
git commit -m "feat(frontend-admin): Complete all modules"
```

#### Week 16-17: Production Deployment Configuration

**DevOps Tasks**:
- [ ] Production Docker images
- [ ] Kubernetes manifests (if using)
- [ ] Environment variable configuration
- [ ] Database backup strategy
- [ ] Health checks configured
- [ ] Load balancer setup
- [ ] SSL/TLS certificates
- [ ] Logging aggregation
- [ ] Monitoring alerts

**Commits**:
```
git commit -m "chore: Production Docker images"
git commit -m "chore: Kubernetes deployment manifests"
git commit -m "chore: Production environment configuration"
```

#### Week 17-18: CI/CD & Testing

**DevOps Tasks**:
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] End-to-end tests on critical paths
- [ ] Performance tests baseline
- [ ] CI pipeline complete
- [ ] Automated deployment pipeline
- [ ] Smoke tests before production
- [ ] Rollback plan documented

**Commits**:
```
git commit -m "test: Comprehensive unit test suite"
git commit -m "test: Integration test suite"
git commit -m "ci: GitHub Actions CI/CD workflow"
git commit -m "ci: Automated deployment pipeline"
```

**Phase 3 Completion Criteria**:
```
✅ All SOLID principles applied
✅ Complete API specification implemented
✅ No shared code between frontend/backend
✅ HTTP/WebSocket communication only
✅ Governance rules enforced
✅ Observability collecting metrics
✅ Production configurations ready
✅ CI/CD fully automated
✅ Security audit passed
✅ Performance baseline established
✅ Team trained on deployment
✅ Ready for MVP production deployment
```

---

## Team Structure

### Recommended Team Size (Minimum)

```
Backend Team (2-3 people)
├── Lead Backend Engineer
│   └── Responsibilities:
│       - Architecture decisions
│       - Code reviews
│       - LangChain/OpenAI integration
│       - Database design
│
├── Backend Engineer
│   └── Responsibilities:
│       - Services implementation
│       - API development
│       - Testing
│       - Documentation
│
└── (Optional) DevOps Engineer
    └── Responsibilities:
        - Docker/Kubernetes setup
        - CI/CD pipeline
        - Infrastructure as Code
        - Monitoring setup

Frontend Team (2-3 people)
├── Lead Frontend Engineer
│   └── Responsibilities:
│       - Architecture decisions
│       - Component design
│       - Performance optimization
│       - Code reviews
│
└── Frontend Engineer
    └── Responsibilities:
        - Page implementation
        - Component development
        - WebSocket integration
        - Testing

Product/Design (1 person)
└── Product Manager
    └── Responsibilities:
        - Feature prioritization
        - Stakeholder communication
        - User feedback collection
```

### Weekly Synchronization

```
Monday:
  9:00 AM - Standup (15 min)
           Goal: Weekly priorities sync

Wednesday:
  2:00 PM - Mid-week sync (30 min)
           Goal: Blockers, progress check

Friday:
  4:00 PM - Demo & Retrospective (60 min)
           Goal: Show progress, team feedback
```

### Communication Guidelines

**GitHub**:
- Use PRs for all code changes
- Require 1 approval before merge
- Link issues in PR descriptions
- Use conventional commits

**Slack**:
- #dev-general: General discussions
- #dev-backend: Backend-specific
- #dev-frontend: Frontend-specific
- #deployments: Deployment logs

---

## Common Patterns

### Backend: Creating a New Service (SOLID-compliant)

```typescript
// 1. Define the interface (Dependency Inversion)
// src/modules/myfeature/interfaces/my-service.interface.ts
export interface IMyService {
  doSomething(input: string): Promise<void>;
}

// 2. Implement the service
// src/modules/myfeature/services/my.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IMyService } from '../interfaces/my-service.interface';

@Injectable()
export class MyService implements IMyService {
  private readonly logger = new Logger(MyService.name);

  constructor(
    private prisma: PrismaService,
    private other: OtherService  // Inject dependencies
  ) {}

  async doSomething(input: string): Promise<void> {
    this.logger.log(`Processing: ${input}`);
    // Business logic here
  }
}

// 3. Create the controller
// src/modules/myfeature/controllers/my.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { MyService } from '../services/my.service';

@Controller('myfeature')
export class MyController {
  constructor(private service: MyService) {}

  @Post()
  async create(@Body() input: CreateMyFeatureDto) {
    await this.service.doSomething(input.data);
    return { status: 'success' };
  }
}

// 4. Register in module
// src/modules/myfeature/myfeature.module.ts
import { Module } from '@nestjs/common';
import { MyService } from './services/my.service';
import { MyController } from './controllers/my.controller';

@Module({
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService]  // Make available to other modules
})
export class MyFeatureModule {}
```

### Frontend: Creating a New Feature

```typescript
// 1. Define types
// src/types/myfeature.ts
export interface MyFeatureItem {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface CreateMyFeatureInput {
  name: string;
}

// 2. Create API service
// src/services/myfeatureApi.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const myFeatureApi = {
  list: () => 
    fetch(`${API_BASE}/myfeature`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(r => r.json()),

  create: (data: CreateMyFeatureInput) =>
    fetch(`${API_BASE}/myfeature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json())
};

// 3. Create Zustand store
// src/store/myfeatureStore.ts
import create from 'zustand';

interface MyFeatureStore {
  items: MyFeatureItem[];
  loading: boolean;
  fetchItems: () => Promise<void>;
  createItem: (input: CreateMyFeatureInput) => Promise<void>;
}

export const useMyFeatureStore = create<MyFeatureStore>((set) => ({
  items: [],
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    try {
      const response = await myFeatureApi.list();
      set({ items: response.data });
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      set({ loading: false });
    }
  },

  createItem: async (input) => {
    try {
      const response = await myFeatureApi.create(input);
      set(state => ({ items: [...state.items, response.data] }));
    } catch (error) {
      console.error('Failed to create item', error);
      throw error;
    }
  }
}));

// 4. Create component
// src/components/MyFeature.tsx
'use client';

import { useEffect } from 'react';
import { useMyFeatureStore } from '@/store/myfeatureStore';

export function MyFeatureComponent() {
  const { items, loading, fetchItems } = useMyFeatureStore();

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

// 5. Use in page
// src/app/(tenant)/myfeature/page.tsx
import { MyFeatureComponent } from '@/components/MyFeature';

export default function MyFeaturePage() {
  return <MyFeatureComponent />;
}
```

### WebSocket Event Handling

```typescript
// Backend: Emit event
// src/modules/agents/services/agent.service.ts
@Injectable()
export class AgentService {
  constructor(private gateway: AgentGateway) {}

  async updateStatus(agentId: string, status: string) {
    // ... update in DB ...

    // Broadcast to all connected clients for this tenant
    this.gateway.broadcastToTenant(tenantId, 'agent:status_updated', {
      agentId,
      status
    });
  }
}

// Backend: WebSocket Gateway
// src/modules/agents/gateways/agent.gateway.ts
@WebSocketGateway({ namespace: '/socket' })
export class AgentGateway {
  private tenantConnections = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const tenantId = this.extractTenantId(client);
    if (!this.tenantConnections.has(tenantId)) {
      this.tenantConnections.set(tenantId, new Set());
    }
    this.tenantConnections.get(tenantId).add(client.id);
  }

  broadcastToTenant(tenantId: string, event: string, data: any) {
    const clients = this.tenantConnections.get(tenantId) || new Set();
    clients.forEach(clientId => {
      this.server.to(clientId).emit(event, data);
    });
  }
}

// Frontend: Listen to events
// src/hooks/useWebSocket.ts
import { useEffect } from 'react';
import { socket } from '@/services/socket';

export function useWebSocketEvent(event: string, handler: (data: any) => void) {
  useEffect(() => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}

// Frontend: Use in component
export function AgentCard() {
  const [status, setStatus] = useState('idle');

  useWebSocketEvent('agent:status_updated', (data) => {
    setStatus(data.status);
  });

  return <div>Status: {status}</div>;
}
```

---

## Troubleshooting

### Common Issues

#### Issue: "JWT token validation failing"
```
Solution:
1. Check JWT_SECRET in .env matches between requests
2. Verify token expiration with: jwt.decode(token)
3. Ensure header format: "Authorization: Bearer <token>"
4. Check token isn't being truncated in logs
```

#### Issue: "WebSocket connection refused"
```
Solution:
1. Verify Socket.IO namespace: ws://localhost:3000/socket
2. Check CORS config allows WebSocket upgrade
3. Confirm socket.io client version matches server
4. Try: socket.disconnect() then socket.connect()
```

#### Issue: "Database connection timeout"
```
Solution:
1. Check PostgreSQL service: docker-compose ps
2. Verify DATABASE_URL format
3. Ensure firewall allows 5432
4. Check credentials match docker-compose env
5. Try: docker-compose restart postgres
```

#### Issue: "LangChain model API errors"
```
Solution:
1. Verify API keys in .env files
2. Check API key has correct permissions
3. Test with curl: curl -H "Authorization: Bearer $KEY" https://api.openai.com/v1/models
4. Ensure model name matches available models
5. Check rate limits haven't been exceeded
```

#### Issue: "Frontend can't reach backend API"
```
Solution:
1. Verify NEXT_PUBLIC_API_URL in .env.local
2. Check backend is running: curl http://localhost:3000/api/health
3. Check CORS config allows frontend origin
4. Browser console should show actual error
5. Try: fetch('http://localhost:3000/api/health')
```

### Debug Commands

```bash
# Check all services running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs redis

# Database connection
psql postgresql://user:password@localhost:5432/neurecore_dev

# Test API endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/agents

# WebSocket connection test
npm install -g wscat
wscat -c "ws://localhost:3000/socket?token=$TOKEN"

# Check Node processes
lsof -i :3000  # Backend
lsof -i :3001  # Frontend tenant
lsof -i :3002  # Frontend admin
```

---

## Next Steps

1. **Week 1**: Copy this document into your project
2. **Day 1**: Run setup script, get team on same local environment
3. **Daily**: Team standup on progress
4. **Weekly**: Demo working features to stakeholder
5. **Bi-weekly**: Architecture review & refactoring

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Maintainer**: Development Team
