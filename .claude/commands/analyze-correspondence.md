# Analyze Correspondence for Use Cases

Analyze the provided correspondence image to extract use cases for the Intl-Dossier system architecture.

## Instructions

You are analyzing real diplomatic/official correspondence to validate and improve the Intl-Dossier architecture. Follow this structured approach:

### Step 1: Read the Repository

First, read the current state of the use case repository:

- File: `docs/USE_CASE_REPOSITORY.md`
- Note the current correspondence count (CORR-2026-XXX)
- Note the current use case count (UC-XXX)
- Review existing patterns to identify matches

### Step 2: Analyze the Correspondence

Extract the following from the provided image:

**Metadata:**
| Field | Value |
|-------|-------|
| Correspondence ID | CORR-2026-[next number] |
| Document Type | (Telegram/Letter/Email/Memo/etc.) |
| Direction | (Inbound/Outbound/Internal) |
| Priority | (Urgent/Normal) |
| Language | (Arabic/English/Bilingual) |
| From | (Organization/Person) |
| To | (Organization/Person) |
| Date | |
| Reference Number | (if any) |
| Subject | |

**Content Summary:**

- Summarize in 2-3 sentences
- Note any deadlines
- Note any action required

### Step 3: Extract Entities

Identify all entities mentioned:

- Organizations (with parent relationships)
- Persons (with titles/roles)
- Countries
- Forums/Committees
- Documents referenced

### Step 4: Derive Use Cases

For each new use case identified:

````markdown
#### UC-[XXX]: [Title]

**Category:** [ENT/WFL/CMT/DOC/REL/RPT/I18N]
**Priority:** [High/Medium/Low]
**Current Support:** [Gap Identified/Partial Support/Supported]

**Scenario:**
[Describe the real-world scenario]

**Required Capabilities:**

- [ ] Capability 1
- [ ] Capability 2

**Proposed Schema:** (if applicable)

```sql
-- SQL here
```
````

````

### Step 5: Identify Patterns

Check if this correspondence matches existing patterns:
- Pattern 1: Questionnaire Request
- Pattern 2: MoU Lifecycle
- Pattern 3: Nomination Request
- Pattern 4: Leadership Announcement
- Pattern 5: Event Booking
- Pattern 6: Internal Coordination
- (or identify new pattern)

### Step 6: Update the Repository

Update `docs/USE_CASE_REPOSITORY.md`:
1. Increment correspondence count in header
2. Increment use case count in header
3. Add new use cases to the Use Case Index table
4. Add full correspondence analysis section
5. Update Priority Matrix if new P1 items
6. Update Architecture Gaps table
7. Update all relevant Appendices:
   - Correspondence Log
   - Entity Registry
   - Deadline Registry (if applicable)
   - MoU Registry (if applicable)
   - Leadership Registry (if applicable)
   - Contact Directory (if applicable)
   - Forum Sessions Registry (if applicable)
   - Side Events Registry (if applicable)
   - Staff Directory (if applicable)
   - Department Registry (if applicable)
   - Agenda Items (if applicable)
8. Add new pattern to Emerging Patterns (if new)

### Step 7: Provide Summary

After updating, provide a summary:

```markdown
## Summary: CORR-2026-[XXX] ([Brief Title])

| Metric | Value |
|--------|-------|
| New Use Cases | X (UC-XXX to UC-XXX) |
| New Entities | X |
| New Patterns | X |
| [Other relevant metrics] | |

### Key Insights
1. [Insight 1]
2. [Insight 2]
3. [Insight 3]

### Updated Repository Stats
| Metric | Total |
|--------|-------|
| Correspondences | X |
| Use Cases | X |
| Patterns | X |
| [etc.] | |
````

## Terminology Reference

### Use Case Categories

- **ENT** - Entity Management
- **WFL** - Workflow & Routing
- **CMT** - Commitments & Deadlines
- **DOC** - Document Management
- **REL** - Relationships
- **RPT** - Reporting & Analytics
- **I18N** - Internationalization/Bilingual

### Correspondence Types Seen

1. Questionnaire Request (deadline-driven)
2. MoU Notification (approval chain)
3. Nomination Request (committee membership)
4. Leadership Announcement (informational)
5. Event Booking (logistics)
6. Internal Coordination (task assignment)

### Common Arabic Terms

| Arabic            | English            |
| ----------------- | ------------------ |
| برقية صادرة       | Outgoing Telegram  |
| برقية واردة       | Incoming Telegram  |
| مذكرة             | Memo               |
| خطاب              | Letter             |
| عاجل/عاجلة جداً   | Urgent/Very Urgent |
| مذكرة تفاهم       | MoU                |
| قرار مجلس الوزراء | Cabinet Resolution |
| مرسوم ملكي        | Royal Decree       |
| لجنة التحكيم      | Jury Committee     |
| نقطة الاتصال      | Focal Point        |

## Example Usage

User provides an image of a correspondence, then this command analyzes it and updates the repository.

$ARGUMENTS
