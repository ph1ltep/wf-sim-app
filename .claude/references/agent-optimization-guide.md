# Agent Optimization Guide

## 🚀 Performance Optimization Rules

### PARALLEL EXECUTION LIMITS
- **code-flow-inspector**: Up to 3 parallel instances
- **Planning agents**: All can run simultaneously  
- **Implementation agents**: Sequential only (avoid conflicts)
- **documentation-manager**: Can run parallel with any agent

### VALIDATION STRATEGY
**NO CONTINUOUS VALIDATION** - Only validate at:
1. Natural checkpoints (feature complete)
2. Explicit user request
3. Before PR creation

**Validation Modes:**
- **Quick** (30s): `npm run lint` only
- **Standard** (2m): `npm run lint && npm run build`
- **Full** (5m+): Complete test suite
- **Default**: SKIP validation

### MODEL ALLOCATION

**Opus (Complex Reasoning)**
- frontend-feature-architect
- api-data-architect  
- wind-finance-risk-analyst

**Sonnet (Fast Execution)**
- frontend-master-engineer
- code-flow-inspector
- quality-validation-specialist
- documentation-manager

## 📋 Agent Boundaries

### STRICT SEPARATION OF CONCERNS

**Planning Agents (NO CODE)**
- frontend-feature-architect: Architecture ONLY
- api-data-architect: Schema design ONLY
- wind-finance-risk-analyst: Analysis ONLY

**Implementation Agents (NO PLANNING)**
- frontend-master-engineer: Code ONLY
- documentation-manager: Docs ONLY

**Analysis Agents (READ-ONLY)**
- code-flow-inspector: NEVER modifies
- quality-validation-specialist: Testing ONLY

## ⚡ Optimization Patterns

### 1. PARALLEL-FIRST ANALYSIS
```
Run simultaneously:
- code-flow-inspector[1]: UI analysis
- code-flow-inspector[2]: State analysis  
- code-flow-inspector[3]: Data flow analysis
```

### 2. BATCH OPERATIONS
- Group related changes
- Avoid micro-commits
- Complete features before validation

### 3. LAZY VALIDATION
- Skip unless issues detected
- User must explicitly request
- End-of-task only

### 4. SMART DOCUMENTATION
- Only after significant changes
- Not for every edit
- Can run parallel with other agents

## 🎯 Expected Performance Gains

With these optimizations:
- **50-70% faster** execution
- **60% fewer tokens** used
- **3x parallel** analysis capacity
- **Clearer** agent outputs