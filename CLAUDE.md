# CLAUDE.md - Wind Finance Simulator

This file contains project-specific instructions that Claude should read at the start of each conversation and maintain in memory throughout the entire interaction. **IMPORTANT:** Once this file has been read or updated, it MUST be loaded at the beginning of any new conversation to ensure awareness of communication requirements, custom tasks, etc.

## 🚨 QUICK DECISION MATRIX - USE THIS FIRST
| Task Type | Primary Agent | Support Agents | Execution |
|-----------|--------------|----------------|-----------|
| Frontend Feature | frontend-feature-architect | api-data-architect, wind-finance-risk-analyst | Sequential |
| React Implementation | frontend-master-engineer | wind-finance-risk-analyst, documentation-manager | Parallel |
| Data Schema Design | api-data-architect | documentation-manager, wind-finance-risk-analyst | Parallel |
| Financial Modeling | wind-finance-risk-analyst | api-data-architect, documentation-manager | Sequential |
| Code Review/Validation | ALL agents | - | Parallel |
| Documentation | documentation-manager | api-data-architect (for schemas) | After changes |

## 🚨 CRITICAL RULES - MANDATORY COMPLIANCE
- **ALL** instructions within this document **MUST BE FOLLOWED** - these are not optional
- **ASK FOR CLARIFICATION** if uncertain about any instruction
- **MINIMIZE** code edits - only change what's necessary
- **CONSERVE TOKENS** - be succinct and precise

### Core Principles (ALWAYS ENFORCE):
1. **Edit existing files FIRST** - avoid new file creation
2. **Yup schemas drive EVERYTHING** - validation + Mongoose generation
3. **Context-first state management** - minimize local state
4. **Fail fast validation** - explicit error boundaries
5. **Antd design system** - consistent UI patterns
6. **Distribution-aware inputs** - support uncertainty modeling
7. **Git commits** - MUST follow @.claude/references/git-conventional-commits.md
8. **MANDATORY: USE SUB-AGENTS** - leverage specialized agents for ALL tasks

## 🎯 IMMEDIATE ACTION PROTOCOL

### ⚡ FIRST STEP: AGENT DELEGATION DECISION
**Before ANY coding task, IMMEDIATELY assess:**
1. **Is this a frontend task?** → Use **frontend-master-engineer** (MANDATORY)
2. **Need feature planning?** → Start with **frontend-feature-architect**
3. **Data/schema changes?** → Include **api-data-architect** + **documentation-manager**
4. **Financial/risk modeling?** → Involve **wind-finance-risk-analyst**
5. **ANY code changes?** → **ALWAYS** call **documentation-manager** to sync feature docs
6. **Feature folder exists?** → **documentation-manager** MUST update .md files in that folder

**Use PARALLEL execution whenever possible for maximum efficiency.**

## Default Mode

- **Sub-agent orchestration mode** is PRIMARY approach
- Architect mode should be enabled by default
- Focus on leveraging specialized agents for optimal results
- Provide detailed analysis, patterns, trade-offs, and architectural guidance

## Permissions

- Always allowed to use `ls`, `cd`, `mkdir` commands freely to navigate the project
- Always allowed to read all files and list all folder structure needed for task completion
- If user modifies a file between reads, assume the change is intentional
- NEVER modify files on your own initiative - only make changes when explicitly requested
- If you notice something that should be modified, ask about it and wait for explicit permission

## Project Overview
Wind farm financial modeling platform with React + Antd frontend, Express backend, and Monte Carlo simulation engine.

## Code Style Guidelines

- **Files/Components**: PascalCase for components, camelCase for utils/hooks
- **Types**: Strict typing, descriptive generics, no implicit any, named prop interfaces
- **Naming**: Function types use FunctionNameArgs, class options use ClassNameOptions, hook args use UseHookNameArgs, React component props use ComponentNameProps
- **Error Handling**: Custom error classes, i18n error messages, meaningful error types
- **Patterns**: Prefer immutability (const over let), no direct process.env usage, prefer ts-pattern over switch
- **Components**: One component per file, functional components with hooks
- **CSS**: Tailwind with twMerge for class composition
- **Dates**: Use Luxon over native Date objects
- **Type organization**: Don't create `index.ts` files in `types` directories to re-export types, import directly from individual type files
- **Comments**:
  - Use minimal comments and only in English
  - Add comments only when code clarity is insufficient or to explain non-standard solutions (like using `any`) or hard to read / understand code sections
  - Don't use JSDoc style function header comments

## Communication Style

- NEVER suggest or offer staging files with git add commands
- When asking questions, always provide multiple numbered options when appropriate:

  - Format as a numbered list: `1. Option one, 2. Option two, 3. Option three`
  - Example: `1. Yes, continue with the changes, 2. Modify the approach, 3. Stop and cancel the operation`

- When analyzing code for improvement:

  - Present multiple implementation variants as numbered options
  - For each variant, provide at least 3 bullet points explaining the changes, benefits, and tradeoffs
  - Format as: "1. [short exmplanation of variant or shorly Variant]" followed by explanation points

- When implementing code changes:

  - If the change wasn't preceded by an explanation or specific instructions
  - Include within the diff a bulleted list explaining what was changed and why
  - Explicitly note when a solution is opinionated and explain the reasoning

- When completing a task, ask if I want to:
  1. Run task:commit (need to manually stage files first)
  2. Neither (stop here)

## 💻 CODING STANDARDS & AI ORCHESTRATION

### 🚨 CRITICAL REQUIREMENTS (NEVER VIOLATE):
- **AGENT-FIRST APPROACH**: ALL coding tasks MUST use specialized agents
- **RESPECT EXISTING CODE**: Follow project patterns religiously
- **NO INNOVATION**: Use established patterns, don't invent new approaches
- **JSDoc MANDATORY**: Add to ALL exported functions
- **STYLE CONSISTENCY**: Examine similar files, follow exactly
- **MINIMAL COMMENTS**: Only add if code clarity insufficient
- **SEEDED DATA**: Use existing test data, don't create new objects
- **PATTERN ADHERENCE**: Never deviate from established codebase patterns

### 🎯 AI ORCHESTRATION PROTOCOL:
1. **READ CONTEXT FIRST**: Always examine relevant files before planning
2. **DELEGATE TO AGENTS**: Use specialized agents for their expertise areas
3. **PARALLEL EXECUTION**: Run multiple agents simultaneously when possible
4. **CROSS-VALIDATION**: Have agents review each other's outputs
5. **DOCUMENTATION SYNC**: Always update docs after code changes

### General Instructions
- **PRIMARY JOB**: Orchestrate specialized agents effectively
- **CONTEXT MANAGEMENT**: Read relevant files BEFORE planning changes
- **CONCISE UPDATES**: Keep documentation updates focused
- **PROVEN PRINCIPLES**: Follow KISS, YAGNI, DRY, and SOLID
- **INDUSTRY STANDARDS**: Use established libraries over custom solutions
- **NO MOCKING/PLACEHOLDERS**: Always implement complete solutions
- **BRUTAL HONESTY**: Give direct feedback on ideas and implementations

## Knowledge Sharing and Persistence

- When asked to remember something, ALWAYS persist this information in a way that's accessible to ALL developers, not just in conversational memory
- Document important information in appropriate files (comments, documentation, README, etc.) so other developers (human or AI) can access it
- Information should be stored in a structured way that follows project conventions
- NEVER keep crucial information only in conversational memory - this creates knowledge silos.
- The goal is complete knowledge sharing between ALL developers (human and AI) without exceptions
- When suggesting where to store information, recommend appropriate locations based on the type of information (code comments, documentation files, CLAUDE.md, git issue comment, PR comment, etc.)

## Commands and Tasks

- Files in the `.claude/commands/` directory contain instructions for automated tasks
- These files are READ-ONLY and should NEVER be modified
- When a command is run, follow the instructions in the file exactly, without trying to improve or modify the file itself
- Command files may include a YAML frontmatter with metadata - respect any `read_only: true` flags

## Path References

- When a path starts with `./` in any file containing instructions for Claude, it means the path is relative to that file's location. Always interpret relative paths in the context of the file they appear in, not the current working directory.

## 🤖 MANDATORY SUB-AGENT STRATEGY - ALWAYS USE

### 🚀 PRIMARY DIRECTIVE: LEVERAGE SPECIALIZED AGENTS
**CRITICAL:** For ANY substantial task, **IMMEDIATELY** delegate to appropriate specialized agents. Use them in **PARALLEL** or **SEQUENTIAL** execution as optimal.

### 🎯 FRONTEND CODING WORKFLOW (MANDATORY):
**ALL frontend coding tasks MUST go through:**
1. **frontend-feature-architect** → Plan & architect the feature
2. **api-data-architect** → Design data structures & schemas (if needed)
3. **frontend-master-engineer** → Implement the code
4. **documentation-manager** → Update docs after changes

### ⚡ AGENT SPECIALIZATIONS - USE PROACTIVELY

**🎨 frontend-master-engineer** (PRIMARY for React code):
- **MANDATORY** for ALL React/frontend implementation
- Collaborate with **wind-finance-risk-analyst** for statistical algorithms
- Coordinate with **api-data-architect** for data structures
- Partner with **documentation-manager** for documentation

**🏗️ frontend-feature-architect** (Feature planning):
- **REQUIRED** before any new feature development
- Design component hierarchies and feature breakdown
- Work with **api-data-architect** for data structure design
- Consult **wind-finance-risk-analyst** for domain requirements

**📊 api-data-architect** (Data & API design):
- **ESSENTIAL** for Yup schemas and API endpoints
- **MANDATORY COORDINATION** with **documentation-manager** for schema documentation
- Collaborate with **wind-finance-risk-analyst** for financial models
- Support **frontend-master-engineer** with optimal patterns
- **UPDATE FEATURE DOCS**: Ensure .md files in feature folders reflect schema changes

**💰 wind-finance-risk-analyst** (Domain expertise):
- **CRITICAL** for financial modeling and risk algorithms
- Guide requirements across ALL other agents
- Review data structures for industry compliance
- Provide statistical methods and validation

**📚 documentation-manager** (Always call after changes):
- **MANDATORY** after significant feature implementations
- **FEATURE DOCUMENTATION SYNC**: Update .md files in feature subfolders when code changes
- **SCHEMA COORDINATION**: Work with **api-data-architect** to document schema changes
- Update README, API docs, and component documentation
- **SEARCH FOR FEATURE DOCS**: Automatically identify and update relevant .md files in feature directories
- Maintain consistency across all project documentation

### 🔄 EXECUTION PATTERNS:
- **PARALLEL**: Multiple agents working simultaneously on different aspects
- **SEQUENTIAL**: Pipeline approach with handoffs between agents
- **COLLABORATIVE**: Agents consulting each other during execution
- **VALIDATION**: Cross-agent review and validation of outputs

### 📋 FEATURE DOCUMENTATION PROTOCOL:
**CRITICAL:** When making ANY code changes, agents MUST:
1. **api-data-architect** + **documentation-manager**: Update schema documentation immediately
2. **documentation-manager**: Search for and update relevant .md files in feature subfolders
3. **PATTERN**: Look for `/[feature-name]/README.md` or `/[feature-name]/docs/*.md` files
4. **SYNCHRONIZATION**: Ensure feature docs reflect current implementation state
5. **CROSS-REFERENCE**: Update inter-feature documentation links when schemas change

## Core Architecture

### Stack
- **Frontend**: React 19 + Antd + Plotly + React Router
- **Backend**: Express + MongoDB + Monte Carlo engine
- **State**: ScenarioContext (data) + CubeContext (analytics)
- **Validation**: Yup schemas → auto-generate Mongoose

### Critical Data Flow
```javascript
// 1. User Input → ScenarioContext
const { updateByPath } = useScenario();
await updateByPath('settings.financial.discountRate', 0.08);

// 2. ScenarioContext → CubeContext → Analytics
const { getData } = useCube();
const metrics = getData({ sourceId: 'npv', percentile: 50 });

// 3. Auto-sync Components
<ContextField path="settings.revenue.electricityPrice" fieldType="distribution" />
```

## Essential Patterns

### Component Standards
- **Max 200 lines** per component
- **Props typing** with PropTypes/defaults
- **useMemo** for expensive computations
- **Antd components** (Card, Form, Table, etc.)

### API Integration
```javascript
// Standard error handling
try {
  const response = await api.post('/endpoint', data);
  if (!response.data.success) throw new Error(response.data.error);
  return response.data.data;
} catch (error) {
  message.error(error.message);
  throw error;
}
```

### Key Components
- **ContextField** - Auto-sync form inputs
- **DistributionFieldV3** - Monte Carlo parameters  
- **CashflowTimelineCard** - Financial projections
- **FinanceabilityCard** - Key metrics display

## Development Workflow

### Commands
```bash
cd frontend && npm start        # React dev server
cd backend && npm run dev       # API + Monte Carlo
cd backend && npm run seed:locations  # Database setup
```

### Testing & Quality
```bash
cd frontend && npm test         # React testing
cd frontend && npm run build    # Production build
```

