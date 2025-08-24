#!/bin/bash
# Test script to demonstrate scratchpad cleanup automation

echo "🧹 Testing Scratchpad Cleanup Automation"
echo "========================================"

# Create test scratchpads
echo "📝 Creating test scratchpads..."
mkdir -p .claude/scratchpads/{planner,builder,analyzer}

echo "Test content for issue 123" > .claude/scratchpads/planner/issue-123-test-feature.md
echo "Test content for PR 456" > .claude/scratchpads/builder/pr-456-test-implementation.md
echo "Test content for issue 789" > .claude/scratchpads/analyzer/issue-789-test-analysis.md

echo "📋 Current scratchpads:"
find .claude/scratchpads -name "*.md" -type f

echo ""
echo "🔄 Simulating issue 123 closure..."
find .claude/scratchpads -name "*issue-123*" -delete

echo "📋 After issue 123 cleanup:"
find .claude/scratchpads -name "*.md" -type f

echo ""
echo "🔄 Simulating PR 456 merge..."
find .claude/scratchpads -name "*pr-456*" -delete

echo "📋 After PR 456 cleanup:"
find .claude/scratchpads -name "*.md" -type f

echo ""
echo "✅ Cleanup automation test complete!"
echo "Files are automatically cleaned up when using the naming convention:"
echo "  - issue-{number}-{topic}.md"
echo "  - pr-{number}-{topic}.md"