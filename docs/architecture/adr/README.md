# Architecture Decision Records (ADRs)

This directory contains the Architecture Decision Records (ADRs) for the NASA System 6 Portal project. ADRs capture important architectural decisions along with their context, consequences, and rationale.

## What are ADRs?

Architecture Decision Records are:
- Short text documents that capture a single architectural decision
- Written in the MADR (Markdown Architecture Decision Record) format
- Stored in version control alongside the codebase
- Chronologically ordered by decision date
- Never deleted or edited - only superseded by new decisions

## ADR Format

Each ADR follows this structure:

```markdown
# ADR-XXX: [Title]

- **Status**: [Proposed | Accepted | Deprecated | Superseded]
- **Date**: [YYYY-MM-DD]
- **Decision**: [Brief summary of the decision]
- **Context**: [Background and problem statement]
- **Options**: [Considered alternatives]
- **Decision**: [Chosen option with rationale]
- **Consequences**: [Positive and negative impacts]
- **Superseded by**: [Link to newer ADR if applicable]
```

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./001-react-systemcss.md) | React with System.css Framework | Accepted | 2024-01-15 |
| [ADR-002](./002-nasa-api-proxy.md) | NASA API Proxy Architecture | Accepted | 2024-01-20 |
| [ADR-003](./003-postgresql-persistence.md) | PostgreSQL for Data Persistence | Accepted | 2024-01-25 |
| [ADR-004](./004-react-context-state.md) | State Management with React Context | Accepted | 2024-02-01 |
| [ADR-005](./005-component-architecture.md) | Component-Based Architecture | Accepted | 2024-02-05 |
| [ADR-006](./006-docker-deployment.md) | Docker-based Deployment Strategy | Proposed | 2024-02-10 |

## ADR Process

### Creating New ADRs

1. **Draft**: Create new ADR with status "Proposed"
2. **Review**: Technical review by architecture team
3. **Discuss**: Team discussion during architecture review meeting
4. **Approve**: Change status to "Accepted"
5. **Implement**: Implement according to the decision
6. **Communicate**: Announce the decision to the team

### Modifying Existing ADRs

ADRs are never modified after acceptance. If circumstances change:
1. Create a new ADR that supersedes the old one
2. Update the original ADR status to "Superseded"
3. Reference the new ADR in the original

### ADR Template

```markdown
# ADR-XXX: [Descriptive Title]

- **Status**: Proposed
- **Date**: YYYY-MM-DD
- **Decision makers**: [List of decision makers]
- **Consulted**: [List of consulted parties]

## Context

[Brief description of the problem or situation that led to this decision]

## Decision

[Clear statement of the architectural decision]

## Options Considered

### Option 1: [Option Name]
[Description of the option]
**Pros**:
- [Advantage 1]
- [Advantage 2]
**Cons**:
- [Disadvantage 1]
- [Disadvantage 2]

### Option 2: [Option Name]
[Description of the option]
**Pros**:
- [Advantage 1]
- [Advantage 2]
**Cons**:
- [Disadvantage 1]
- [Disadvantage 2]

## Rationale

[Explanation of why the chosen option was selected over alternatives]

## Consequences

### Positive
- [Positive consequence 1]
- [Positive consequence 2]

### Negative
- [Negative consequence 1]
- [Negative consequence 2]

## Implementation

[Implementation notes and requirements]

## Superseded by

[Link to newer ADR if this one is superseded]
```

## ADR Review Process

### Monthly Architecture Review
- Review proposed ADRs
- Discuss implementation status
- Identify decisions needing reconsideration
- Plan future architectural improvements

### Emergency Decisions
For urgent decisions that cannot wait for regular review:
1. Document decision immediately
2. Schedule retroactive review within 1 week
3. Create formal ADR after emergency resolution

## Tools and Resources

### ADR Tools
- **Editor**: Any Markdown editor
- **Review**: Git-based review process
- **Visualization**: Mermaid diagrams in documentation
- **Tracking**: GitHub Issues for decision tracking

### References
- [MADR template](https://github.com/joelparkerhenderson/architecture_decision_record)
- [ADR Tools](https://adr.github.io/)
- [Architecture Decision Records - Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

---

*For questions about ADRs or the architecture decision process, contact the architecture team.*