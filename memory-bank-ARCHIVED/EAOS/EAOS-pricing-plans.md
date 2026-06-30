# NeureCore — Pricing & Plans

**Document Version:** 1.2  
**Date:** 2026-06-27  
**Status:** Pricing Specification  
**Audience:** Product, Sales, Marketing, Finance  
**Supersedes:** v1.1 (v1.2 confirms AI Roster = dedicated `/ai-roster` route, distinct from existing `/agents` page; resolves §14.2 Q6 in `EAOS-implementation-plan.md` v2.6)  

---

## 0. Pricing Philosophy

**The old model:** SaaS companies priced by seats — $10/user/month. This made sense in 2005 for tools like Salesforce. But it creates perverse incentives: hide users, split accounts, avoid growth.

**NeureCore's model:** An Enterprise AI Operating System is not a tool your employees use. It is the operating layer of your organization. You do not price an operating system per employee.

**Charge for three things:**

| Dimension | What It Represents |
|---|---|
| **Organization Scale** | How large is the organization and how many business units it operates |
| **AI Capacity** | How much AI compute the organization consumes |
| **Solution Packs** | Which vertical industries and specialized capabilities are enabled |

**What never affects pricing:**
Users, departments, projects, tasks, workflows, dashboards, widgets, reports, AI employees (count), storage (within generous limits), workflows created, integrations connected.

These are platform capabilities, not billing units.

**The psychological principle:** "Unlimited AI Employees" sounds better than "100 AI Employees, extra $5 each." People understand compute credits. They do not understand arbitrary seat counts.

### 0a. UI Implication of "Unlimited AI Employees" (NEW in v1.1, updated in v1.2)

> **The pricing promise creates a UI requirement.** "Unlimited AI Employees" is only credible if users can (a) easily browse, (b) clearly distinguish, and (c) safely manage the AI workforce. Without this, customers perceive the promise as "unlimited, but how do I see them?"

A dedicated **AI Roster** surface is therefore required at every paid tier. It is **not a billing unit**; it is a navigation/management surface. Detailed UX contract is in `EAOS-NUWS-principles.md` v1.1; this document records the requirement.

**Required AI Roster capabilities:**

| Capability | Purpose |
|---|---|
| **Browse all AI Employees** | Filterable grid: by department, role, status (idle/busy/error/offline), sub-state |
| **Distinguish instances** | Each AI Employee has a unique identity (avatar, name, sub-state). Multiple instances of the same template are visibly different. |
| **Group by template** | "All 12 Campaign AIs" — users see scale without losing instance identity. |
| **Per-instance activity** | Each AI Employee has its own workspace (per NUWS entity model). Clicking opens it. |
| **Cost attribution** | Each AI Employee shows credits consumed this period. Helps users understand the "AI Capacity" pricing dimension. |
| **Lifecycle controls** | Pause, resume, archive, deprecate from the Roster directly. |

**Routes (locked in v1.2):**
- `/ai-roster` — **dedicated management view** (per `EAOS-implementation-plan.md` v2.6 §14.2 Q6). **Distinct from `/agents`** — the existing `/agents` page (entity list filtered to AI_EMPLOYEE type) is insufficient because it lacks group-by-template, status filtering, lifecycle controls, and cost attribution. A separate route + UI is required.
- `/ai-roster?status=error` — filtered views
- Per-AI-Employee workspace at `/entity/ai-employee/{id}` (existing entity route)

**No UI gating by tier** — the Roster is available at all paid tiers. The pricing dimension is **AI Credits** consumed, not the count of AI Employees displayed.

---

## 1. Platform Tiers

### 1.1 Tier Overview

| | Community | Starter | Business | Enterprise |
|---|---|---|---|---|
| **Target** | Individuals, students, experiments | Small businesses | Growing companies | Large enterprises |
| **Price** | Free | $299/month | $999/month | Custom |
| **AI Credits** | 10,000/month | 100,000/month | 2,000,000/month | Unlimited |
| **Organizations** | 1 | 1 | Unlimited | Unlimited |
| **Human Users** | 5 | 25 | Unlimited | Unlimited |
| **AI Employees** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Solution Packs Included** | Corporate Services | Corporate Services | Corporate Services + 2 | All + Custom |
| **API Access** | — | ✅ Read/Write | ✅ Read/Write | ✅ Full |
| **SSO** | — | — | Optional | Included |
| **Deployment** | Self-host | Cloud SaaS or Self-host | Cloud SaaS or Self-host | Cloud SaaS, Self-host, or Air-Gapped |
| **SLA** | — | 99.5% | 99.9% | 99.99% + Dedicated |
| **Support** | Community Forum | Business Hours | Priority Response | Dedicated CSM |

---

### 1.2 Community (Free)

**Who it's for:** Individuals exploring AI orchestration, students learning enterprise AI systems, small experiments and prototypes.

**What you get:**

```
Included
├── 1 Organization
├── 5 Human Users
├── Unlimited AI Employees
├── 10,000 AI Credits / month
├── Corporate Services Solution Pack
│   ├── All core departments (Sales, Marketing, HR, Finance, etc.)
│   ├── Core AI Actions
│   └── Core widgets
├── Community Support Forum
└── Self-host Deployment

Not included
├── SLA
├── API Access
├── SSO
├── Marketplace publishing
└── Additional Solution Packs
```

**Ideal for:** Solo founders testing AI orchestration, academic research, internal tooling experiments, evaluating NeureCore before committing.

**Constraint:** Cannot connect to production external systems. Intended for learning and experimentation only.

---

### 1.3 Starter — $299/month

**Who it's for:** Small businesses (up to 25 employees) running a single business unit.

**What you get:**

```
Everything in Community, plus:
├── 1 Organization
├── 25 Human Users
├── Unlimited AI Employees
├── 100,000 AI Credits / month
├── Corporate Services Solution Pack
├── 2 Additional Solution Packs (e.g., Retail, or Manufacturing)
├── Full API Access (Read/Write)
├── Business Hours Support
├── Cloud SaaS or Self-host Deployment
├── 99.5% Uptime SLA
└── Basic Integrations (Google Workspace, Slack)

Additional Solution Packs available:
  +$49/month each
```

**AI Credits behavior:**
- 100,000 credits = approximately 50,000 AI Actions (at ~2 credits/action average)
- Overage: $0.003/credit (approximately $0.006/action)

**Ideal for:** A single-location business, a small professional services firm, a startup with one product line.

---

### 1.4 Business — $999/month

**Who it's for:** Growing companies with multiple departments, teams, or product lines.

**What you get:**

```
Everything in Starter, plus:
├── Unlimited Organizations (each with own data isolation)
├── Unlimited Human Users
├── Unlimited AI Employees
├── 2,000,000 AI Credits / month
├── Corporate Services Solution Pack (included)
├── All Solution Packs included (Retail, Manufacturing, Healthcare, etc.)
├── Advanced API Access (webhooks, bulk operations, admin endpoints)
├── Optional SSO (SAML/OIDC integration)
├── Cloud SaaS or Self-host Deployment
├── 99.9% Uptime SLA
├── Priority Support Response (< 4 hours)
├── Advanced Integrations (Salesforce, SAP, HubSpot, etc.)
├── AI Analytics Dashboard
│   ├── AI Cost by Department
│   ├── AI Utilization Rate
│   ├── Automation Coverage
│   └── ROI Dashboard
└── Marketplace Publishing
    ├── Publish AI Employees
    ├── Publish Widgets
    ├── Publish Workflows
    └── Publish Knowledge Packs

Overage: $0.002/credit (volume discount)
```

**AI Credits behavior:**
- 2,000,000 credits = approximately 1,000,000 AI Actions
- Overages billed monthly at volume rate

**Ideal for:** Companies with multiple departments, growing AI agent fleets, companies ready to build industry-specific workflows.

---

### 1.5 Enterprise — Custom Pricing

**Who it's for:** Large enterprises, multi-national organizations, regulated industries (healthcare, banking, government, defense).

**What you get:**

```
Everything in Business, plus:
├── Unlimited AI Credits (negotiated volume or unlimited)
├── Dedicated AI Model Infrastructure
│   ├── Private AI cluster
│   ├── Custom model fine-tuning
│   └── On-premises deployment option
├── Air-Gapped Deployment option
│   ├── Isolated network deployment
│   ├── Government-grade security
│   └── Compliance-ready (SOC2, HIPAA, FedRAMP, DISA)
├── Full SSO (SAML, OIDC, LDAP)
│   ├── SSO Configuration Assistance
│   └── 24/7 SSO Support
├── Dedicated Customer Success Manager
├── 99.99% Uptime SLA
├── Dedicated Infrastructure
│   ├── Multi-region active-active
│   ├── High Availability configuration
│   └── Disaster Recovery
├── Compliance Package
│   ├── SOC 2 Type II
│   ├── HIPAA (with BAA)
│   ├── GDPR
│   ├── FedRAMP Moderate
│   ├── DISA IL4/IL5
│   └── Custom compliance requirements
├── White Label option
│   ├── Custom domain
│   ├── Branded AI Employees
│   └── Custom login experience
├── Enterprise Services (see §5)
│   ├── Migration
│   ├── Training
│   └── Dedicated Consulting
└── Negotiated volume pricing
```

**Pricing model:**
- Base platform: Starting at $5,000/month
- AI Credits: Volume negotiated (10M+ credits/month qualifies for discounts)
- Enterprise Services: Priced separately

**Ideal for:** Organizations that need dedicated infrastructure, compliance certifications, or white-label capabilities.

---

## 2. AI Credits System

### 2.1 What Are AI Credits?

AI Credits are the universal currency for AI compute in NeureCore. Every AI Action — from a simple `ai:summary` to a complex `ai:forecast` — consumes credits based on its complexity.

**Why credits instead of per-action pricing:**
- Simpler to understand: "I have 100,000 credits" vs "how many summaries can I run?"
- Predictable budgeting: teams understand their monthly allocation
- Fair: complex actions cost more, simple actions cost less
- Scalable: new AI actions automatically fit the model

### 2.2 Credit Consumption by Action Type

| Action Category | Example Actions | Credits/Action | Notes |
|---|---|---|---|
| **Intelligence** | `ai:summary`, `ai:explain` | 2-5 | Light — mostly text generation |
| **Analysis** | `ai:analyze`, `ai:risks`, `ai:recommend` | 5-15 | Medium — LLM reasoning + data |
| **Optimization** | `ai:optimize`, `ai:forecast` | 15-40 | Heavy — multi-step reasoning |
| **Execution** | `ai:delegate`, `ai:workflow:create` | 10-25 | Medium-heavy — creates entities |
| **Reporting** | `ai:report` (standard) | 20-50 | Heavy — multi-section document generation |
| **Reporting** | `ai:report` (comprehensive) | 100-200 | Very heavy — full analytical report |
| **Knowledge: RAG Ask** | `ai:ask` (knowledge query) | 8-20 | Depends on knowledge size |
| **Knowledge: Search** | `ai:search` | 2-5 | Light — retrieval only |

**Credit estimation factors:**
- Token count (input + output)
- LLM model used (MiniMax is base; premium models like GPT-4o cost 5-10x more)
- Knowledge context loaded (RAG queries with large context cost more)
- Execution time (streaming vs blocking)

### 2.3 Credit Display in UI

Every workspace shows:

```
AI Credits — [MONTH]
████████████████████░░░░  1,847,000 / 2,000,000  (92%)
Used this month: $1,847.00 at $0.002/credit
Projected overage: +$127.00

[Request More Credits]  [View Usage Breakdown]
```

Department-level view shows each team's credit consumption.

### 2.4 Credit Pools (Enterprise)

Enterprise tier supports nested credit pools:

```
Enterprise (10,000,000 credits)
├── Finance Department (2,000,000)
├── Sales Department (3,000,000)
├── Operations (2,000,000)
└── R&D (3,000,000)
    └── Overflow draws from shared pool
```

Departments can have reserved allocations with optional overflow from the enterprise pool.

---

## 3. Solution Packs

### 3.1 Philosophy

Solution Packs are how NeureCore extends from a platform into an industry-specific AI OS.

The **Corporate Services** pack is included in every paid edition. It provides the departments, AI employees, workflows, and knowledge that every business needs regardless of industry.

Vertical packs (Retail, Manufacturing, Healthcare, etc.) are add-ons that transform NeureCore from a generic business platform into a specialized industry solution.

### 3.2 Corporate Services (Included in All Paid Editions)

Every Starter, Business, and Enterprise subscription includes:

```
Corporate Services Solution Pack
├── Departments
│   ├── Sales
│   ├── Marketing
│   ├── Operations
│   ├── Finance
│   ├── Human Resources
│   ├── Customer Support
│   ├── IT Administration
│   ├── Research & Development
│   └── Executive
│
├── AI Employees (per department)
│   ├── Department Director AI (1 per dept)
│   ├── Coordinator AI (2-3 per dept)
│   └── Specialist AIs (5-10 per dept)
│
├── Knowledge Base
│   ├── Company Policies
│   ├── Standard Operating Procedures
│   ├── Communication Templates
│   ├── HR Playbooks
│   └── Brand Guidelines
│
├── Workflows
│   ├── Employee Onboarding
│   ├── Budget Approval
│   ├── Project Initiation
│   ├── Customer Escalation
│   └── Performance Review
│
├── Widgets
│   ├── Financial KPIs
│   ├── Workforce Dashboard
│   ├── Project Tracker
│   └── Customer Health
│
└── Integrations
    ├── Google Workspace
    ├── Slack
    └── Microsoft 365 (Business tier+)
```

This means a company can subscribe to NeureCore Business and have a fully functional enterprise AI OS on day one — without purchasing any additional packs.

### 3.3 Vertical Solution Packs

| Pack | Description | AI Employees | Packs Included | Price |
|---|---|---|---|---|
| **Retail** | Store operations, e-commerce, inventory, visual merchandising, loss prevention | 18 | Corporate Services + Retail | +$199/month |
| **Manufacturing** | Production planning, quality control, supply chain, maintenance, safety | 22 | Corporate Services + Manufacturing | +$299/month |
| **Healthcare** | Patient services, clinical operations, revenue cycle, compliance, care coordination | 26 | Corporate Services + Healthcare | +$399/month |
| **Logistics** | Warehouse operations, fleet management, route optimization, supply chain | 20 | Corporate Services + Logistics | +$249/month |
| **Agriculture** | Farm operations, crop management, IoT sensors, yield forecasting | 16 | Corporate Services + Agriculture | +$199/month |
| **Hospitality** | Guest services, housekeeping, food & beverage, event management | 18 | Corporate Services + Hospitality | +$199/month |
| **Construction** | Project management, safety compliance, equipment tracking, contractor management | 20 | Corporate Services + Construction | +$249/month |
| **Public Health** | Population health, disease surveillance, immunization, reporting | 24 | Corporate Services + Public Health | +$349/month |
| **Education** | Student services, enrollment, academic operations, compliance | 18 | Corporate Services + Education | +$199/month |
| **Government** | Citizen services, case management, compliance, public records | 22 | Corporate Services + Government | +$299/month |

**All packs include:**
- Industry-specific departments and sub-departments
- Pre-configured AI employees with industry knowledge
- Industry-specific workflows and automations
- Knowledge base with industry regulations and best practices
- Industry-specific widgets and KPI dashboards
- Pre-built integrations with industry-standard software

### 3.4 Solution Pack Bundle (Enterprise)

Enterprise customers can select any combination of vertical packs. Volume discounts apply:

| Packs Selected | Discount |
|---|---|
| 1-2 packs | 0% |
| 3-4 packs | 10% |
| 5-6 packs | 20% |
| 7+ packs | 30% |

---

## 4. NeureCore Marketplace

### 4.1 What Can Be Published

The NeureCore Marketplace allows third parties to publish extensions:

| Item | Description | Credit Model |
|---|---|---|
| **AI Employees** | Specialized AI agents with domain expertise | Free to publish; consumers use own AI Credits |
| **Widgets** | Specialized visualizations for specific data types | Free to publish |
| **Workflows** | Pre-built automation templates | Free to publish |
| **Knowledge Packs** | Curated knowledge bundles (regulations, best practices, playbooks) | Publishers set price (credits or free) |
| **Prompt Packs** | Collections of optimized prompts for specific domains | Publishers set price |
| **Industry Packs** | Full vertical solutions (like our Retail Pack but from partners) | Publishers set price |

### 4.2 Revenue Split

NeureCore operates on a **70/30 split** — industry standard for platform marketplaces.

```
Revenue from sale
├── Publisher receives: 70%
└── NeureCore retains: 30%
    ├── Platform infrastructure: 20%
    └── Marketplace operations: 10%
```

**For free items:** Publishers receive 100%. NeureCore covers infrastructure costs.

### 4.3 Marketplace Tiers for Publishers

| | Free | Publisher Pro | Publisher Enterprise |
|---|---|---|---|
| **Fee** | Free | $49/month | $499/month |
| **Revenue split** | 70/30 | 85/15 | 95/5** |
| **AI Employees** | 5 | 50 | Unlimited |
| **Knowledge Packs** | 10 | 100 | Unlimited |
| **Analytics** | Basic | Advanced | Enterprise |
| **Promotion** | Community listing | Featured placement | Custom marketing |

**Enterprise split is 95/5 with minimum $10,000/month guarantee.

---

## 5. Enterprise Services

Enterprise Services are optional professional services for organizations that need additional support.

### 5.1 Service Catalog

| Service | Description | Pricing |
|---|---|---|
| **Migration** | Migrate data from existing systems (CRM, HRIS, ERP) into NeureCore | From $5,000 (scoped by data volume) |
| **Implementation** | Guided deployment and configuration of NeureCore for your organization | From $10,000 (scoped by complexity) |
| **Training** | Administrator training, AI employee configuration, workflow building | $500/day per trainee |
| **Custom AI Model Fine-tuning** | Fine-tune AI models on your proprietary data | From $25,000 (scoped by dataset size) |
| **Dedicated AI Model Hosting** | Private AI cluster for your organization | From $15,000/month |
| **Managed Hosting** | We manage your self-hosted or air-gapped deployment | From $8,000/month |
| **White Label Deployment** | Full rebrand of NeureCore for your customers | From $50,000 (one-time) + $20,000/month |
| **Compliance Consulting** | Help achieve HIPAA, FedRAMP, SOC2, GDPR compliance | From $15,000 (scoped by scope) |
| **Strategy Consulting** | AI readiness assessment, process mapping, roadmap planning | $1,500/day |

### 5.2 Implementation Packages

| Package | What's Included | Price |
|---|---|---|
| **Quick Start** | 5-day implementation, initial configuration, admin training, go-live support | $5,000 |
| **Standard** | 30-day implementation, full configuration, workflow building, team training, 90-day support | $25,000 |
| **Enterprise** | Custom timeline, dedicated implementation team, ongoing optimization, quarterly reviews | Custom (from $100,000) |

---

## 6. Deployment Options

### 6.1 Cloud SaaS (All Paid Tiers)

NeureCore manages the infrastructure. You sign up and go.

```
What's included:
├── NeureCore-managed infrastructure
├── Automatic updates and patches
├── Daily backups
├── DDoS protection
├── CDN-backed global delivery
└── 24/7 infrastructure monitoring

Your responsibility:
├── Configure your organization
├── Manage users and permissions
└── Build your AI employees and workflows
```

### 6.2 Self-Hosted (Starter, Business, Enterprise)

You deploy NeureCore on your own infrastructure (AWS, Azure, GCP, on-premises).

```
What's included:
├── NeureCore software license
├── Installation documentation
├── Helm chart / Docker Compose
├── 1 year of software updates
├── Security patches
└── Tier-appropriate support

Your responsibility:
├── Infrastructure provisioning
├── Backup management
├── Security hardening
├── Network configuration
└── SSL certificates

Annual license: $599/month (Starter), $1,999/month (Business), Custom (Enterprise)
```

### 6.3 Air-Gapped (Enterprise Only)

For organizations that cannot connect to the internet: defense, intelligence, healthcare systems, certain government agencies.

```
What's included:
├── Air-gapped software distribution (DVD or secure transfer)
├── On-site installation support
├── Quarterly patch delivery via secure media
├── Dedicated security review
├── Compliance documentation package
└── Isolated update infrastructure

Requirements:
├── Dedicated server meeting minimum specs
├── Secure facility certification
└── Named point of contact for security coordination

Pricing: Custom (starting at $25,000/month)
```

---

## 7. What Affects Pricing

### 7.1 Factors That DO Affect Pricing

| Factor | Why |
|---|---|
| **Number of AI Credits** | AI compute is the primary cost driver. More credits = more AI actions. |
| **Deployment type** | Air-gapped and self-hosted require additional infrastructure and support. |
| **Compliance requirements** | HIPAA BAA, FedRAMP, DISA add verification and documentation costs. |
| **Enterprise Services** | Migration, training, consulting are billed separately. |
| **Solution Packs** | Vertical packs beyond Corporate Services are billed per pack. |
| **Custom AI models** | Fine-tuning and private hosting require dedicated GPU resources. |

### 7.2 Factors That NEVER Affect Pricing

| Factor | Why It's Free | Impact |
|---|---|---|
| **Human users** | An OS doesn't charge per person using it | Removes seat-counting friction |
| **AI employee count** | Unlimited AI employees within AI Credit budget | Removes artificial limits |
| **Departments** | Core platform capability | Encourages proper organizational structure |
| **Projects, tasks, workflows** | Core platform capability | No penalty for detailed work management |
| **Dashboards, widgets, reports** | Core platform capability | Encourages data-driven decisions |
| **Storage** | Within generous limits (100GB/user) | No penalty for knowledge accumulation |
| **API calls** | Within AI Credit budget | Encourages integration |
| **Integrations connected** | Core platform capability | No penalty for connecting systems |

---

## 8. Plan Comparison Matrix

| Feature | Community | Starter | Business | Enterprise |
|---|---|---|---|---|
| **Organizations** | 1 | 1 | Unlimited | Unlimited |
| **Human Users** | 5 | 25 | Unlimited | Unlimited |
| **AI Employees** | Unlimited | Unlimited | Unlimited | Unlimited |
| **AI Credits / month** | 10,000 | 100,000 | 2,000,000 | Unlimited |
| **Solution Packs Included** | — | Corporate + 2 | Corporate + All | Corporate + All + Custom |
| **Corporate Services Pack** | — | ✅ | ✅ | ✅ |
| **Vertical Solution Packs** | — | 2 included | All included | All + custom |
| **API Access** | — | ✅ Read/Write | ✅ Read/Write | ✅ Full |
| **Marketplace Publishing** | — | — | ✅ | ✅ |
| **SSO** | — | — | Optional | ✅ Included |
| **Custom Branding** | — | — | — | ✅ |
| **Deployment** | Self-host | Cloud / Self | Cloud / Self | Cloud / Self / Air-gap |
| **SLA** | — | 99.5% | 99.9% | 99.99% |
| **Support** | Forum | Business Hours | Priority | Dedicated CSM |
| **AI Analytics** | — | Basic | Advanced | Enterprise |
| **Private AI Cluster** | — | — | — | ✅ |
| **Custom AI Models** | — | — | — | ✅ |
| **White Label** | — | — | — | ✅ |
| **Compliance Add-ons** | — | — | — | ✅ HIPAA, FedRAMP, DISA |
| **Migration Services** | — | — | Available | Available |
| **Training** | — | Available | Available | Dedicated program |
| **Price / month** | Free | $299 | $999 | Custom (from $5,000) |

---

## 9. Billing & Contracts

### 9.1 Billing Cycle

| Tier | Billing Cycle | Notes |
|---|---|---|
| Community | N/A | Free, no billing |
| Starter | Monthly or Annual | Annual = 2 months free |
| Business | Monthly or Annual | Annual = 2 months free |
| Enterprise | Annual or Multi-year | Multi-year discounts available |

**Annual billing discount:** 2 months free (effectively 14 months for the price of 12).

### 9.2 Overage Handling

- Credits do not roll over month-to-month (unless Enterprise negotiated rollover)
- Overages are billed at tier rate at month end
- Enterprise customers can set hard caps to prevent overages

### 9.3 Payment Methods

- Credit card (Stripe)
- ACH / Wire transfer (Business+)
- Purchase order (Enterprise)
- Invoice net-30 (Enterprise)

### 9.4 Cancellation

- Monthly plans: Cancel anytime, no refunds for current month
- Annual plans: Prorated refund for unused months minus 10% cancellation fee
- Enterprise: 90-day notice required

---

## 10. Free Trial

**30-day free trial** of Business tier for new customers.

```
During trial you get:
├── Full Business tier features
├── 500,000 AI Credits (not 2,000,000 but enough to evaluate)
├── All Solution Packs unlocked
├── Onboarding assistance
├── No credit card required
└── At end of trial: choose plan or downgrade to Community
```

Trial automatically converts to Starter (no credit card) or cancels based on user choice.

---

## 11. Plan Selection Guide

**Choose Community if:**
- You are an individual learning or experimenting
- You need a self-hosted AI OS for personal or educational use
- You have no production requirements

**Choose Starter if:**
- You run a small business with up to 25 people
- You need one organization's worth of AI orchestration
- 100,000 AI Credits covers your monthly usage

**Choose Business if:**
- You are a growing company with multiple departments or teams
- You need unlimited users and organizations
- You want all Solution Packs included
- You need API access and Marketplace publishing

**Choose Enterprise if:**
- You need dedicated infrastructure or private AI compute
- Your industry requires compliance certifications (HIPAA, FedRAMP)
- You need air-gapped deployment
- You require a dedicated Customer Success Manager
- You want white-label capabilities

---

## 12. Appendix: Credit Consumption Examples

### Example 1: Small Sales Team (Starter)

**Use case:** 15-person sales team using AI for lead research, proposal drafting, and meeting summaries.

**Monthly AI Actions estimated:**
- `ai:summary` (daily briefings): 15 × 30 = 450 × 3 credits = 1,350
- `ai:risks` (pipeline review, weekly): 4 × 10 credits = 40
- `ai:report` (weekly activity): 4 × 30 = 120 × 30 credits = 3,600
- `ai:explain` (on-demand analysis): 50 × 5 credits = 250
- `ai:delegate` (task creation): 100 × 15 = 1,500
- `ai:recommend` (next best action): 150 × 12 = 1,800

**Total estimated:** ~8,540 credits/month

**Starter allocation:** 100,000/month ✅

**Result:** Comfortably covers usage with room for growth.

---

### Example 2: Marketing Department (Business)

**Use case:** 50-person marketing department running campaigns, content generation, and analytics.

**Monthly AI Actions estimated:**
- `ai:report` (daily analytics): 30 × 50 = 1,500 credits
- `ai:content-generation` (via `ai:report`): 200 × 40 = 8,000
- `ai:analyze` (campaign performance): 100 × 15 = 1,500
- `ai:optimize` (budget allocation): 20 × 40 = 800
- `ai:forecast` (quarterly): 4 × 40 = 160
- `ai:delegate` (task orchestration): 500 × 15 = 7,500
- `ai:summary` (daily briefings): 50 × 30 = 1,500
- Knowledge queries (`ai:ask`): 300 × 15 = 4,500

**Total estimated:** ~25,460 credits/month

**Business allocation:** 2,000,000/month ✅

**Result:** Supports aggressive AI-first marketing operations with substantial headroom.

---

### Example 3: Manufacturing Operations (Enterprise with Manufacturing Pack)

**Use case:** 500-person manufacturing operation with 8 production facilities.

**Monthly AI Actions estimated:**
- Predictive maintenance alerts: 8,000 × 5 = 40,000
- Quality control analysis: 5,000 × 15 = 75,000
- Supply chain optimization: 2,000 × 40 = 80,000
- Production scheduling: 500 × 40 = 20,000
- AI employee coordination: 10,000 × 15 = 150,000
- Compliance reporting: 500 × 100 = 50,000
- Knowledge queries: 5,000 × 15 = 75,000

**Total estimated:** ~490,000 credits/month

**Enterprise negotiated:** 10,000,000/month (20x headroom) ✅

**Result:** Supports enterprise-scale AI operations with room for expansion across all 8 facilities.

---

## 13. Appendix: Glossary

| Term | Definition |
|---|---|
| **AI Credits** | Universal currency for AI compute. Every AI Action consumes credits based on complexity. |
| **Solution Pack** | A bundled collection of departments, AI employees, workflows, knowledge, and widgets for a specific industry or function. |
| **Corporate Services** | The default Solution Pack included in all paid editions — provides common business departments and AI employees. |
| **Vertical Pack** | Industry-specific Solution Pack (Retail, Manufacturing, Healthcare, etc.) that extends Corporate Services. |
| **Air-Gapped** | Deployment on isolated network with no internet connectivity — required for defense, intelligence, and certain government systems. |
| **AI Employee** | A specialized AI agent configured for a specific job function (e.g., Marketing Director AI, Sales Agent AI). |
| **AI Action** | A single invocation of AI capability: `ai:summary`, `ai:forecast`, `ai:delegate`, etc. |
| **SSO** | Single Sign-On — authentication via SAML, OIDC, or LDAP |
| **SLA** | Service Level Agreement — guaranteed uptime percentage |
| **Marketplace** | The NeureCore store where publishers sell AI Employees, Widgets, Workflows, and Knowledge Packs |
