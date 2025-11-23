/**
 * Extracts ticket ID from branch name or PR title using regex pattern
 */

export function extractTicketId(text: string, pattern: string): string | null {
  try {
    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    return match ? match[0] : null;
  } catch (error) {
    // Invalid regex pattern
    return null;
  }
}

export function extractTicketIdFromBranch(branchName: string, pattern: string): string | null {
  return extractTicketId(branchName, pattern);
}

export function extractTicketIdFromTitle(title: string, pattern: string): string | null {
  return extractTicketId(title, pattern);
}
