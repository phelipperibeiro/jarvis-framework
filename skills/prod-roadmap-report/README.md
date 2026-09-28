# README

A Claude skill for extracting and structuring product roadmap information from various sources into standardized markdown reports.

## Overview

This skill transforms unstructured inputs (meeting transcriptions, Slack messages, emails, documents) into well-organized roadmap reports following consistent templates. It's designed for product managers, team leads, and anyone who needs to consolidate roadmap updates from multiple sources.

The skill maintains a strict policy of **never inventing information** — it only uses explicitly stated data and asks for clarification when critical information is missing.

## Key Features

- **Multi-source Input**: Accepts meeting transcripts, chat messages, emails, Google Docs, or any text format
- **Automatic Language Detection**: Outputs match the user's language
- **Template-based Output**: Generates consistent markdown reports with YAML frontmatter
- **Update Capability**: Can update existing reports while preserving structure and reverse chronological order
- **Obsidian Integration**: Supports saving directly to Obsidian vaults with proper linking
- **Historical Context Awareness**: Uses previous reports for consistency (terminology only, never for inventing data)
- **RAG Status Support**: Tracks Red/Amber/Green status for each project/initiative
- **Project Confirmation**: Before generating, asks user to confirm the list of projects to include

## Usage

### Basic Usage

Simply provide your meeting notes, transcript, or messages:

```
Here are my notes from today's PM sync:

- Payment integration: Tests completed successfully, rollout starting next week
- User notification: Design in progress, Sarah presenting next Tuesday
- Database migration: 35% complete, on track for February deadline
- Blocked on API credentials from external vendor since last week
```

The skill will:
1. Detect your language
2. Ask for team name if not inferable
3. Ask you to confirm the list of projects before generating
4. Generate a structured report following the template

### Updating Existing Reports

Provide the existing report plus new information:

```
Update the Platform compiled report with today's sync notes:

[paste or reference existing report]

New notes from 2026-01-21:
- API integration: First real transaction processed successfully
- Email notifications: Design approved, development starting tomorrow
```

The skill will:
1. Read and analyze the existing report structure
2. Insert new content BEFORE old content (maintaining reverse chronological order)
3. Preserve exact formatting, language, and section structure
4. Update the `updated_at` field in frontmatter

### Obsidian Integration

If you use Obsidian, the skill can:
- Save reports directly to your vault
- Update existing notes in place
- Follow your vault's file naming conventions (Title Case with spaces)
- Create proper `[[wiki links]]` for related notes and people
- Maintain consistent YAML frontmatter

When saving to Obsidian, specify your vault path when asked.

## Report Types

### 1. Single Team Status Report
Daily status report for one team and its projects. Contains the latest status for each project on a specific day.

**Use case**: Quick daily updates from a standup, sync meeting, or PM check-in.

**File pattern**: `{team-name}-status-report-{YYYY-MM-DD}.md`

**Template**: `templates/template-single-team-status.md`

### 2. Compiled Team Report
Aggregated report combining multiple daily reports for one team over time. Groups all historical updates by project, with dates in reverse chronological order (newest first).

**Use case**: Weekly summaries, historical tracking, or comprehensive team overview.

**File pattern**: `{team-name}-compiled-status-report-{YYYY-MM-DD}.md`

**Template**: `templates/template-single-team-compiled-status.md`

### 3. Multiple Teams Report
Consolidated report grouping multiple teams with their respective projects. Combines compiled reports from several teams into one document.

**Use case**: Leadership reviews, cross-team syncs, quarterly updates, or organization-wide status.

**File pattern**: `all-teams-status-report-{YYYY-MM-DD}.md`

**Template**: `templates/template-multiple-teams-compiled-status.md`

### 4. Projects List
A structured table listing all projects extracted from status reports with their current status and RAG rating.

**Use case**: Portfolio overview, project inventory, or executive summary.

**Template**: `templates/template-projects-list.md`

## Report Structure

### YAML Frontmatter

All reports include structured frontmatter for integration with tools like Obsidian:

```yaml
---
tags:
  - work/report
created_at: 2026-01-06
updated_at: 2026-01-21
type: note
company: "[[Company Name]]"
related_people:
  - "[[Person Name]]"
related:
  - "[[Related Note]]"
---
```

### Summary Table

Compiled reports include a summary table at the top:

| Project/Initiative | Observation | Status | RAG rating | Priority |
| --- | --- | --- | --- | --- |
| Project Name | Brief current state | in progress | on track | high |

### Project Sections

Each project section follows this structure:

```markdown
## Project Name

- status: in progress
- rag status: on track

### YYYY-MM-DD

Summary paragraph describing the main discussion points, progress, 
and context. Written in prose, max 200 words.

**On track:**
- **Item name**: Description of positive progress

**Problems:**
- **Issue name**: Description of current blocker

**Risks and Concerns:**
- **Risk name**: Description of potential future problem

**Actions:**
- Action item with assignee if mentioned
```

## Real-World Example

Here's an example of a compiled report section:

```markdown
## Third-Party API Integration

- status: in progress
- rag status: on track

### 2026-01-20

The team successfully tested the integration flow with a pilot customer, 
completing three end-to-end transactions. The MVP is progressing well and 
the first phase has moved to development. Progressive rollout will begin 
at the end of January, initially targeting customers already connected 
to the external service.

**On track:**
- **Production tests**: Successful transactions completed with pilot customer
- **Development**: First phase already sent to development team
- **Rollout planning**: Timeline established from January to March with gradual expansion

**Problems:**
- **Testing limitations**: Unable to test with certain providers not yet connected to the service
- **Process definition**: Lack of standardization for post-acceptance payment workflow

**Risks and Concerns:**
- **Customer dependency**: Delays may occur if customers take too long to make decisions
- **Untested scenarios**: Still missing tests for edge cases like rejection flows and discount rules

**Actions:**
- Continue testing with more customers to validate uncovered scenarios
- Define and formalize standard payment process
- Execute progressive rollout: 5% in first week of February, expanding gradually

### 2026-01-06

The integration initiative is advancing with flow design in Figma and 
preparation for technical alignment meeting. The team is splitting the 
user journey into two options: the current method and the new API-based flow.

**On track:**
- **Figma flow in development**: Design team working on the complete flow
- **Technical meeting scheduled**: Meeting set for tomorrow with backend team

**Risks and Concerns:**
- **Competition ahead**: Competitors already knew about this integration possibility before us

**Actions:**
- Hold meeting with backend team to align technical effort
- Schedule review meeting to validate the designed flow
```

## Core Principles

### What the Skill WILL Do

✅ Use only explicitly stated information  
✅ Mark sections empty if no relevant info exists  
✅ Preserve original terminology from sources  
✅ Ask for clarification when critical info is missing  
✅ Maintain reverse chronological order (newest first)  
✅ Group all projects under a single team header  
✅ Check if updating existing report before creating new one  
✅ Preserve exact structure when updating existing reports  
✅ Fill YAML frontmatter correctly based on template patterns  
✅ Move done/resolved topics to the appropriate section  

### What the Skill WILL NOT Do

❌ Invent dates, deadlines, or timelines  
❌ Create action items that weren't stated  
❌ Infer problems/risks from neutral statements  
❌ Add team members/stakeholders not mentioned  
❌ Make up metrics or quantitative data  
❌ Fabricate technical details  
❌ Assume project status without explicit indication  
❌ Update wrong dates or wrong projects  
❌ Create extra blocks not in templates (Meeting Notes, Learnings, etc.)  

## Trigger Phrases

The skill activates when you mention:
- "status report"
- "project update"
- "sync notes"
- "war room"
- "team report"
- "weekly update"

## File Structure

```
project-status-report/
├── SKILL.md                    # Main skill definition
├── README.md                   # This file
├── templates/
│   ├── template-single-team-status.md
│   ├── template-single-team-compiled-status.md
│   ├── template-multiple-teams-compiled-status.md
│   └── template-projects-list.md
└── references/
    └── detailed-guide.md       # Extended examples and edge cases
```

## Allowed Tools

This skill can use:
- `conversation_search` - Find previous reports in chat history
- `google_drive_search` - Search for source documents
- `google_drive_fetch` - Retrieve Google Docs content

## Best Practices

1. **Update existing historical reports** - When possible, provide or reference existing compiled reports so the skill can add new updates while maintaining full context and history. This produces more complete and consistent results.
2. **Be explicit about team names** - Helps avoid clarification questions and ensures proper file naming.
3. **Include dates when relevant** - Ensures accurate timeline tracking and proper ordering.
4. **Mention assignees for actions** - Creates accountable action items (e.g., "assigned: @john").
5. **Provide context for acronyms** - Especially on first use (e.g., "CRM (Customer Relationship Management)").
6. **Separate concerns clearly** - Distinguish between current problems (active blockers) and potential risks (future concerns).
7. **Use consistent project names** - Helps the skill match updates to the correct project in existing reports.
8. **Indicate RAG status when known** - If you know a project is at risk or blocked, mention it explicitly.
9. **Reference related people** - Mention team members and stakeholders so they can be linked in the frontmatter.
10. **Group related topics** - If multiple updates belong to the same initiative, present them together in your input.

## Contributing

To modify templates or add new report types:

1. Edit files in the `templates/` directory following existing patterns
2. Update the SKILL.md with new instructions if needed
3. Add examples to `references/detailed-guide.md` for edge cases

---

*This skill was designed for product management workflows at scale, supporting teams that need consistent, reliable status reporting without manual formatting overhead.*
