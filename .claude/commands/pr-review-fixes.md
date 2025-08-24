---
read_only: true
---

Please address the PR review comments and implement requested changes: $ARGUMENTS.

Follow these steps:

**IMPORTANT**: Use sub-agents in parallel and/or sequential thinking as much as needed.

# ANALYZE - EXHAUSTIVE COMMENT COLLECTION & ISSUE SYNC
1. **PR Overview**: Use `gh pr view $ARGUMENTS` to get current PR details and status
2. **Linked Issue Discovery**: Use `gh pr view $ARGUMENTS --json` to identify linked issues
3. **Issue Checklist Analysis**: If issue exists, use `gh issue view [ISSUE_NUMBER]` to get current checklist status
4. **PR Comments**: Use `gh pr view $ARGUMENTS --comments` to fetch all review comments and discussions
5. **Commit Comments**: Use `gh api repos/:owner/:repo/pulls/$ARGUMENTS/comments` to get all commit-level comments
6. **Review Comments**: Use `gh api repos/:owner/:repo/pulls/$ARGUMENTS/reviews` to get all review submissions
7. **Issue Comments**: If PR links to issues, use `gh api repos/:owner/:repo/issues/:number/comments` for issue discussions
8. **Previous Action Log**: Search PR comments for previous bot/AI action summaries to understand what's been addressed
9. **Checklist Reconciliation**: Compare PR feedback with issue checklist to identify gaps and inconsistencies
10. Parse and categorize ALL feedback by type (bugs, improvements, questions, resolved, pending)
11. **CRITICAL**: Establish issue checklist as single source of truth for overall progress
12. Ask clarifying questions about any ambiguous feedback if necessary

# CONTEXT
1. Review the current branch and codebase state
2. Understand what changes were already made in the PR
3. Search the scratchpads for previous analysis related to this issue/PR
4. Search the codebase for files mentioned in review comments
5. Analyze the relationship between reviewer feedback and existing implementation

# PLAN - ISSUE-CENTRIC PROGRESS MANAGEMENT
1. **Issue Checklist Audit**: If linked issue exists, analyze current checklist status and identify what's complete/incomplete
2. **Comment-to-Checklist Mapping**: Map PR review comments to corresponding issue checklist items
3. **Checklist Updates**: Update issue checklist based on new findings from PR review feedback
4. **Gap Analysis**: Identify review feedback that doesn't map to existing checklist items (add new items if needed)
5. **Previous Actions Review**: Analyze any previous AI action logs to avoid duplicate work
6. **Systematic Addressing**: Plan how to address each review comment with clear traceability to issue checklist
7. **Task Breakdown**: Break down requested changes into small, manageable tasks that align with checklist items
8. **Priority Matrix**: Prioritize based on checklist item importance, reviewer feedback severity, and dependencies  
9. **Conflict Resolution**: Identify potential conflicts between reviewer suggestions and issue requirements
10. **Action Plan Documentation**: Document comprehensive approach plan in scratchpad following @.claude/references/scratchpads.md
11. **Issue-Centric Tracking**: Prepare structure for maintaining issue checklist as primary progress indicator

# IMPLEMENT - WITH ISSUE CHECKLIST SYNC
- **Branch Management**: Stay on the current PR branch (do not create a new branch)
- **Issue-First Implementation**: Address review comments in logical steps that align with issue checklist items
- **Checklist Updates**: After each significant change, update the linked issue checklist to reflect completed items
- **Dual Logging**: Maintain both issue checklist updates AND PR comment logs:
  - **Issue Updates**: Use `gh issue edit [ISSUE_NUMBER] --body "[updated-checklist-content]"` to update checklist
  - **PR Action Log**: Post structured comments to PR documenting session progress
- **Checklist Item Completion**: Mark checklist items as complete when corresponding work is finished
- **New Item Addition**: Add new checklist items if PR feedback reveals additional requirements
- **Commit Traceability**: Reference both review comment IDs and issue checklist items in commit messages
- **Progress Synchronization**: Ensure issue checklist status always reflects current implementation state
- **Change Documentation**: Commit changes after each significant fix/improvement with issue references
- **Continuous Sync**: Push changes to server and update issue status after each commit

# TEST  
- Ask if we should run tests, and wait for a response. If No, skip TEST section here.
- IMPORTANT: Use Playwright MCP to run UI tests if changes affect the UI
- Write or update Playwright tests if reviewer requested test coverage
- Run the full test suite to ensure fixes don't break existing functionality
- If tests fail, fix them before proceeding
- Ensure all tests pass before finalizing changes
- Use documentation-manager to update any relevant documentation mentioned in reviews
- When making changes to schema definitions in @schemas/yup, restart the frontend for changes to take effect

# FINALIZE - ISSUE CHECKLIST & SESSION SUMMARY
- **Final Commit**: Create a summary commit if multiple small commits were made
- **Branch Sync**: Push final changes to the PR branch
- **Issue Checklist Finalization**: Ensure linked issue checklist accurately reflects all completed work
- **Final Issue Update**: Use `gh issue edit [ISSUE_NUMBER]` to update checklist with session results
- **Comprehensive Session Summary**: Add a structured comment to the PR including:
  - **Session ID**: Unique identifier for this review session (timestamp-based)
  - **Issue Checklist Progress**: Show before/after checklist status with items completed
  - **Comments Addressed**: Complete list of which review comments were resolved
  - **Checklist Items Updated**: Which issue checklist items were marked complete or added
  - **Files Modified**: All files changed during this session
  - **Actions Taken**: Detailed log of all changes made
  - **Issue Status**: Current overall completion percentage of linked issue
  - **Remaining Items**: Clear list of unaddressed comments/feedback AND incomplete checklist items
  - **Next Steps**: Recommended actions based on issue checklist priorities
  - **Testing Status**: What tests were run and results
- **Continuity Tagging**: Use consistent tags/labels for easy future session recognition
- **Cross-Reference**: Ensure PR status aligns with issue checklist completion state
- **Do NOT create a new PR**: Stay within the existing PR workflow

**CRITICAL INSTRUCTIONS**
- Commits MUST follow instructions @.claude/references/git-conventional-commits.md
- Reference both review comment IDs AND issue checklist items in commit messages
- Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks
- **MANDATORY**: Issue checklist is the single source of truth - keep it updated throughout the session
- **CRITICAL**: Always use `gh issue edit [ISSUE_NUMBER]` to update checklist after significant progress
- Address each review comment systematically and map it to corresponding issue checklist items
- Add new checklist items if PR feedback reveals additional requirements not captured in original issue
- Maintain clear traceability between reviewer feedback, implemented changes, and issue checklist items
- Ensure issue completion percentage accurately reflects actual progress state

**STRUCTURED LOGGING FORMAT**
Use this template for PR action log comments:

```markdown
## 🤖 AI Review Session - [SESSION-ID]

### 📋 Issue Checklist Progress
**Linked Issue**: #[ISSUE-NUMBER] - [issue title]
**Before Session**: [X] of [Y] items completed ([Z]%)
**After Session**: [X] of [Y] items completed ([Z]%)

### ✅ Checklist Items Updated
- **[✅] Item Name**: [description of what was completed]
- **[🆕] New Item**: [description of new requirement discovered from PR feedback]
- **[⏳] Item Name**: [description of partially completed item]

### 📋 Comments Addressed  
- **Comment ID/Thread**: [reviewer-name#comment-id] - [brief description]
  - **Action**: [what was done]
  - **Files**: [modified files]  
  - **Checklist Item**: Maps to "[checklist-item-name]"
  - **Status**: ✅ Resolved / 🔄 Partial / ⏳ In Progress

### 📂 Files Modified This Session
- `path/to/file1.js` - [reason for change] (relates to checklist item: [item-name])
- `path/to/file2.tsx` - [reason for change] (relates to checklist item: [item-name])

### 🧪 Testing Performed
- [x] Unit tests passed
- [x] UI tests (Playwright) - [specific scenarios]
- [ ] Integration tests - [if applicable]

### 📝 Remaining Work
**Issue Checklist Items**:
- **[ ] Item Name**: [description and priority]
- **[ ] Item Name**: [description and priority]

**PR Review Comments**:
- **[reviewer-name#comment-id]**: [description of unaddressed feedback]

### 🎯 Next Steps (Based on Issue Priority)
- [recommended actions based on issue checklist]
- [dependencies or blockers from issue requirements]

---
*Session completed: [timestamp] | Issue Progress: [X]% complete*
```

This format ensures the issue checklist remains the authoritative source of progress while maintaining full PR review traceability.