---
read_only: true
---

Please address the PR review comments and implement requested changes: $ARGUMENTS.

Follow these steps:

**IMPORTANT**: Use sub-agents in parallel and/or sequential thinking as much as needed.

# ANALYZE - EXHAUSTIVE COMMENT COLLECTION
1. **PR Overview**: Use `gh pr view $ARGUMENTS` to get current PR details and status
2. **PR Comments**: Use `gh pr view $ARGUMENTS --comments` to fetch all review comments and discussions
3. **Commit Comments**: Use `gh api repos/:owner/:repo/pulls/$ARGUMENTS/comments` to get all commit-level comments
4. **Review Comments**: Use `gh api repos/:owner/:repo/pulls/$ARGUMENTS/reviews` to get all review submissions
5. **Issue Comments**: If PR links to issues, use `gh api repos/:owner/:repo/issues/:number/comments` for issue discussions
6. **Previous Action Log**: Search PR comments for previous bot/AI action summaries to understand what's been addressed
7. **Structured Data**: Use `gh pr view $ARGUMENTS --json` to get complete PR metadata including linked issues
8. **Comment Status Tracking**: Identify which comments have been resolved vs. still need attention
9. Parse and categorize ALL feedback by type (bugs, improvements, questions, resolved, pending)
10. Ask clarifying questions about any ambiguous feedback if necessary

# CONTEXT
1. Review the current branch and codebase state
2. Understand what changes were already made in the PR
3. Search the scratchpads for previous analysis related to this issue/PR
4. Search the codebase for files mentioned in review comments
5. Analyze the relationship between reviewer feedback and existing implementation

# PLAN
1. **Comment Inventory**: Create comprehensive list of ALL unresolved comments with unique identifiers
2. **Previous Actions Review**: Analyze any previous AI action logs to avoid duplicate work
3. **Systematic Addressing**: Plan how to address each review comment with clear traceability
4. **Task Breakdown**: Break down requested changes into small, manageable, trackable tasks
5. **Priority Matrix**: Prioritize changes based on reviewer feedback severity, impact, and dependencies
6. **Conflict Resolution**: Identify potential conflicts between different reviewer suggestions
7. **Action Plan Documentation**: Document comprehensive approach plan in scratchpad following @.claude/references/scratchpads.md
8. **Progress Tracking Setup**: Prepare structure for maintaining action log throughout implementation

# IMPLEMENT - WITH COMPREHENSIVE LOGGING
- **Branch Management**: Stay on the current PR branch (do not create a new branch)
- **Systematic Implementation**: Address review comments in logical, small steps according to your plan
- **Action Logging**: After each significant change, post a comment to the PR documenting:
  - Which specific comments/reviews were addressed
  - What changes were made and why
  - Which files were modified
  - Any remaining items for that comment thread
  - Unique reference ID for tracking
- **Commit Traceability**: Reference specific review comment IDs in commit messages
- **Progress Updates**: Update PR with structured progress comments after major milestones
- **Change Documentation**: Commit your changes after each significant fix/improvement
- **Continuous Sync**: Push changes to the server after each commit

# TEST  
- Ask if we should run tests, and wait for a response. If No, skip TEST section here.
- IMPORTANT: Use Playwright MCP to run UI tests if changes affect the UI
- Write or update Playwright tests if reviewer requested test coverage
- Run the full test suite to ensure fixes don't break existing functionality
- If tests fail, fix them before proceeding
- Ensure all tests pass before finalizing changes
- Use documentation-manager to update any relevant documentation mentioned in reviews
- When making changes to schema definitions in @schemas/yup, restart the frontend for changes to take effect

# FINALIZE - SESSION SUMMARY & CONTINUITY
- **Final Commit**: Create a summary commit if multiple small commits were made
- **Branch Sync**: Push final changes to the PR branch
- **Comprehensive Session Summary**: Add a structured comment to the PR including:
  - **Session ID**: Unique identifier for this review session (timestamp-based)
  - **Comments Addressed**: Complete list of which review comments were resolved
  - **Files Modified**: All files changed during this session
  - **Actions Taken**: Detailed log of all changes made
  - **Remaining Items**: Clear list of unaddressed comments/feedback for future sessions
  - **Next Steps**: Recommended actions for subsequent review cycles
  - **Testing Status**: What tests were run and results
- **Continuity Tagging**: Use consistent tags/labels for easy future session recognition
- **Status Update**: Mark resolved comment threads as addressed where possible
- **Do NOT create a new PR**: Stay within the existing PR workflow

**CRITICAL INSTRUCTIONS**
- Commits MUST follow instructions @.claude/references/git-conventional-commits.md
- Reference review comment IDs or reviewer names in commit messages when addressing specific feedback
- Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks
- IMPORTANT: Address each review comment systematically and document which comments have been resolved
- Update any issue checklists if the original issue has tracking items
- Maintain clear traceability between reviewer feedback and implemented changes

**STRUCTURED LOGGING FORMAT**
Use this template for PR action log comments:

```markdown
## 🤖 AI Review Session - [SESSION-ID]

### 📋 Comments Addressed
- **Comment ID/Thread**: [reviewer-name#comment-id] - [brief description]
  - **Action**: [what was done]
  - **Files**: [modified files]
  - **Status**: ✅ Resolved / 🔄 Partial / ⏳ In Progress

### 📂 Files Modified This Session
- `path/to/file1.js` - [reason for change]
- `path/to/file2.tsx` - [reason for change]

### 🧪 Testing Performed
- [x] Unit tests passed
- [x] UI tests (Playwright) - [specific scenarios]
- [ ] Integration tests - [if applicable]

### 📝 Remaining Items
- **[reviewer-name#comment-id]**: [description of unaddressed feedback]
- **[reviewer-name#comment-id]**: [description of unaddressed feedback]

### 🎯 Next Steps
- [recommended actions for next session]
- [dependencies or blockers]

---
*Session completed: [timestamp]*
```

This format ensures future sessions can quickly understand what has been completed and what remains to be addressed.