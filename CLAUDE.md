# CLAUDE.md - Wind Finance Simulator

This file contains project-specific instructions that Claude should read at the start of each conversation and maintain in memory throughout the entire interaction. **IMPORTANT:** Once this file has been read or updated, it MUST be loaded at the beginning of any new conversation to ensure awareness of communication requirements, custom tasks, etc.

## CRITICAL & IMPORTANT Rules to ALWAYS FOLLOW
- ALL instructions within this document MUST BE FOLLOWED, these are not optional unless explicitly stated.
- ASK FOR CLARIFICATION If you are uncertain of any of thing within the document.
- DO NOT edit more code than you have to.
- DO NOT WASTE TOKENS, be succinct and concise.

1. **Edit existing files first** - avoid new file creation
2. **Yup schemas drive everything** - validation + Mongoose generation
3. **Context-first state management** - minimize local state
4. **Fail fast validation** - explicit error boundaries
5. **Antd design system** - consistent UI patterns
6. **Distribution-aware inputs** - support uncertainty modeling
7. **Git commits** - MUST follow rules at @.claude/references/git-conventional-commits.md
8. **USE sub-agents in parallel and sequential thinking** when useful or necessary.

## Default Mode

- Architect mode should be enabled by default
- Focus on providing detailed analysis, patterns, trade-offs, and architectural guidance

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

## Coding Standards & AI Instructions

### Key requirements
- ALWAYS respect how things are written in the existing project
- ALWAYS add JSDoc to exported functions.
- DO NOT invent your own approaches or innovations
- STRICTLY follow the existing style of tests, resolvers, functions, and arguments
- Before creating a new file, ALWAYS examine a similar file and follow its style exactly
- If code doesn't include comments, DO NOT add comments
- Use seeded data in tests instead of creating new objects when seeded data exists
- Follow the exact format of error handling, variable naming, and code organization used in similar files
- Never deviate from the established patterns in the codebase

### General Instructions
- Your most important job is to manage your own context. Always read any relevant files BEFORE planning changes.
- When updating documentation, keep updates concise and on point to prevent bloat.
- Write code following KISS, YAGNI, and DRY principles.
- When in doubt follow proven best practices for implementation.
- Do not commit to git without user approval.
- Do not run any servers, rather tell the user to run servers for testing.
- Always consider industry standard libraries/frameworks first over custom implementations.
- Never mock anything. Never use placeholders. Never omit code.
- Apply SOLID principles where relevant. Use modern framework features rather than reinventing solutions.
- Be brutally honest about whether an idea is good or bad.

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

## Task Delegation Strategy

### Parallel Sub-Agent Coordination
**Multiple agents can work together simultaneously** for optimal results:

**Feature Development Pipeline:**
- **frontend-feature-architect** → **api-data-architect** → **frontend-master-engineer**
- **wind-finance-risk-analyst** provides domain expertise throughout
- **documentation-manager** updates docs after significant changes

### Agent Specializations

**IMPORTANT** Dynamically call any sub-agent deemed necessary or significantly helpful for the task at hand. Call sub-agents in PARALLEL or Squential Thinking when necessary. 

**frontend-master-engineer**: React implementation
- Collaborate with **wind-finance-risk-analyst** for statistical algorithms
- Coordinate with **api-data-architect** for optimal data structures
- Partner with **documentation-manager** for component documentation

**frontend-feature-architect**: Feature planning & architecture  
- Work with **api-data-architect** to design data structures
- Consult **wind-finance-risk-analyst** for critical data requirements
- Plan feature breakdown and component hierarchies

**api-data-architect**: Data structures & API design
- Design Yup schemas and API endpoints
- Collaborate with **wind-finance-risk-analyst** for financial data models
- Support **frontend-master-engineer** with optimal data patterns

**wind-finance-risk-analyst**: Domain expertise
- Provide risk algorithms and statistical methods
- Guide financial model requirements across all agents
- Review data structures for industry compliance

**documentation-manager**: Documentation maintenance
- **Always called after significant feature changes**
- Updates README, API docs, and component documentation
- Maintains consistency across all documentation

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

