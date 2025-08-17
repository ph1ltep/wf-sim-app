Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

**RECOMMENDED AGENT WORKFLOW**: Follow CLAUDE.md agent orchestration strategy.
**OPEN PR HANDLING**: if the git issue has an open PR, fully understand the progress that has been made and continue working through it. The issue stays open until the PR is closed. Ensure to maintain issue checklist updated.

# PLAN (PARALLEL EXECUTION)
1. Use `gh issue view` to get the issue details
2. **PARALLEL AGENT ANALYSIS** (run simultaneously):
   - **analyzer[1]**: Analyze component structure and UI flow
   - **analyzer[2]**: Analyze data flow and state management
   - **analyzer[3]**: Search for related files and dependencies
   - **finance**: Analyze financial/business logic (if applicable)
3. Search scratchpads and PRs for context
4. **PARALLEL AGENT PLANNING** (if new feature):
   - **planner**: Design UI architecture
   - **schemas**: Design data schemas
   - **finance**: Validate business requirements
5. Document your plan in a scratchpad. Follow @.claude/references/scratchpads.md

# CREATE
- Create/checkout appropriate branch
- **IMPLEMENTATION** (based on plan):
  - **builder**: For React/UI implementation
  - **schemas**: For schema/data structure changes
  - Implement in logical batches (NOT after every tiny change)
- Commit completed features/fixes (not individual lines)
- Push to server periodically

# VALIDATE (OPTIONAL)
- Ask user: "Run validation? 1. Quick (lint only), 2. Standard (lint+build), 3. Full (all tests), 4. Skip"
- Based on response:
  - **Quick**: `npm run lint` only (30 seconds)
  - **Standard**: `npm run lint && npm run build` (2 minutes)
  - **Full**: Use **validator** for complete validation
  - **Skip**: Continue without validation
- **docs**: Update docs ONLY after significant changes
- **CRITICAL**: When making schema changes in @schemas/yup, restart frontend for changes to take effect

# DEPLOY & WORKFLOW INTEGRATION
- Final validation check (if not done above)
- Push, create a PR, and request a review
- **COMMENT PROGRESS**: Add summary of what was completed to GitHub issue/PR
- **WORKFLOW CONTINUATION**: When user comments on PR/issue with additional requirements:
  1. Read user comments and understand new requirements
  2. Continue implementation following same agent workflow
  3. Update progress comments on issue/PR tracking what's been fixed
  4. Repeat until user satisfaction and PR merge

**CRITICAL INSTRUCTIONS**
- Commits MUST follow instructions @.claude/references/git-conventional-commits.md
- Use GitHub CLI (`gh`) for all GitHub-related tasks
- Maintain issue checklist updated at key milestones (not every commit)
- When working on existing PR, CONTINUE ON THE EXISTING BRANCH

**⚡ OPTIMIZATION RULES:**
- **PARALLEL EXECUTION**: Run 3x analyzer + planning agents simultaneously
- **VALIDATION MODES**: Quick (lint), Standard (lint+build), Full (all tests), Skip (default)
- **BATCH OPERATIONS**: Group related changes, avoid micro-commits
- **SMART DOCUMENTATION**: Only update docs after significant changes
- **DEFAULT BEHAVIOR**: Skip validation unless explicitly requested or issues detected

**PERFORMANCE GAINS**: 50-70% faster execution with these optimizations
