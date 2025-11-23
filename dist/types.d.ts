export interface LinearLabel {
    name: string;
    color?: string;
}
export interface LinearState {
    name: string;
    type: string;
}
export interface LinearTicket {
    identifier: string;
    title: string;
    description: string | null;
    labels: LinearLabel[];
    state: LinearState;
    url?: string;
}
export interface ActionInputs {
    linearApiKey: string;
    githubToken: string;
    ticketId?: string;
    branchPattern: string;
    prNumber?: number;
    assistantMention: string;
    dryRun: boolean;
}
export interface ActionOutputs {
    ticketId: string;
    commentUrl: string;
    success: boolean;
}
