# Resolution: Define saved-file compatibility for gathered facts

## Decision

New boards and downloads use `schemaVersion: 2`. Argument Maker accepts version 2 only.

There is no version-1 migration path because the product has no users and no downloaded version-1 board files. Uploading a version-1 or otherwise unsupported file returns **Unsupported Argument Board file version** and leaves the current board unchanged.

## Normalized file shape

Fact content is stored once in the board-level `gatheredFacts` array. Situation, Complication, and each Supporting Argument store ordered `factIds` references:

```json
{
  "schemaVersion": 2,
  "appName": "Argument Maker",
  "title": "Example",
  "createdAt": "2026-07-27T00:00:00.000Z",
  "updatedAt": "2026-07-27T00:05:00.000Z",
  "gatheredFacts": [
    {
      "id": "fact-1",
      "text": "The observed fact",
      "touched": true,
      "evidenceLink": "https://example.com/source",
      "dataType": "fact"
    }
  ],
  "scqa": {
    "situation": {
      "id": "situation",
      "text": "The short situation statement",
      "touched": true,
      "factIds": ["fact-1"]
    },
    "complication": {
      "id": "complication",
      "text": "The short complication statement",
      "touched": true,
      "factIds": []
    },
    "question": {
      "id": "question",
      "text": "What should change?",
      "touched": true
    },
    "answer": {
      "id": "answer",
      "text": "Adopt the proposed solution.",
      "touched": true
    }
  },
  "supportingArguments": [
    {
      "id": "argument-1",
      "text": "The main supporting reason",
      "touched": true,
      "mode": "evidence-backed",
      "factIds": ["fact-1"]
    }
  ]
}
```

The version-2 shape removes nested Supporting Data or Facts content and the direct Situation and Complication Evidence Link fields.

## Identity and reference validation

Import rejects the entire file when:

- Gathered Fact IDs are duplicated.
- Supporting Argument IDs are duplicated.
- SCQA IDs are not exactly `situation`, `complication`, `question`, and `answer`.
- A destination references a Gathered Fact ID that does not exist.
- One destination repeats the same Gathered Fact ID.
- A required field is missing or has the wrong type.
- Data Type or Support Mode contains an unsupported value.

No invalid reference is silently removed, deduplicated, or repaired. Blank fact text or Evidence Link remains valid file data because incomplete Gathered Fact drafts are allowed.

## Unknown fields

Unknown extra JSON fields are preserved during upload and later download when every required version-2 field and relationship is valid. The app does not interpret or display unknown fields. Known invalid fields still cause rejection.

## Replacement and clearing

1. Read and validate an uploaded file before asking to replace anything.
2. Invalid input shows an error and leaves the current board untouched.
3. A valid upload asks for confirmation only when the current board has touched content.
4. Confirmation replaces the entire board, including Gathered Facts and ordered references, in one operation.
5. **Clear Board** removes the entire board, including facts and attachments, behind the existing download-first confirmation.
6. No autosave or hidden persistence is introduced.
