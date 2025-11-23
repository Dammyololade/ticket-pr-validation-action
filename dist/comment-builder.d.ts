import { LinearTicket } from './types';
/**
 * Builds a formatted comment with ticket details and review request
 */
export declare function buildComment(ticket: LinearTicket, assistantMention: string): string;
/**
 * Builds an error comment explaining what went wrong
 */
export declare function buildErrorComment(errorMessage: string): string;
