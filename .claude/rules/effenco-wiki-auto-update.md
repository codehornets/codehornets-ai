# Effenco Wiki Auto-Update Rule

## Purpose
Automatically update the Effenco wiki documentation when users ask questions, based on their audience role.

## When to Apply
This rule applies when:
1. A user asks a question about Effenco systems, processes, or architecture
2. You provide an answer that would be valuable for future reference
3. The answer is not already documented in the wiki OR needs updating
4. **When building a new feature** - Document implementation approach, design decisions, and usage
5. **When fixing a bug** - Document the bug, root cause, solution, and prevention measures

## Target Audiences & Documentation Areas

### 1. **Developers**
**Audience**: Software engineers, full-stack developers, backend/frontend developers

**Update these sections:**
- `effenco/wiki/pages/development/` - Development guides, coding standards, workflows
- `effenco/wiki/pages/codebase/` - Code explanations, module documentation
- `effenco/wiki/pages/architecture/` - System architecture, technical details
- `effenco/wiki/pages/development/faq-developer.md` - Developer FAQ

**Question types:**
- "How does [module/feature] work?"
- "What is the architecture of [component]?"
- "How do I implement [feature]?"
- "What are the coding standards for [language]?"
- "How do I debug [issue]?"

### 2. **DevOps/SRE**
**Audience**: Site reliability engineers, DevOps engineers, infrastructure engineers

**Update these sections:**
- `effenco/wiki/pages/infrastructure/` - Infrastructure setup, deployment
- `effenco/wiki/pages/operations/` - Runbooks, monitoring, incident response
- `effenco/wiki/pages/security/` - Security configurations, access control
- `effenco/wiki/pages/operations/faq-ops.md` - Operations FAQ

**Question types:**
- "How do I deploy [service]?"
- "What is the infrastructure architecture?"
- "How do I troubleshoot [issue]?"
- "What are the monitoring alerts?"
- "How do I access [environment]?"

### 3. **Product Managers/Stakeholders**
**Audience**: Product managers, business analysts, project managers, executives

**Update these sections:**
- `effenco/wiki/pages/product/` - Product features, roadmaps, requirements
- `effenco/wiki/pages/orientation/` - System overview, business processes
- `effenco/wiki/pages/reference/` - Glossary, terminology, business rules
- `effenco/wiki/pages/product/faq-business.md` - Business FAQ

**Question types:**
- "What does [system/module] do?"
- "What are the business capabilities?"
- "How does [business process] work?"
- "What is the current roadmap?"
- "What are the key metrics?"

### 4. **QA/Testers**
**Audience**: QA engineers, test automation engineers

**Update these sections:**
- `effenco/wiki/pages/development/testing.md` - Testing strategies, test environments
- `effenco/wiki/pages/operations/runbooks/` - Test data setup, test procedures
- `effenco/wiki/pages/development/faq-testing.md` - Testing FAQ

**Question types:**
- "How do I test [feature]?"
- "What are the test environments?"
- "How do I create test data?"
- "What are the testing standards?"

## Workflow

### Step 1: Answer the Question
First, provide a complete, accurate answer to the user's question.

### Step 2: Determine Audience
Based on the question type and context, identify the primary audience:
- Technical implementation details → **Developers**
- Infrastructure/deployment/operations → **DevOps/SRE**
- Business capabilities/processes → **Product/Business**
- Testing procedures → **QA/Testers**

### Step 3: Identify Target Files
Determine which documentation files should be updated:

**For new concepts not yet documented:**
- Create a new file in the appropriate directory
- Follow naming convention: `lowercase-with-dashes.md`
- Add entry to the section's README.md

**For existing concepts:**
- Update the existing file
- Check FAQ files for related questions
- Update the main index if it's a major addition

### Step 4: Update Documentation
After answering, automatically:

1. **Update or create the relevant documentation file(s)**
   - Add the explanation with clear headers
   - Include code examples if applicable
   - Add diagrams (Mermaid) for complex concepts
   - Include references to related documentation

2. **Update the FAQ file for that audience**
   - Add the question and a brief answer
   - Link to the detailed documentation
   - Keep answers concise (2-3 sentences max)

3. **Update README.md in the section** (if needed)
   - Add new document to the table of contents
   - Update summary if it's a major addition

### Step 5: Inform the User
After updating documentation, inform the user:
```
✅ I've updated the Effenco wiki documentation:
- Added/Updated: effenco/wiki/pages/[path]/[file].md
- Updated FAQ: effenco/wiki/pages/[audience]/faq-[type].md
```

## Documentation Standards

### File Structure
```markdown
# [Title]

> **Audience**: [Developer/DevOps/Business/QA]
> **Last Updated**: [YYYY-MM-DD]
> **Related**: [Links to related docs]

## Overview
[Brief description]

## [Section 1]
[Detailed content]

## Examples
[Code examples, commands, or procedures]

## Common Issues
[Troubleshooting tips]

## See Also
- [Related documentation]
```

### FAQ Entry Format
```markdown
### Q: [Question in user's language]

**A**: [Concise 2-3 sentence answer]

📖 **Details**: See [Link to detailed documentation]

**Tags**: `#[relevant-tags]`
```

## Example Scenarios

### Scenario 1: Developer asks "How does the stats module work?"
**Action:**
1. Answer the question comprehensively
2. Update `effenco/wiki/pages/codebase/stats-module.md` with detailed explanation
3. Add FAQ entry to `effenco/wiki/pages/development/faq-developer.md`
4. Update `effenco/wiki/pages/codebase/README.md` to include new doc

### Scenario 2: DevOps asks "How do I deploy the intra application?"
**Action:**
1. Answer with deployment steps
2. Update `effenco/wiki/pages/operations/runbooks/deploy-intra.md`
3. Add FAQ entry to `effenco/wiki/pages/operations/faq-ops.md`
4. Update `effenco/wiki/pages/operations/README.md`

### Scenario 3: PM asks "What modules exist in the system?"
**Action:**
1. Answer with module list and capabilities
2. Update `effenco/wiki/pages/product/system-capabilities.md`
3. Add FAQ entry to `effenco/wiki/pages/product/faq-business.md`
4. Update `effenco/wiki/pages/index.md` business modules section

### Scenario 4: Developer builds a new feature "Vehicle Export API"
**Action:**
1. Help implement the feature
2. Create `effenco/wiki/pages/codebase/features/vehicle-export-api.md` with:
   - Feature overview and purpose
   - Implementation details (routes, controllers, models)
   - API endpoints and request/response examples
   - Configuration requirements
   - Testing approach
3. Update `effenco/wiki/pages/development/faq-developer.md` with usage question
4. Update `effenco/wiki/pages/codebase/README.md` to list new feature
5. If API-related, update `effenco/wiki/pages/security/api-quick-reference.md`

### Scenario 5: Developer fixes bug "Stats results showing incorrect values"
**Action:**
1. Help fix the bug
2. Create `effenco/wiki/pages/codebase/bugs/stats-incorrect-values.md` with:
   - Bug description and symptoms
   - Root cause analysis
   - Solution implemented (code changes)
   - How to verify the fix
   - Prevention measures (tests added, validation added)
3. Update `effenco/wiki/pages/development/faq-developer.md` with troubleshooting entry
4. If it reveals a design issue, update relevant architecture docs

## FAQ File Locations (Create if missing)

Create these FAQ files in the wiki:
- `effenco/wiki/pages/development/faq-developer.md` - Developer questions
- `effenco/wiki/pages/operations/faq-ops.md` - Operations/DevOps questions
- `effenco/wiki/pages/product/faq-business.md` - Business/PM questions
- `effenco/wiki/pages/development/faq-testing.md` - Testing/QA questions

## Exception Cases

**Do NOT update wiki when:**
- Question is about personal/sensitive information
- Answer is temporary or highly contextual
- Information is already perfectly documented
- Question is conversational/off-topic
- User explicitly asks not to update docs

## Quality Standards

Before updating wiki:
- ✅ Answer is accurate and complete
- ✅ Content is audience-appropriate
- ✅ Examples are provided where helpful
- ✅ Links to related docs are included
- ✅ Formatting follows markdown standards
- ✅ No sensitive information (credentials, keys, etc.)
- ✅ No hard-coded environment-specific values

## Feature Development Documentation

When building a new feature, create comprehensive documentation:

### Feature Documentation Structure
Create: `effenco/wiki/pages/codebase/features/[feature-name].md`

```markdown
# [Feature Name]

> **Audience**: Developers
> **Last Updated**: [YYYY-MM-DD]
> **Status**: [In Development/Released/Deprecated]
> **Related**: [Links to PRs, Issues, ADRs]

## Overview
Brief description of the feature and its purpose.

## Business Context
Why was this feature needed? What problem does it solve?

## Implementation

### Architecture
- High-level design decisions
- Components involved
- Data flow diagram (Mermaid)

### Code Structure
- Files created/modified
- Key classes/functions
- Database changes (migrations)

### API Endpoints (if applicable)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/... | ... | Bearer |

### Configuration
Environment variables, config files, feature flags needed.

## Usage Examples

### Code Example
```php
// Example usage
```

### API Example
```bash
curl -X GET https://intra.effenco.com/api/...
```

## Testing

### Test Coverage
- Unit tests: [file paths]
- Integration tests: [file paths]
- Manual testing steps

### Test Data
How to create test data for this feature.

## Deployment Notes
- Migration steps
- Rollback procedure
- Monitoring/alerts to set up

## Known Limitations
Current limitations or future improvements planned.

## See Also
- [Related features]
- [Architecture decisions]
```

### Update Checklist for New Features
- [ ] Create feature documentation in `codebase/features/`
- [ ] Add FAQ entry in `development/faq-developer.md`
- [ ] Update `codebase/README.md` feature list
- [ ] If API: Update `security/api-quick-reference.md`
- [ ] If architecture change: Update architecture docs
- [ ] Add to release notes (if applicable)

## Bug Fix Documentation

When fixing a bug, document it for future reference:

### Bug Documentation Structure
Create: `effenco/wiki/pages/codebase/bugs/[bug-slug].md`

```markdown
# Bug: [Short Description]

> **Audience**: Developers
> **Last Updated**: [YYYY-MM-DD]
> **Severity**: [Critical/High/Medium/Low]
> **Status**: Fixed
> **Fixed In**: [PR/commit/version]

## Symptoms
What users experienced or error messages seen.

## Reproduction Steps
1. Step 1
2. Step 2
3. Expected vs Actual behavior

## Root Cause
Detailed analysis of what caused the bug.

### Code Location
- File: `path/to/file.php:123`
- Function/method: `functionName()`

### Why It Happened
Explanation of the underlying issue.

## Solution

### Changes Made
```php
// Before
[old code]

// After
[new code]
```

### Files Modified
- `path/to/file1.php` - [description]
- `path/to/file2.php` - [description]

## Testing

### Verification Steps
How to verify the fix works:
1. Step 1
2. Step 2
3. Expected outcome

### Tests Added
- Unit test: `tests/Unit/...`
- Integration test: `tests/Feature/...`

## Prevention

### How to Prevent Similar Bugs
- Validation added
- Tests added
- Code review checklist updated
- Documentation updated

### Related Issues
Links to similar bugs or related tickets.

## See Also
- [Related documentation]
- [Architecture affected]
```

### Update Checklist for Bug Fixes
- [ ] Create bug documentation in `codebase/bugs/`
- [ ] Add troubleshooting entry to FAQ
- [ ] Update relevant feature docs if design changed
- [ ] Add tests to prevent regression
- [ ] Update architecture docs if patterns changed
- [ ] Add to known issues list (if workaround needed)

## Directory Structure for New Documentation

Ensure these directories exist in the wiki:
```
effenco/wiki/pages/
├── codebase/
│   ├── features/          # Feature documentation
│   ├── bugs/              # Bug fix documentation
│   ├── modules/           # Module deep-dives
│   └── README.md          # Feature/module index
├── development/
│   ├── faq-developer.md   # Developer FAQ
│   └── ...
└── ...
```

## Notes
- Always read existing documentation before updating to avoid duplication
- Prefer updating existing docs over creating new ones
- Keep FAQ answers brief; link to detailed docs
- Use consistent terminology across all documentation
- Include diagrams for complex concepts using Mermaid syntax
- **For features**: Focus on "how to use" and "how it works"
- **For bugs**: Focus on "what happened" and "how to prevent"
- Link features to their tests and vice versa
- Cross-reference related features and bugs
