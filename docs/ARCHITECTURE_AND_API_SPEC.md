# Architecture & API Specification

## Overview: Separated Architecture Strategy

This document defines the complete separation between Frontend and Backend, with all communication via HTTP/WebSocket only.

---

## Principle: No Shared Code

```
WRONG ❌
backend/
├── shared/        ← Code shared with frontend
│   ├── types.ts
│   ├── utils.ts
│   └── constants.ts
└── ...

frontend/
├── src/
│   └── types/
│       └── index.ts   ← Importing from backend/shared

CORRECT ✅
backend/                    <- Completely independent
├── src/
│   ├── types/ (internal)
│   ├── services/
│   └── ...
└── API exposes contracts

frontend/                   <- Completely independent  
├── src/
│   ├── types/ (mirrored, not shared)
│   ├── services/
│   └── ...
└── Consumes API contracts
```

### Why No Shared Code?
1. **Unified Deployment**: Deploy frontend & backend independently
2. **Technology Freedom**: Frontend uses different tech than backend
3. **Scaling**: Each can scale independently
4. **Team Independence**: Frontend team doesn't depend on backend code
5. **Version Control**: Single responsibility per repository

---

## API Contract Specification

All communication happens through well-defined HTTP/WebSocket APIs. This section defines the complete API surface.

### API Base URLs
```
Backend API: http://localhost:3000/api
WebSocket: ws://localhost:3000/socket

Production:
Backend API: https://api.neurecore.com/api
WebSocket: wss://api.neurecore.com/socket
```

### Authentication

All API requests require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

---

## Complete API Reference

### 1. Authentication Endpoints

#### Register User
```
POST /api/auth/register

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "Acme Corp"  (optional, for new tenant)
}

Response (201):
{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner"
    },
    "tenant": {
      "id": "tnt_123",
      "name": "Acme Corp",
      "plan": "starter"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600
    }
  }
}
```

#### Login
```
POST /api/auth/login

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (200):
{
  "status": "success",
  "data": {
    "user": { ... },
    "tenant": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 3600
    }
  }
}
```

#### Refresh Token
```
POST /api/auth/refresh

Request Body:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

#### Logout
```
POST /api/auth/logout

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### Get Current User
```
GET /api/auth/profile

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner",
      "tenantId": "tnt_123",
      "avatarUrl": "https://...",
      "createdAt": "2025-02-17T10:00:00Z"
    },
    "tenant": {
      "id": "tnt_123",
      "name": "Acme Corp",
      "plan": "starter",
      "agentLimit": 10,
      "activeAgents": 3
    }
  }
}
```

---

### 2. Agent Management Endpoints

#### List Agents (Tenant)
```
GET /api/agents?page=1&limit=10&status=running

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "agt_001",
      "name": "Sales Agent",
      "type": "functional",
      "role": "sales_manager",
      "status": "running",
      "workload": 75,
      "successRate": 0.94,
      "totalTasks": 156,
      "failedTasks": 10,
      "costToday": 23.45,
      "createdAt": "2025-02-10T00:00:00Z"
    },
    ...
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

#### Create Agent
```
POST /api/agents

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "name": "Finance Agent",
  "type": "core",
  "role": "finance_manager",
  "description": "Manages financial operations",
  "permissions": ["create_invoice", "process_payment", "view_reports"],
  "authority": "approve",
  "tools": ["email", "spreadsheet", "accounting_api"],
  "knowledgeBase": "finance_procedures",
  "budget": {
    "dailyLimit": 100.00,
    "monthlyLimit": 1000.00
  },
  "modelPreference": "gpt-4"
}

Response (201):
{
  "status": "success",
  "data": {
    "id": "agt_002",
    "name": "Finance Agent",
    "type": "core",
    "role": "finance_manager",
    "status": "initializing",
    ...
  }
}
```

#### Get Agent Details
```
GET /api/agents/:agentId

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "id": "agt_001",
    "name": "Sales Agent",
    "type": "functional",
    "role": "sales_manager",
    "status": "running",
    "description": "...",
    "permissions": [...],
    "authority": "recommend",
    "tools": [...],
    "knowledgeBase": "sales_strategies",
    "budget": { ... },
    "modelPreference": "gpt-3.5-turbo",
    "performance": {
      "successRate": 0.94,
      "avgTaskTime": 145000,  // ms
      "totalTasks": 156,
      "failedTasks": 10,
      "costToday": 23.45,
      "costMonth": 523.00
    },
    "recentTasks": [ ... ],
    "createdAt": "2025-02-10T00:00:00Z",
    "updatedAt": "2025-02-17T15:30:00Z"
  }
}
```

#### Update Agent
```
PUT /api/agents/:agentId

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "name": "Updated Sales Agent",
  "description": "New description",
  "authority": "auto",
  "budget": { ... }
}

Response (200):
{
  "status": "success",
  "data": { ... }
}
```

#### Pause Agent
```
POST /api/agents/:agentId/pause

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "id": "agt_001",
    "status": "paused"
  }
}
```

#### Resume Agent
```
POST /api/agents/:agentId/resume

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "id": "agt_001",
    "status": "running"
  }
}
```

#### Delete Agent
```
DELETE /api/agents/:agentId

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "message": "Agent deleted successfully"
}
```

---

### 3. Task Management Endpoints

#### List Tasks
```
GET /api/tasks?page=1&limit=20&status=pending&agentId=agt_001

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "tsk_001",
      "title": "Process Invoice #402",
      "agentId": "agt_002",
      "agentName": "Finance Agent",
      "status": "running",
      "priority": "high",
      "progress": 65,
      "createdAt": "2025-02-17T10:00:00Z",
      "dueAt": "2025-02-18T17:00:00Z",
      "assignedAt": "2025-02-17T10:05:00Z"
    },
    ...
  ],
  "meta": { ... }
}
```

#### Create Task
```
POST /api/tasks

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "title": "Close Q1 Books",
  "description": "Complete financial close for Q1",
  "agentId": "agt_002",
  "priority": "high",
  "dueAt": "2025-03-31T23:59:59Z",
  "context": {
    "invoiceAmount": 50000,
    "department": "finance"
  }
}

Response (201):
{
  "status": "success",
  "data": {
    "id": "tsk_002",
    "title": "Close Q1 Books",
    "status": "pending",
    ...
  }
}
```

#### Get Task Details
```
GET /api/tasks/:taskId

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "id": "tsk_001",
    "title": "Process Invoice #402",
    "agentId": "agt_002",
    "agentName": "Finance Agent",
    "status": "running",
    "progress": 65,
    "description": "...",
    "priority": "high",
    "createdAt": "2025-02-17T10:00:00Z",
    "dueAt": "2025-02-18T17:00:00Z",
    "startedAt": "2025-02-17T10:05:00Z",
    "context": { ... },
    "executionTrace": [
      {
        "timestamp": "2025-02-17T10:05:00Z",
        "step": "reading_invoice",
        "status": "completed"
      },
      {
        "timestamp": "2025-02-17T10:06:00Z",
        "step": "validating_amount",
        "status": "in_progress"
      }
    ]
  }
}
```

#### Update Task Status
```
PATCH /api/tasks/:taskId

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "status": "completed"
}

Response (200):
{
  "status": "success",
  "data": { ... }
}
```

---

### 4. Workflow Endpoints

#### List Workflows
```
GET /api/workflows

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "wf_001",
      "name": "Sales Pipeline",
      "description": "Lead capture to closing",
      "status": "active",
      "steps": 5,
      "agents": 3,
      "triggeredCount": 42,
      "createdAt": "2025-02-10T00:00:00Z"
    },
    ...
  ]
}
```

#### Create Workflow
```
POST /api/workflows

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "name": "Invoice Processing",
  "description": "Complete invoice-to-payment workflow",
  "steps": [
    {
      "id": "step_1",
      "type": "trigger",
      "trigger": "invoice_received",
      "config": {}
    },
    {
      "id": "step_2",
      "type": "agent_action",
      "agentId": "agt_002",
      "action": "validate_invoice",
      "config": { "checkAmount": true }
    },
    {
      "id": "step_3",
      "type": "condition",
      "condition": "validationPassed",
      "yesStep": "step_4",
      "noStep": "step_reject"
    },
    {
      "id": "step_4",
      "type": "agent_action",
      "agentId": "agt_002",
      "action": "process_payment",
      "config": {}
    },
    {
      "id": "step_reject",
      "type": "notification",
      "target": "user",
      "message": "Invoice rejected"
    }
  ]
}

Response (201):
{
  "status": "success",
  "data": {
    "id": "wf_002",
    "name": "Invoice Processing",
    ...
  }
}
```

#### Execute Workflow
```
POST /api/workflows/:workflowId/execute

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "context": {
    "invoiceId": "inv_123",
    "amount": 5000
  }
}

Response (202):
{
  "status": "success",
  "data": {
    "executionId": "exec_001",
    "workflowId": "wf_002",
    "status": "running",
    "currentStep": "step_1"
  }
}
```

#### Get Workflow Execution Status
```
GET /api/workflows/:workflowId/executions/:executionId

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "executionId": "exec_001",
    "workflowId": "wf_002",
    "status": "completed",
    "progress": 100,
    "steps": [
      {
        "stepId": "step_1",
        "status": "completed",
        "startedAt": "2025-02-17T10:00:00Z",
        "completedAt": "2025-02-17T10:01:00Z"
      },
      { ... }
    ],
    "result": {
      "invoiceProcessed": true,
      "paymentId": "pay_001"
    }
  }
}
```

---

### 5. Memory & Knowledge Endpoints

#### Query Memory
```
POST /api/memory/query

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "query": "What are our sales targets for Q2?",
  "type": "semantic",
  "limit": 5
}

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "mem_123",
      "content": "Q2 sales target is $500k for enterprise segment",
      "source": "strategy_doc",
      "relevance": 0.95,
      "createdAt": "2025-02-15T00:00:00Z"
    },
    ...
  ]
}
```

#### Store Memory
```
POST /api/memory/store

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "content": "Decision: Hire 5 new sales representatives",
  "type": "decision",
  "reference": "mtg_001",
  "tags": ["hr", "hiring", "sales"]
}

Response (201):
{
  "status": "success",
  "data": {
    "id": "mem_124",
    "content": "...",
    "createdAt": "2025-02-17T15:00:00Z"
  }
}
```

---

### 6. Approval Endpoints

#### List Pending Approvals
```
GET /api/approvals?status=pending&agentId=agt_001

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "apr_001",
      "type": "budget_approval",
      "agentId": "agt_002",
      "agentName": "Finance Agent",
      "title": "Approve Payment of $50,000",
      "description": "Invoice INV-2025-001 from Acme Suppliers",
      "status": "pending",
      "requestedAt": "2025-02-17T10:00:00Z",
      "expiresAt": "2025-02-18T10:00:00Z",
      "context": {
        "amount": 50000,
        "vendor": "Acme Suppliers",
        "invoiceId": "inv_123"
      }
    },
    ...
  ]
}
```

#### Get Approval Details
```
GET /api/approvals/:approvalId

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "id": "apr_001",
    "type": "budget_approval",
    "agentId": "agt_002",
    "title": "Approve Payment of $50,000",
    "status": "pending",
    "requestedAt": "2025-02-17T10:00:00Z",
    "expiresAt": "2025-02-18T10:00:00Z",
    "context": { ... },
    "reasoning": "Invoice from Acme Suppliers for monthly services. Within budget."
  }
}
```

#### Approve Request
```
PUT /api/approvals/:approvalId/approve

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "comment": "Approved. Vendor is verified and amount matches invoice."
}

Response (200):
{
  "status": "success",
  "data": {
    "id": "apr_001",
    "status": "approved",
    "approvedAt": "2025-02-17T15:30:00Z",
    "approvedBy": "usr_123"
  }
}
```

#### Reject Request
```
PUT /api/approvals/:approvalId/reject

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "reason": "Please resubmit with updated invoice from supplier."
}

Response (200):
{
  "status": "success",
  "data": {
    "id": "apr_001",
    "status": "rejected",
    "rejectedAt": "2025-02-17T15:35:00Z",
    "rejectedBy": "usr_123",
    "reason": "Please resubmit with updated invoice from supplier."
  }
}
```

---

### 7. Analytics Endpoints

#### Get Agent Analytics
```
GET /api/analytics/agents/:agentId?period=week

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "agentId": "agt_001",
    "period": "week",
    "metrics": {
      "tasksCompleted": 28,
      "tasksRetried": 2,
      "tasksFailed": 1,
      "successRate": 0.965,
      "avgCompletionTime": 145000,
      "costTotal": 127.50,
      "costAverage": 4.55
    },
    "timeline": [
      {
        "date": "2025-02-11",
        "tasksCompleted": 4,
        "cost": 18.00
      },
      ...
    ]
  }
}
```

#### Get Tenant Analytics
```
GET /api/analytics/tenant?period=month

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "tenantId": "tnt_123",
    "period": "month",
    "metrics": {
      "revenue": 2340.50,
      "costs": 1205.25,
      "profit": 1135.25,
      "profitMargin": 0.485,
      "agentsActive": 8,
      "tasksCompleted": 412,
      "successRate": 0.972
    },
    "breakdown": {
      "byAgent": [ ... ],
      "byDepartment": [ ... ]
    }
  }
}
```

---

### 8. Settings Endpoints (Tenant Admin)

#### Get Tenant Settings
```
GET /api/settings

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": {
    "tenantId": "tnt_123",
    "name": "Acme Corp",
    "plan": "pro",
    "settings": {
      "authorityLevels": {
        "auto_limit": 10000,
        "recommend_limit": 50000,
        "approval_limit": null
      },
      "notifications": {
        "taskCompleted": true,
        "taskFailed": true,
        "approvalNeeded": true,
        "agentError": true,
        "costWarning": true
      },
      "apiKeys": [
        {
          "id": "key_001",
          "name": "Production",
          "created_at": "2025-02-10T00:00:00Z",
          "last_used": "2025-02-17T14:00:00Z"
        }
      ]
    }
  }
}
```

#### Update Settings
```
PUT /api/settings

Headers:
Authorization: Bearer <jwt_token>

Request Body:
{
  "settings": {
    "authorityLevels": {
      "auto_limit": 15000
    },
    "notifications": {
      "costWarning": false
    }
  }
}

Response (200):
{
  "status": "success",
  "data": { ... }
}
```

---

### 9. Super Admin Endpoints

#### List All Tenants
```
GET /api/admin/tenants?page=1&limit=20&status=active

Headers:
Authorization: Bearer <jwt_token> (admin only)

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "tnt_001",
      "name": "Acme Corp",
      "plan": "pro",
      "agentCount": 12,
      "activeAgents": 8,
      "monthlyUsage": 2340.50,
      "monthlyLimit": 5000.00,
      "status": "active",
      "riskScore": 0.15,
      "createdAt": "2025-01-15T00:00:00Z"
    },
    ...
  ],
  "meta": { ... }
}
```

#### Get Tenant Details (Admin View)
```
GET /api/admin/tenants/:tenantId

Headers:
Authorization: Bearer <jwt_token> (admin only)

Response (200):
{
  "status": "success",
  "data": {
    "id": "tnt_001",
    "name": "Acme Corp",
    "plan": "pro",
    "billingEmail": "billing@acme.com",
    "contacts": [
      {
        "name": "John Doe",
        "email": "john@acme.com",
        "role": "owner"
      }
    ],
    "agents": [
      {
        "id": "agt_001",
        "name": "Sales Agent",
        "status": "running",
        "cost_month": 245.50
      },
      ...
    ],
    "subscriptionInfo": {
      "plan": "pro",
      "billingCycle": "monthly",
      "nextBillingDate": "2025-03-15T00:00:00Z",
      "autoRenew": true
    },
    "usage": {
      "agentsUsed": 8,
      "agentLimit": 50,
      "tokensUsed": 2500000,
      "apiCalls": 45000
    },
    "riskAssessment": {
      "score": 0.15,
      "factors": ["high_spending_growth"]
    }
  }
}
```

#### Suspend Tenant
```
POST /api/admin/tenants/:tenantId/suspend

Headers:
Authorization: Bearer <jwt_token> (admin only)

Request Body:
{
  "reason": "Payment overdue"
}

Response (200):
{
  "status": "success",
  "data": {
    "id": "tnt_001",
    "status": "suspended"
  }
}
```

#### Get Platform Metrics
```
GET /api/admin/metrics?period=hour

Headers:
Authorization: Bearer <jwt_token> (admin only)

Response (200):
{
  "status": "success",
  "data": {
    "tenants": {
      "total": 245,
      "active": 212,
      "suspended": 15,
      "churn_rate": 0.02
    },
    "agents": {
      "total": 2847,
      "running": 1923,
      "paused": 924,
      "success_rate": 0.971
    },
    "system": {
      "apiLatency": 125,  // ms
      "errorRate": 0.002,
      "gpuLoad": 0.65,
      "queueDepth": 342
    },
    "revenue": {
      "hourly": 1250.50,
      "daily": 30012.00,
      "monthly": 920000.00
    }
  }
}
```

---

### 10. Governance & Audit Endpoints

#### Get Audit Log
```
GET /api/audit?agentId=agt_001&action=execute&limit=100

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "aud_001",
      "timestamp": "2025-02-17T14:30:00Z",
      "actor": "agt_001",
      "action": "execute_tool",
      "resource": "email_service",
      "result": "success",
      "details": {
        "toolName": "send_email",
        "recipient": "customer@example.com",
        "subject": "Sales Proposal"
      }
    },
    ...
  ]
}
```

#### Get Governance Rules
```
GET /api/governance/rules

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "rule_001",
      "type": "spending_limit",
      "agentId": "agt_001",
      "limit": 100.00,
      "period": "daily",
      "enabled": true
    },
    {
      "id": "rule_002",
      "type": "authority_scope",
      "agentId": "agt_002",
      "maxApprovalAmount": 50000,
      "enabled": true
    }
  ]
}
```

---

## WebSocket Events

### Connection
```javascript
// Frontend
import io from 'socket.io-client';

const socket = io('http://localhost:3000/socket', {
  auth: {
    token: '<jwt_token>'
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

### Server → Client Events

#### Agent Status Update
```javascript
socket.on('agent:status_updated', (data) => {
  {
    "agentId": "agt_001",
    "status": "running",
    "workload": 75,
    "lastTaskCompleted": "2025-02-17T15:30:00Z"
  }
});
```

#### Task Completed
```javascript
socket.on('task:completed', (data) => {
  {
    "taskId": "tsk_001",
    "agentId": "agt_002",
    "completedAt": "2025-02-17T15:35:00Z",
    "result": {
      "success": true,
      "output": "Invoice INV-002 processed"
    }
  }
});
```

#### Task Failed
```javascript
socket.on('task:failed', (data) => {
  {
    "taskId": "tsk_002",
    "agentId": "agt_001",
    "failedAt": "2025-02-17T15:40:00Z",
    "error": {
      "code": "EXTERNAL_API_ERROR",
      "message": "Failed to call payment API"
    },
    "retryCount": 2
  }
});
```

#### Approval Pending
```javascript
socket.on('approval:pending', (data) => {
  {
    "approvalId": "apr_001",
    "type": "budget_approval",
    "title": "Approve Payment of $50,000",
    "agentId": "agt_002",
    "createdAt": "2025-02-17T15:30:00Z"
  }
});
```

#### System Alert
```javascript
socket.on('system:alert', (data) => {
  {
    "level": "warning",
    "type": "spending_threshold",
    "message": "Agent agt_001 approaching daily spending limit",
    "timestamp": "2025-02-17T15:45:00Z"
  }
});
```

#### Execution Trace Step
```javascript
socket.on('execution:trace_step', (data) => {
  {
    "taskId": "tsk_001",
    "step": "validating_invoice",
    "status": "in_progress",
    "progress": 45,
    "timestamp": "2025-02-17T15:46:00Z"
  }
});
```

### Client → Server Events

#### Request Agent Status
```javascript
socket.emit('agent:request_status', {
  agentId: 'agt_001'
}, (response) => {
  console.log(response);
  // {
  //   "agentId": "agt_001",
  //   "status": "running",
  //   ...
  // }
});
```

#### Execute Task
```javascript
socket.emit('task:execute', {
  taskId: 'tsk_001'
}, (response) => {
  console.log(response);
});
```

---

## Error Response Format

All errors follow consistent format:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "User-friendly error message",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-02-17T15:50:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Codes
```
INVALID_REQUEST        - 400
AUTHENTICATION_FAILED  - 401
PERMISSION_DENIED      - 403
NOT_FOUND             - 404
CONFLICT              - 409
RATE_LIMIT_EXCEEDED   - 429
INTERNAL_ERROR        - 500
SERVICE_UNAVAILABLE   - 503
```

---

## Rate Limiting

All endpoints are rate-limited:
```
Tier                  Requests/Minute
Standard User         60
Admin User           300
Batch Operations     1000
```

Rate limit headers in response:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1613569200
```

---

## Pagination

All list endpoints support:
```
GET /api/agents?page=2&limit=20&sort=-createdAt

Response:
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "total": 245,
    "page": 2,
    "limit": 20,
    "totalPages": 13,
    "hasMore": true
  }
}
```

---

## Frontend Implementation Reference

### Example: React Hook for Agent API

```typescript
// hooks/useAgent.ts
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const useAgent = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/agents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAgents(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (agentData) => {
    try {
      const response = await axios.post(`${API_BASE}/agents`, agentData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAgents(prev => [...prev, response.data.data]);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create agent');
      throw err;
    }
  }, []);

  return { agents, loading, error, fetchAgents, createAgent };
};
```

---

## Deployment & Environment

### Environment Variables (Backend)
```
# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.neurecore.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/neurecore

# Cache
REDIS_URL=redis://host:6379/0

# Authentication
JWT_SECRET=<long-random-secret>
JWT_EXPIRE=7d

# External APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email
SENDGRID_API_KEY=SG.xxx

# Monitoring
SENTRY_DSN=https://...
```

### Environment Variables (Frontend)
```
NEXT_PUBLIC_API_URL=https://api.neurecore.com/api
NEXT_PUBLIC_SOCKET_URL=wss://api.neurecore.com/socket
NEXTAUTH_URL=https://app.neurecore.com
```

---

**API Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Complete Specification
