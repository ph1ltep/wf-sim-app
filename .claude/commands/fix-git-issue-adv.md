---
read_only: true
description: Advanced multi-phase GitHub issue resolution with state management and comprehensive orchestration
version: 2.0
---

# Advanced GitHub Issue Resolution Workflow

**RECOMMENDED AGENT WORKFLOW**: Follow CLAUDE.md agent orchestration strategy with enhanced multi-phase execution.

**OPEN PR HANDLING**: If the git issue has an open PR, fully understand progress and continue. Issue stays open until PR is closed. Maintain issue checklist updated.

**BACKWARD COMPATIBILITY**: Simple issues execute exactly like original fix-git-issue command.

## INITIALIZATION PHASE

### 1. Issue Analysis & Phase Detection
```bash
# Get comprehensive issue details
gh issue view $ARGUMENTS --json title,body,labels,assignees,milestone,comments
```

**PATTERN DETECTION** - Automatically identify multi-phase structure:
- **Numbered Lists**: `1.`, `2.`, `3.` (sequential phases)
- **Checkbox Lists**: `- [ ] task`, `- [x] done` (task-based phases)
- **Header Sections**: `## Phase 1:`, `### Step 1:` (structured phases)
- **Acceptance Criteria**: `AC1:`, `Given/When/Then` (test-driven phases)
- **Step-by-Step**: `Step 1`, `First`, `Then`, `Finally` (procedural phases)

### 2. State Management Setup
Create state file: `.claude/scratchpads/issues/issue-{NUMBER}-{SLUG}.yaml`

```yaml
issue_number: {NUMBER}
issue_title: "{TITLE}"
github_url: "https://github.com/{REPO}/issues/{NUMBER}"
execution_mode: "interactive|guided|autonomous"
total_phases: {COUNT}
current_phase: 1
phases:
  - phase: 1
    title: "{PHASE_TITLE}"
    status: "pending|in_progress|completed|skipped"
    complexity: "simple|medium|complex"
    agents_used: []
    completion_time: null
    checkpoints: []
status: "initialized|in_progress|completed|paused"
created_at: "{TIMESTAMP}"
updated_at: "{TIMESTAMP}"
branch_name: "{BRANCH}"
pr_number: null
```

### 3. Execution Mode Selection
**PROMPT USER**: "Select execution mode for this {PHASE_COUNT}-phase issue:
1. **Interactive** - Confirm each phase before execution (recommended for complex)
2. **Guided** - Phase summaries with continue/modify/stop options
3. **Autonomous** - Execute all phases with progress updates only
4. **Single Phase** - Treat as simple issue (original behavior)"

## COMPLEXITY ASSESSMENT & AGENT SCALING

### Phase-Level Complexity Analysis
**FOR EACH PHASE**:
- **File Count**: 1 file = simple, 2-5 files = medium, 5+ files = complex
- **Line Estimate**: <50 lines = simple, 50-200 = medium, 200+ = complex
- **Architecture Impact**: No = simple, Minor = medium, Major = complex
- **Dependencies**: Isolated = simple, Few = medium, Many = complex

### Adaptive Agent Orchestration
```yaml
simple_phase:
  analyzers: 1
  planning: "skip"
  agents: ["analyzer", "builder"]
  execution: "sequential"

medium_phase:
  analyzers: 1-2
  planning: "single" # planner OR schemas
  agents: ["analyzer", "planner|schemas", "builder"]
  execution: "mixed"

complex_phase:
  analyzers: 2-3
  planning: "parallel" # planner + schemas + finance
  agents: ["analyzer", "planner", "schemas", "finance", "builder"]
  execution: "parallel_then_sequential"
```

## MULTI-PHASE EXECUTION LOOP

### Phase Execution Template
```
FOR EACH PHASE:
  1. **PHASE INITIALIZATION**
     - Load state from YAML
     - Display phase summary
     - Get user confirmation (if interactive/guided mode)
  
  2. **COMPLEXITY ASSESSMENT** (per phase)
     - Analyze phase requirements
     - Scale agent allocation
     - Update state file
  
  3. **AGENT ORCHESTRATION** (adaptive)
     - Launch analyzers (1-3 instances based on complexity)
     - Execute planning agents (if needed)
     - Coordinate implementation agents
     - Document progress in state file
  
  4. **CHECKPOINT MANAGEMENT**
     - Save intermediate results
     - Update GitHub issue progress
     - Confirm phase completion
  
  5. **USER INTERACTION** (mode-dependent)
     - Interactive: "Phase {N} completed. Options: 1. Continue, 2. Modify approach, 3. Skip remaining, 4. Pause"
     - Guided: Phase summary + "1. Continue with Phase {N+1}, 2. Review changes, 3. Adjust plan"
     - Autonomous: Progress update only
```

### Enhanced User Prompts
**PHASE CONFIRMATION** (Interactive/Guided):
```
📋 PHASE {N}/{TOTAL}: {PHASE_TITLE}
🎯 Complexity: {COMPLEXITY} | Agents: {AGENT_LIST}
📁 Files affected: {FILE_COUNT} | Estimated changes: {LINE_ESTIMATE}

Choose action:
1. **Execute Phase** - Proceed with {AGENT_STRATEGY} approach
2. **Modify Approach** - Adjust complexity or agent allocation  
3. **Skip Phase** - Mark as completed and continue
4. **Pause & Review** - Save state and exit for manual review
5. **Split Phase** - Break into smaller sub-phases
```

**PROGRESS SUMMARY** (Between phases):
```
✅ PHASE {N} COMPLETED - {PHASE_TITLE}
⏱️ Duration: {TIME} | Agents Used: {AGENTS}
📊 Changes: {FILES_MODIFIED} files, {LINES_CHANGED} lines
🔄 Status: {COMMIT_COUNT} commits, {TEST_STATUS}

📋 REMAINING PHASES: {REMAINING_COUNT}
Next: Phase {N+1} - {NEXT_PHASE_TITLE}
```

## ENHANCED GITHUB INTEGRATION

### Smart Progress Updates
**BATCHED ISSUE UPDATES** (avoid API spam):
- Update issue every 3 phases OR significant milestones
- Batch checkbox updates
- Timestamp progress comments
- Minimal API calls strategy

### Issue Comment Templates
```markdown
🤖 **AUTOMATED PROGRESS UPDATE** - {TIMESTAMP}

**COMPLETED PHASES**: {COMPLETED_COUNT}/{TOTAL_COUNT}
✅ Phase 1: {TITLE} - {DURATION}
✅ Phase 2: {TITLE} - {DURATION}
🔄 Phase 3: {TITLE} - In Progress

**CURRENT STATUS**:
- Branch: `{BRANCH_NAME}`
- Commits: {COMMIT_COUNT}
- Files Changed: {FILES_MODIFIED}
- Tests: {TEST_STATUS}

**NEXT STEPS**: {NEXT_PHASE_DESCRIPTION}

---
*Execution Mode: {MODE} | State: `.claude/scratchpads/issues/issue-{NUMBER}-{SLUG}.yaml`*
```

### Real-time Checklist Sync
- Parse issue body for `- [ ]` and `- [x]` items
- Update checkboxes via GitHub API as phases complete
- Maintain local and remote state synchronization

## STATE MANAGEMENT & RECOVERY

### Checkpoint System
**SAVE CHECKPOINTS**:
- After each phase completion
- Before major architectural changes
- On user-requested pauses
- Every 30 minutes during long phases

**STATE FILE UPDATES**:
```yaml
phases:
  - phase: 1
    checkpoints:
      - timestamp: "{TIME}"
        status: "analysis_complete"
        agents_completed: ["analyzer"]
        files_read: ["{FILE_LIST}"]
      - timestamp: "{TIME}" 
        status: "implementation_complete"
        agents_completed: ["analyzer", "builder"]
        commits: ["{COMMIT_HASH}"]
```

### Resume Capability
**ON COMMAND RESTART**:
1. Check for existing state file
2. **PROMPT**: "Found existing session for Issue #{NUMBER}. Options:
   1. **Resume** - Continue from Phase {CURRENT_PHASE}
   2. **Restart** - Begin fresh analysis
   3. **Review** - Show progress summary and choose
   4. **Rollback** - Return to previous checkpoint"

### Progress Rollback
```yaml
rollback_points:
  - phase: 2
    checkpoint: "pre_implementation"
    timestamp: "{TIME}"
    branch_state: "{COMMIT_HASH}"
    files_backup: ["{BACKUP_LOCATION}"]
```

## VALIDATION & TESTING INTEGRATION

### Per-Phase Testing Strategy
**PHASE-LEVEL TEST SELECTION**:
- **Unit Tests**: After component/function implementation phases
- **Integration Tests**: After API/data flow phases  
- **E2E Tests**: After complete feature phases
- **Build Tests**: After architecture change phases

**ENHANCED TEST PROMPTS**:
```
🧪 PHASE {N} TESTING - {PHASE_TITLE}

Recommended tests for this phase type:
- {PHASE_TYPE}: {RECOMMENDED_TESTS}

Select testing approach:
1. **Run Recommended** - {RECOMMENDED_TESTS} 
2. **Comprehensive** - Full test suite (npm test, build, e2e)
3. **Focused** - Test only this phase's changes
4. **Custom** - Specify exact tests to run
5. **Skip** - Continue without testing (can test later)
6. **Phase-End Only** - Test after all related phases complete
```

## PERFORMANCE OPTIMIZATIONS

### Token Usage Optimization
- **Phase Batching**: Group small related phases
- **State Compression**: Minimize YAML file size
- **Smart Caching**: Reuse analysis between phases
- **Lazy Loading**: Load phase details only when needed

### Execution Speed Improvements
- **Parallel Planning**: Run all planning agents simultaneously for complex phases
- **Background Processing**: Non-blocking state saves
- **Smart Resumption**: Skip completed analysis on resume
- **Selective Documentation**: Update docs only for user-visible changes

## WORKFLOW COMPLETION

### Final Phase Protocol
```
🎯 FINAL PHASE COMPLETE - Issue #{NUMBER}

📊 EXECUTION SUMMARY:
- Total Phases: {TOTAL_PHASES}
- Completed: {COMPLETED_PHASES}
- Skipped: {SKIPPED_PHASES}  
- Duration: {TOTAL_TIME}
- Agents Used: {UNIQUE_AGENTS}
- Commits: {COMMIT_COUNT}
- Files Modified: {FILES_COUNT}

🚀 DEPLOYMENT ACTIONS:
1. **Create PR** - Push branch and create pull request
2. **Update Issue** - Final progress comment with completion summary
3. **Request Review** - Tag reviewers and request feedback
4. **Cleanup State** - Archive state file pending PR merge
5. **Documentation** - Update relevant docs (if significant changes)

Choose completion action:
1. **Full Deployment** - Execute all actions above
2. **Manual Review** - Create PR but hold other actions
3. **Cleanup Only** - Archive state without deployment
```

### State Cleanup
- **ON PR MERGE**: Automatically delete state files
- **ON ISSUE CLOSE**: Archive state to `.claude/archives/`
- **MONTHLY CLEANUP**: Remove orphaned state files

## BACKWARD COMPATIBILITY

### Simple Issue Handling
**IF ISSUE HAS**:
- Single description without phase markers
- Basic bug fix or simple feature
- No complex structure detected

**THEN**: Execute original fix-git-issue.md workflow exactly:
1. Single analyzer instance
2. Direct to builder
3. No state file creation
4. Traditional commit/PR flow

### Migration Path
Existing workflows continue unchanged. Advanced features opt-in via:
- Automatic pattern detection
- User mode selection prompt  
- Graceful fallback to simple mode

---

**CRITICAL INSTRUCTIONS**
- Commits MUST follow @.claude/references/git-conventional-commits.md
- Use GitHub CLI (`gh`) for all GitHub-related tasks  
- Maintain state file updated at each checkpoint
- Support interruption and resumption at any phase
- When working on existing PR, CONTINUE ON THE EXISTING BRANCH
- Clean up state files after successful PR merge

**⚡ ADVANCED OPTIMIZATIONS:**
- **ADAPTIVE SCALING**: 1-3 analyzers based on phase complexity
- **SMART STATE MGMT**: Checkpoint-based resumption with rollback capability
- **BATCHED GITHUB API**: Minimize API calls while maintaining sync
- **PHASE PARALLELIZATION**: Execute independent phases simultaneously
- **SELECTIVE DOCUMENTATION**: Update docs only for significant user-facing changes
- **PERFORMANCE MONITORING**: Track and optimize execution times per phase type

**PERFORMANCE GAINS**: 
- Simple issues: Same speed as original (backward compatible)
- Medium issues: 40-60% faster through smart phase batching
- Complex issues: 200-300% more manageable through structured approach
- State recovery: Resume large issues without restart penalty
- Overall: Scales from simple to enterprise-level issue complexity