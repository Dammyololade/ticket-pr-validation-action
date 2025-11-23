import { LinearTicket } from './types';
/**
 * Fetches ticket details from Linear GraphQL API
 */
export declare function fetchLinearTicket(apiKey: string, ticketId: string): Promise<LinearTicket>;
