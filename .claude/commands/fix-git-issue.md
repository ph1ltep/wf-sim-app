Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

**IMPORTANT**: Use sub-agents in parallel and/or sequential thinking as much as needed.

# PLAN 
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Ask clarifying questions if necessary
4. Understand the prior art for this issue
  - Search the scratchpads for previous thoughts related to this issue
  - search PRs to see if you can find history on this issue
  - Search the codebase for relevant files
5. Think harder about how to break the issue down into a series of small, manageable tasks.
6. Document your plan in a new scratchpad. Follow instructions @.claude/references/scratchpads.md

# CREATE
- Create a new branch for the issue
- Solve the issue in small, manageable steps, according to your plan.
- Commit your changes after each step and push to server.


# TEST
- Ask if we should run tests, and wait for a response. If No, skip TEST section here.
- Use Playwright via MCP to test the changes if you have made changes to the UI
- Write jest tests to describe the expected behaviour of your code
- Run the full test suite to ensure you haven't broken anything.
- If the tests are failing, fix them.
- Ensure that all tests are passing before moving on to the next step.
- Use documentation-manager to update any relevant API, data structure, registry or other pre-documented feature. Create documentation for core complex features if not yet available (do not document UI components unless explicitly asked to do so)
- When making changes to schema definition in @schemas/yup, you must stop/restart the frontend for changes to take effect.

# DEPLOY
- Push, create a PR, and request a review.

**CRITICAL INSTRUCTIONS**
- Commits MUST follow instructions @.claude/references/git-conventional-commits.md
- Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
- IMPORTANT: Maintain the any git issue checklist updated with latest status at every commit.
