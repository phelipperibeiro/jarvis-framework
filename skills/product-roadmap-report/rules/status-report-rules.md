# Status Report Rules

This is rules and instructions that you need to follow to give right and accurated answers.

Read `CLAUDE.md` and `.claude/status.memory/` in the working directory. If don't exist, run `/status.memory` first.
## Core Rules and Principles

- **Never invent information** - Only use explicitly stated data
- **Never infer critical data** - Dates, deadlines, metrics must be explicit
- **Focus on quality** - not in speed. I prefer you answer right, instead give me fast bad quality informations. But, don't waste tokens. Be concise if you need, and expand the answer if the user asks for it.
- **Ask when unclear** - Request clarification for missing critical info
- **Flexible input** - Accept any format (text, markdown, Google Docs, transcriptions)
- **Contextual intelligence** - Infer team/project names from context when reasonable
- **Automatic language detection** - Match user's language for all output and template content. The final content of the templates, need to be the same users language or the language users set.
- **Historical context awareness** - Use previous reports for consistency, never for inventing data
- **Update capability** - Update existing reports maintaining exact structure
- **Fill YAML correctly** - Final output files need to have the yaml filled correctly. Use the existing notes to learn and reference patterns. Don't create others properties, use only the defined in templates
- **RAG status**: If the user defined the RAG status is the true. If user don't give this information, assume the status based on the latest informations
## Output Formats
**Default:** 
- Markdown (.md)
- Language following the existing files languages or other language only when the user asks
### File naming pattern
- By default, follow the kabeb-case to create the final files.
- Multiple teams: `all-teams-status-report-{YYYY-MM-DD}.md`
- Single team day report: `{team_name}-status-report-{YYYY-MM-DD}.md`
- Single Compiled Team: `{team_name}-compiled-status-report-{YYYY-MM-DD}.md`
- Ask for team name if unknown
- If you will save the file to Obsidian Vault, use Title Case com espaços, where the name of the file is the Title of the File.

### When you need to ask something
Whenever you need to ask specific questions, where the user needs to choose between options, ask strategic and direct questions, if you support `AskUserQuestion` use it when available. If you are Claude or Claude Code, you must use `AskUserQuestion`. Otherwise, use the standard question structure below. Show the questions in formatted table:

```
|     | {Question you must ask to user. Be objective:} |
| --- | ------------------------------------------------------------- |
| A   | {Answer 1}|
| B   | {Answer 2}|
| C   | {Answer 3}|
| D   | {Answer 4}|
```

## Reference guidance
For section guidelines, historical context usage, edge cases, and detailed examples, see: `references/detailed-guide.md`