/**
 * Extracts ticket ID from branch name or PR title using regex pattern
 */
export declare function extractTicketId(text: string, pattern: string): string | null;
export declare function extractTicketIdFromBranch(branchName: string, pattern: string): string | null;
export declare function extractTicketIdFromTitle(title: string, pattern: string): string | null;
