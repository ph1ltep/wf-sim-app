# CLAUDE.md - Wind Finance Simulator

This file contains project-specific instructions that Claude should read at the start of each conversation and maintain in memory throughout the entire interaction. **IMPORTANT:** Once this file has been read or updated, it MUST be loaded at the beginning of any new conversation to ensure awareness of communication requirements, custom tasks, etc.

## 🚨 ADAPTIVE EXECUTION STRATEGY - ASSESS COMPLEXITY FIRST

### Task Complexity Assessment
**Simple** (< 50 lines, single file, clear fix):
- 1 analyzer instance
- Sequential execution
- Skip validation unless requested

**Medium** (multiple files, < 200 lines, standard feature):
- 1-2 analyzer instances
- Mixed parallel/sequential
- Focused validation

**Complex** (new feature, architecture changes, > 200 lines):
- 2-3 analyzer instances
- Full parallel execution
- Comprehensive validation

### Optimized Decision Matrix
| Task Type | Complexity | Primary Agents | Execution Pattern |
|-----------|------------|----------------|-------------------|
| Bug Fix | Simple | analyzer → builder | Sequential |
| Bug Fix | Complex | analyzer(2x) → builder | Parallel analysis |
| Small Feature | Medium | analyzer → planner → builder | Sequential |
| Large Feature | Complex | analyzer(3x) + planner + schemas | Full parallel |
| Schema Change | Medium | schemas → builder | Sequential |
| Financial Logic | Any | finance + relevant agent | Parallel |
| Documentation | Post-task | docs | Only if significant |
| Validation | End only | validator | User choice |

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

### ⚡ ADAPTIVE AGENT PROTOCOL - COMPLEXITY-BASED

**STEP 1: ASSESS COMPLEXITY**
- Simple task? → Minimal agents, sequential
- Medium task? → Balanced approach
- Complex task? → Full parallel execution

**EXECUTION PATTERNS BY COMPLEXITY:**

**Simple Tasks (Bug fixes, minor changes):**
1. **analyzer** (1 instance) → Understand the issue
2. **builder** → Fix it
3. **validator** → Only if requested

**Medium Tasks (Small features, multi-file changes):**
1. **analyzer** (1-2 instances) → Analyze codebase
2. **planner** OR **schemas** → Design approach (not both)
3. **builder** → Implement
4. **validator** → Focused testing if requested

**Complex Tasks (New features, architecture):**
1. **analyzer** (2-3 instances parallel) → Deep analysis
2. **planner** + **schemas** + **finance** → Full parallel planning
3. **builder** → Implement with guidance
4. **validator** → Comprehensive testing
5. **docs** → Update documentation

**TEST SELECTION PROTOCOL:**
ALWAYS ask user to choose testing approach before running ANY tests:
1. **Run comprehensive tests** - Full test suite (npm test, npm run build, e2e tests)
2. **Focused test** - Test only the specific feature/bug being addressed
3. **Custom test** - User specifies exactly which tests to run
4. **Skip tests** - Continue without testing (useful when more fixes are needed)

**Default**: Present options and wait for user selection - NEVER auto-run tests

**⚡ PERFORMANCE OPTIMIZATION SUMMARY:**
Adaptive strategy delivers:
- **Simple tasks**: 60% faster with single analyzer vs 3
- **Medium tasks**: 40% faster with sequential vs full parallel
- **Complex tasks**: Full parallel power when actually needed
- **Token savings**: 40-60% average reduction
- **Smart testing**: User-controlled test execution
- **Focused agents**: No overlapping analysis work

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

- When completing a task:
  1. Comment progress summary on GitHub issue/PR
  2. Ask: "1. Continue with additional work, 2. Run validation, 3. Complete (ready for review)"

## 🔄 WORKFLOW INTEGRATION

### **Primary Workflow: GitHub Issue/PR Driven**
1. **Start**: `/fix-git-issue {issue-number}` or direct issue/PR reference
2. **Analysis**: Use **analyzer** agents in parallel for codebase understanding
3. **Planning**: Use **planner** + **schemas** + **finance** for feature design
4. **Implementation**: Use **builder** + **schemas** for code changes
5. **Progress**: Comment updates on GitHub issue/PR throughout process
6. **Completion**: Mark issue resolved when user approves and merges PR

### **Continuation Workflow: User Comments**
- **When**: User comments on PR/issue with additional requirements or feedback
- **Process**: Read comments → analyze requirements → continue implementation → update progress
- **Goal**: Iterative improvement until user satisfaction and PR merge

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

### 🎯 ADAPTIVE WORKFLOW - SCALE TO TASK

**FIRST: ASSESS TASK COMPLEXITY**
- Count files affected
- Estimate lines of change
- Determine if architecture changes needed

**THEN EXECUTE APPROPRIATELY:**

**Simple Task Workflow** (bug fix, minor change):
1. **analyzer** → Single instance analysis
2. **builder** → Direct implementation
3. **validator** → Only if user requests

**Medium Task Workflow** (small feature, multi-file):
1. **analyzer(1-2)** → Focused analysis
2. **planner** OR **schemas** → Single planning agent
3. **builder** → Guided implementation
4. **validator** → User choice

**Complex Task Workflow** (new feature, architecture):
1. **analyzer(2-3)** → Full parallel analysis
2. **planner** + **schemas** + **finance** → Parallel planning
3. **builder** → Comprehensive implementation
4. **validator** + **docs** → Full validation and documentation

### ⚡ AGENT SPECIALIZATIONS - USE PROACTIVELY

**🎨 builder** (PRIMARY for React code):
- **MANDATORY** for ALL React/frontend implementation
- Collaborate with **finance** for statistical algorithms
- Coordinate with **schemas** for data structures
- Partner with **docs** for documentation

**🏗️ frontend-feature-architect** (Feature planning):
- **REQUIRED** before any new feature development
- Design component hierarchies and feature breakdown
- Work with **schemas** for data structure design
- Consult **finance** for domain requirements

**📊 schemas** (Data & API design):
- **ESSENTIAL** for Yup schemas and API endpoints
- **MANDATORY COORDINATION** with **docs** for schema documentation
- Collaborate with **finance** for financial models
- Support **builder** with optimal patterns
- **UPDATE FEATURE DOCS**: Ensure .md files in feature folders reflect schema changes

**💰 finance** (Domain expertise):
- **CRITICAL** for financial modeling and risk algorithms
- Guide requirements across ALL other agents
- Review data structures for industry compliance
- Provide statistical methods and validation

**🔍 analyzer** (Code analysis - READ-ONLY):
- **ESSENTIAL** for understanding React components, Yup schemas, or data structures
- **PARALLEL EXECUTION**: Support up to **3 instances simultaneously**
- **Instance 1**: Component structure and UI flow analysis
- **Instance 2**: Data flow and state management analysis
- **Instance 3**: Dependencies and integration analysis
- **STRICT RULE**: READ-ONLY agent, NEVER modifies code
- **Model**: Sonnet (fast pattern matching)

**✅ validator** (Validation - END ONLY):
- **USE ONLY**: At task completion OR when explicitly requested
- **VALIDATION MODES**:
  - **Quick**: `npm run lint` only (30 seconds)
  - **Standard**: `npm run lint && npm run build` (2 minutes)
  - **Full**: Complete test suite including typecheck, test, build (5+ minutes)
- **DEFAULT BEHAVIOR**: Skip validation unless issues detected
- **Model**: Sonnet (rule-based checking)

**📚 docs** (Always call after changes):
- **MANDATORY** after significant feature implementations
- **FEATURE DOCUMENTATION SYNC**: Update .md files in feature subfolders when code changes
- **SCHEMA COORDINATION**: Work with **schemas** to document schema changes
- Update README, API docs, and component documentation
- **SEARCH FOR FEATURE DOCS**: Automatically identify and update relevant .md files in feature directories
- Maintain consistency across all project documentation

### 🔄 EXECUTION PATTERNS - SPEED OPTIMIZED:

**PRIMARY PATTERNS:**
1. **PARALLEL-FIRST**: Default for all analysis and planning tasks
2. **BATCH OPERATIONS**: Group related changes, avoid micro-commits
3. **LAZY VALIDATION**: Only validate at natural checkpoints
4. **SMART DOCUMENTATION**: Update docs only for significant changes

**AGENT PARALLELISM LIMITS:**
- **analyzer**: Up to 3 parallel instances
- **Planning agents**: All can run simultaneously
- **Implementation agents**: Sequential only (avoid conflicts)
- **docs**: Can run parallel with any agent

### 📋 FEATURE DOCUMENTATION PROTOCOL:
**CRITICAL:** When making ANY code changes, agents MUST:
1. **schemas** + **docs**: Update schema documentation immediately
2. **docs**: Search for and update relevant .md files in feature subfolders
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


- REMEMBER: NEVER ADD Claude co-authored message to ANY commit!