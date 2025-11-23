import { LinearTicket } from './types';
import { extractAcceptanceCriteria } from './markdown-parser';

/**
 * Builds a formatted comment with ticket details and review request
 */
export function buildComment(ticket: LinearTicket, assistantMention: string): string {
  const acceptanceCriteria = extractAcceptanceCriteria(ticket.description);

  const comment = `${assistantMention} does the changes in this PR implement all the expected criteria according to the following details:

## Linear Ticket: ${ticket.identifier}

**Title:** ${ticket.title}

${ticket.url ? `**Link:** ${ticket.url}` : ''}

---

### Description

${ticket.description || 'No description provided.'}

---

### Acceptance Criteria

${acceptanceCriteria || 'No acceptance criteria found.'}

---

Kindly output the format if possible as a table using the example below or with clear illustrations on which of the criteria is met or not and provide recommendations.
| Criterion | Status | Notes |
|-----------|--------|-------|
| | | |
`;

  return comment;
}

/**
 * Builds an error comment explaining what went wrong
 */
export function buildErrorComment(errorMessage: string): string {
  return `## ⚠️ Ticket Validation Error

${errorMessage}

Please ensure:
- The ticket ID is correct
- The Linear API key is valid
- The ticket exists and is accessible
`;
}
