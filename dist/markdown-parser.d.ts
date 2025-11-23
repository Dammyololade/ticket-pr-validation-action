/**
 * Extracts acceptance criteria from markdown description
 * Looks for bullet/numbered lists under relevant headings
 * Falls back to entire description if no headings found
 */
export declare function extractAcceptanceCriteria(description: string | null): string;
