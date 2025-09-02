Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

**RECOMMENDED AGENT WORKFLOW**: Follow CLAUDE.md agent orchestration strategy.
**OPEN PR HANDLING**: if the git issue has an open PR, fully understand the progress that has been made and continue working through it. The issue stays open until the PR is closed. Ensure to maintain issue checklist updated.

# PLAN (ADAPTIVE EXECUTION)
1. Use `gh issue view` to get the issue details
2. **ASSESS COMPLEXITY** (determine task scope):
   - Simple bug fix? → 1 analyzer instance
   - Feature addition? → 1-2 analyzer instances
   - Architecture change? → 2-3 analyzer instances
3. **ANALYSIS PHASE** (scale based on complexity):
   - Simple: **analyzer** → focused analysis
   - Medium: **analyzer(2x)** → broader coverage
   - Complex: **analyzer(3x)** → comprehensive analysis
4. Search scratchpads and PRs for context
5. **PLANNING PHASE** (only if needed):
   - Simple: Skip planning, go to implementation
   - Medium: **planner** OR **schemas** (choose one)
   - Complex: **planner** + **schemas** + **finance** (parallel)
6. Document your plan in a scratchpad if medium/complex. Follow @.claude/references/scratchpads.md

# CREATE
- Create/checkout appropriate branch
- **IMPLEMENTATION** (based on plan):
  - **builder**: For React/UI implementation
  - **schemas**: For schema/data structure changes
  - Implement in logical batches (NOT after every tiny change)
- Commit completed features/fixes (not individual lines)
- Push to server periodically

# VALIDATE (OPTIONAL)
- Ask user: "Select testing approach:
  1. **Run comprehensive tests** - Full test suite (npm test, npm run build, e2e tests)
  2. **Focused test** - Test only the specific feature/bug being addressed
  3. **Custom test** - Specify exactly which tests to run
  4. **Skip tests** - Continue without testing (useful when more fixes are needed)"
- Based on response:
  - **Comprehensive**: Full test suite with **validator** agent
  - **Focused**: Run tests specific to the changed feature/bug
  - **Custom**: Run exactly what user specifies
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
- **ADAPTIVE SCALING**: 1 analyzer for simple, 2 for medium, 3 for complex tasks
- **SMART PLANNING**: Skip planning for simple fixes, use single planner for medium tasks
- **TEST SELECTION**: Always ask user to choose: Comprehensive, Focused, Custom, or Skip
- **BATCH OPERATIONS**: Group related changes, avoid micro-commits
- **DOCUMENTATION**: Only for significant changes, not every edit
- **DEFAULT BEHAVIOR**: Scale agents based on complexity, never over-provision

**PERFORMANCE GAINS**: 
- Simple tasks: 60% faster (1 vs 3 analyzers)
- Medium tasks: 40% faster (sequential vs full parallel)
- Complex tasks: Full power when needed
- Overall: 40-60% token savings on average
