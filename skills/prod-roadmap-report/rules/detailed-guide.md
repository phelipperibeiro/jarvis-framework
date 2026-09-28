# Project Status Report - Detailed Guide

This file contains detailed examples, section guidelines, and edge cases for the project status report skill.

Read `CLAUDE.md` and `memory/` in the working directory. If don't exist, suggest `/eis-pm-plugin:pm.memory` first.
## Section Guidelines

### Summary Paragraph

- Write in prose, not bullet points
- Max 200 words, divided in 2-4 paragraphs typical. Keep it concise but complete
- Capture the main discussion topics, based on time discussed and how many times was cited in the discussed
- Include context and key points
- Use neutral, factual language
### On Track

- Items showing positive progress
- Completed milestones
- Things proceeding as planned
- Format: **Bold topic name**: Description
- If nothing is explicitly on track, use empty list or omit section
- ignore this block in the final output if empty or don't have content
### Problems

- Current blockers
- Active issues
- Things not working as expected
- Format: **Bold problem name**: Description
- Only include explicitly mentioned problems
- ignore this block in the final output if empty or don't have content

### Risks & Concerns

- Potential future problems
- Uncertainties
- Dependencies that might fail
- When the topic is late or will re-scheduled
- Format: **Bold concern/risk name**: Description
- Only include explicitly mentioned concerns
- ignore this block in the final output if empty or don't have content

### Actions

- Specific next steps
- Assigned tasks (include assignee if mentioned)
- Decisions that require follow-up
- Simple list format
- Only include explicitly stated actions
- Don't invent actions

## Historical Context Usage

If previous reports or knowledge base information is available:

- **Team name consistency**: Use established team names from previous reports
- **Project naming**: Follow naming conventions from historical reports
- **Recurring issues tracking**: Check if current problems were mentioned in previous reports
- **Action item follow-up**: Cross-reference with previous action items to track completion
- **Pattern recognition**: Identify recurring risks or concerns
- **Context enrichment**: Use historical context to better understand abbreviations, codenames, or internal references

**Important**: Historical context is used ONLY for:
- Understanding terminology and naming patterns
- Maintaining consistency with previous reports
- Recognizing recurring themes

**NEVER use historical context for:**
- Inventing current status updates
- Filling in missing information
- Making assumptions about current progress

## Update Workflow

When updating an existing report:

1. **Read original report carefully**: Note language, section structure, formatting choices
2. **Preserve exact structure**: Keep the same headers, section order, and formatting style
3. **Insert new content BEFORE old content**: Maintain reverse chronological order
4. **Use current date**: DD-MM-YYYY format for new entry
5. **Maintain language consistency**: Use same language as original report

**Example of correct update structure:**

**Existing report on 01-12-2025:**

```markdown
## Backend Team
### Payment API

#### 01-12-2025
Database migration completed successfully. All endpoints tested and working.

**On track:**
- **Database migration**: Completed without downtime
...
```

**New update on 02-12-2025:**

```markdown
## Backend Team
### Payment API

#### 02-12-2025
Performance optimization implemented. Response times improved by 40%.

**On track:**
- **API performance**: Response time reduced from 500ms to 300ms
...

#### 01-12-2025
Database migration completed successfully. All endpoints tested and working.

**On track:**
- **Database migration**: Completed without downtime
...
```

New content is inserted BEFORE the old content, maintaining reverse chronological order.

## Handling Edge Cases

### Single Project, No Team Name

```markdown
## [Team Name To Be Defined]
### {Project Name}
#### {date}
{content}
```

### Multiple Teams, Same Project

Create separate sections for each team's perspective on the project.

### No Clear Project Structure

If the input is just general updates without clear project boundaries:

1. Ask the user (in their language) if the update refers to a specific project or is a general team status
2. Structure based on user response

### Conflicting Information

When there's conflicting information about status, dates, or other critical details:

- Stop and ask the user (in their language) to clarify which information is correct, quoting both conflicting statements

## Example Interactions

### Example 1: Well-Structured Input

**User provides:** Meeting transcription with clear team names, project discussions, problems, and actions.

**Assistant should:**

1. Extract all information
2. Structure into template
3. Generate complete markdown report
4. No questions needed

### Example 2: Ambiguous Input

**User provides:** Slack messages with technical discussions but no clear team attribution.

**Assistant should:**

1. Extract technical content
2. Organize into template structure
3. Ask (in user's language) which team is responsible for this work
4. Generate report after clarification

### Example 3: Multiple Projects

**User provides:** Long transcription covering 3 different initiatives.

**Assistant should:**

1. Identify the 3 initiatives
2. Extract information for each
3. Create single markdown with 3 sections (one per initiative)
4. Follow template for each section

### Example 4: Update Existing Report

**User provides:** Previous report file + new meeting notes

**Assistant should:**

1. Read and analyze previous report structure (language, sections, format)
2. Extract new information from meeting notes
3. Merge new info into existing structure while preserving EXACT format
4. Update date to current date
5. Insert new content BEFORE old content (reverse chronological)
6. Return updated report maintaining all original structural choices

### Example 5: Update with Historical Context

**User provides:** "Update the Backend Team report with today's updates" + new information

**Assistant should:**

1. Search for previous Backend Team reports in conversation history or knowledge base
2. Use historical context to understand team structure, naming conventions
3. Follow established patterns from previous reports
4. Generate updated report consistent with team's reporting style
5. Insert new update block before existing blocks

## Multiple Projects Structure Example

**Correct:**

```markdown
## Alpha Team

### Dashboard Analytics Project
#### 01-12-2025
{summary}
**On track:**
...

### Mobile App Redesign
#### 01-12-2025
{summary}
**On track:**
...

## Beta Team

### Social Login Feature
#### 01-12-2025
{summary}
**On track:**
...
```

Note: Each team header (`##`) appears only once, with all their projects grouped under it as subheaders (`###`).
