
# Implementation Plan: Physics Engine for Three-Phase Weibull Component Failure Modeling

**Branch**: `001-physicsEngine` | **Date**: 2025-09-18 | **Spec**: [../001-physicsEngine/spec.md](../001-physicsEngine/spec.md)
**Input**: Feature specification from `/specs/001-physicsEngine/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement a physics-based backend service that calculates three-phase Weibull component failure distributions using scientifically-validated formulas. The system will process environmental parameters (turbulence, temperature, humidity) and component specifications to generate accurate failure rate predictions for wind turbine components (gearbox, generator, blades) compatible with the existing Monte Carlo simulation engine.

## Technical Context
**Language/Version**: Node.js/JavaScript (existing backend stack)
**Primary Dependencies**: Express.js, existing monte-carlo-v2 service, Yup validation
**Storage**: MongoDB (existing database), in-memory caching for physics calculations
**Testing**: Jest (existing test framework), integration tests with simulation API
**Target Platform**: Linux server (existing deployment)
**Project Type**: web (backend service extending existing architecture)
**Performance Goals**: <2000ms physics calculation response time, handle 100 concurrent requests
**Constraints**: Must integrate with existing monte-carlo-v2 API, scientific accuracy ±15% vs SGRE data
**Scale/Scope**: Support 10+ component types, 50+ environmental parameters, extensible physics model system

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Template not yet configured - applying standard web development principles
- ✅ Extend existing architecture (backend/frontend pattern)
- ✅ Follow existing patterns (Express, MongoDB, monte-carlo-v2 integration)
- ✅ Scientific accuracy requirements documented and measurable
- ✅ Integration approach defined (wrapper service pattern)
- ✅ Performance constraints specified (<2000ms response time)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - extends existing backend/frontend structure

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Physics API contract → 4 contract test tasks [P] (models, validate, calculate, cache)
- Data model entities → 6 model creation tasks [P] (PhysicsModel, EnvironmentalParameters, etc.)
- Quickstart scenarios → 4 integration test tasks (gearbox, IEC classes, environmental, multi-component)
- Implementation tasks to make tests pass

**Specific Task Categories**:

1. **Contract Tests (Parallel)** [P]:
   - GET /physics/models endpoint test
   - GET /physics/models/{type} endpoint test
   - POST /physics/calculate endpoint test
   - POST /physics/validate endpoint test
   - GET /physics/cache/stats endpoint test

2. **Data Model Implementation (Parallel)** [P]:
   - PhysicsModel schema and validation
   - EnvironmentalParameters with Yup validation
   - ComponentSpecifications with type-specific validation
   - IECClassParameters lookup system
   - LoadFactor calculation and caching
   - PhaseParameters with continuity constraints

3. **Physics Engine Core (Sequential)**:
   - PhysicsModelBase abstract class
   - ThreePhaseWeibull concrete implementation
   - Physics formulas (turbulence, temperature, corrosion)
   - Load factor calculation service
   - Continuity constraint solver
   - Result validation and benchmarking

4. **API Integration (Sequential)**:
   - Physics service wrapper implementation
   - Monte Carlo API integration
   - Request preprocessing logic
   - Response postprocessing logic
   - Error handling and fallback mechanisms
   - Performance caching system

5. **Integration Tests (After Implementation)**:
   - Gearbox physics calculation scenario
   - IEC class parameter validation scenario
   - Environmental load factor scenario
   - Multi-component calculation scenario
   - Edge cases and error handling tests

**Ordering Strategy**:
- TDD order: Contract tests → Data models → Physics engine → API integration → Validation
- Dependency order: Base classes → Concrete implementations → Services → API endpoints
- Mark [P] for parallel execution where files are independent
- Sequential tasks have explicit dependencies noted

**Task Dependencies**:
- Physics engine core depends on data models
- API integration depends on physics engine core
- Integration tests depend on full implementation
- Performance tests require caching system

**Estimated Output**:
- Contract tests: 5 tasks
- Data models: 6 tasks
- Physics engine: 8 tasks
- API integration: 6 tasks
- Integration tests: 5 tasks
- **Total: 30 numbered, ordered tasks in tasks.md**

**Task Completion Criteria**:
- All contract tests pass (TDD red-green cycle)
- Data validation follows existing Yup patterns
- Physics calculations match scientific benchmarks (±15%)
- API responses match OpenAPI specification
- Integration scenarios from quickstart.md execute successfully
- Performance requirements met (<2000ms response time)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
