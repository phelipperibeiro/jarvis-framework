---
description: Memory context where AIs can access and get context informations to remember data, names, patterns, so agents understands requests like a colleague would.
argument-hint: <write important informations like team names, projects, path of files and folders and other informations to help LLMs remember contexts and don't your mind.>
---
# Memory

Memory makes Claude your workplace collaborator - someone who speaks your internal language.

This command will create or update the memory of this skill.


## Instructions

### 1. Check What Exists

Check the working directory for:

```
CLAUDE.md                      ← About and full description hot memory
.claude/status-report-memory/  ← Folder memory of this skill
  glossary.md      ← Full decoder ring (everything)
  shortcuts.md     ← Index, summarys and shortcuts to know fast where get right informations
```

### 2. Create What's Missing
**If and `CLAUDE.md` and/or  `status-report-memory/` don't exist:** This is a fresh setup — begin the memory bootstrap workflow (see below). Place these in the current working directory.

If the memory exist, read, understand and maintain in you context to use when needed in during user interaction.

### 3. Bootstrap Memory (First Run Only)
Only do this if `status-report-memory/` don't exist yet.

Ask the user these questions **one section at a time**, allowing them to provide detailed answers:

**Squads and teams names:**
```
What are the names of your squads/teams?
- Please list all squad names exactly (or very similar) as they should appear in reports

This will help me learn what kind projects and teams you work with.
```

```
What are your main product and the initiatives your are working right now?
- Please list all the projects and products you are reponsible, and the main initiatives your team are working on. Names exactly (or very similar) as they appear in the reports

This will help me learn what kind projects and teams you work with.
```

**Files, notes and folders**
If the user has not provided enough information yet, ask:

```
Where do you keep your specs or status reports? This could be:
- A local file (e.g. transcripts, markdown notes, docx, txt)
- An app (e.g. Obsidian, Notion, Jira, Asana)
- Meeting transcripts files or directory
- Projects/Product directory

This will help me learn your workplace terms.
```

**Once you have access to this:**

Analyze it for potential projects, initiatives and teams names:
- Names that might be teams, squads or areas
- Project or Products references or codenames
- Initiatives, features or work items references
- Acronyms or abbreviations
- Internal terms or jargon
- Tags, YAML properties patterns and relations

**For each item, decode it interactively:**
Example:
```
Project/Iniative: "We are late to deliver a way to show negative debit in user digital account. This is blocked by Credit Card team."

I see some terms I want to make sure I understand:

1. **Digital Account** - This is a Product or Project?
2. **Show the Negative Debit** - Is an working in progress task?
3. **Credit Card team** - is another team working with your team?
```

Continue through each information, asking only about terms you haven't already decoded.

Gather data from available installed MCP sources:
- **Chat:** Recent messages, channels, DMs
- **Email:** Sent messages, recipients
- **Documents:** Recent docs, collaborators
- **Calendar:** Meetings, attendees

Build a braindump of people, projects, and terms found. Present findings grouped by confidence:
- **Ready to add** (high confidence) — offer to add directly
- **Needs clarification** — ask the user
- **Low frequency / unclear** — note for later
### 4. Write Memory Files
From everything gathered, create `pm-memory/glossary.md`: full decoder ring (acronyms, terms, nicknames, codenames)

```markdown
# Workspace Context

> **Purpose**: This file provides AI agents with essential context about workspace structure, naming conventions, and organizational patterns for Status Report tasks.
> **Last Updated**: YYYY-MM-DD

---

## Me
[Name], [Role] on [Team].

## Main Products/Projects 
| Name | What |
|------|------|
| **[Codename]** | [description] |

## Actual initiatives
| Name | What |Product/Project|
|------|------|------|
| **[Codename]** | [description] |[product/project name]|

## Other Squads/Teams

| Name | About |
|------|------|
| **[team/squad name]** | [description] |

## People
| Who | Role | Squad/Team |
|-----|------|------|
| **[Nickname]** | [Full Name], [role] | [Squad/Team name] |


## References and Assets
{list all notes (with links), files, folders and other references and sources used to create this report and that can be consulted in the future.}

```

When possible (only if you have high confidence), put link to the sources in the name of things. 

### creating or updating the shortcut.md
The `status-report-memory/shortcut.md` file is an index, to Agents and AI can know where to get informations and contexts faster. They contain paths, links and informations of files and other references sources where agents and AI can understand where get informations to give right and well informed aswers.

#### Rules to write and use shortcut.md
- You need to just read and understand this file. Don't get or read the files, contents, links and other sources the file is connecting. Do this just when needed.
- When user create new files of status report, insert in the Local Files section.
- If the user asks to record some file, source reference or link to be accessed in the future, insert this in the right section in the `shortcut.md`

The output of this file need to follow the template above:

```markdown
# Status Report Fast Memory

This document is an index file to get hot informations in a way the Agents and AIs can be well informed and know where to get informations.

## Local Files

Local files that are important and can always be consulted, with a high update rate.

| Filename | root path |about |
|------|------|------|
| [filename](path-to-the-file-name.md) | {full local path to the file} | {read the file and get a coerent and concise description max 250 chars.} |

## Links

Links of websites, sources and references.

| URL | about |
|------|------|
| {link or url} | {If the user don't give more information about it, read the source and get the meta description when available. max 250 chars. } |


## Other references

List of other sources, references and topics.

| Name | about |
|------|------|
| {name of the source, topic, subject} | {If the user don't give more information about it, read the source and try to get the meta description when available. max 250 chars. } |

```

## Notes

- If memory is already initialized, this just follow the user commands
- Names are critical — always capture how projects/products/initiatives are actually referred to
- If a source isn't available, skip it and note the gap
- Memory grows organically through natural conversation after bootstrap
- **Interactive Flow**: Ask questions one section at a time, don't overwhelm
- **Smart Defaults**: Suggest common patterns based on existing files if possible
- **Validation**: After each section, summarize what you understood for confirmation
- **Incremental**: User can say "skip" for optional sections
- **Editable**: Make it clear the file can be manually edited anytime