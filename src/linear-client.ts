import { LinearTicket, LinearLabel, LinearState } from './types';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

interface LinearGraphQLResponse {
  data?: {
    issue?: {
      identifier: string;
      title: string;
      description: string | null;
      labels: {
        nodes: Array<{
          name: string;
          color?: string;
        }>;
      };
      state: {
        name: string;
        type: string;
      };
      url: string;
    };
  };
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

/**
 * Fetches ticket details from Linear GraphQL API
 */
export async function fetchLinearTicket(apiKey: string, ticketId: string): Promise<LinearTicket> {
  // Linear API accepts identifier string (e.g., "ENDA-1555") as the id parameter
  const query = `
    query GetIssueDetails($issueIdentifier: String!) {
      issue(id: $issueIdentifier) {
        identifier
        title
        description
        url
        state {
          name
          type
        }
        labels {
          nodes {
            name
            color
          }
        }
      }
    }
  `;

  const variables = {
    issueIdentifier: ticketId,
  };

  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Linear API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LinearGraphQLResponse;

  if (data.errors && data.errors.length > 0) {
    const error = data.errors[0];
    if (error.extensions?.code === 'NOT_FOUND') {
      throw new Error(`Linear ticket not found: ${ticketId}`);
    }
    throw new Error(`Linear API error: ${error.message}`);
  }

  if (!data.data?.issue) {
    throw new Error(`Linear ticket not found: ${ticketId}`);
  }

  const issue = data.data.issue;

  const labels: LinearLabel[] = issue.labels.nodes.map((label) => ({
    name: label.name,
    color: label.color,
  }));

  const state: LinearState = {
    name: issue.state.name,
    type: issue.state.type,
  };

  return {
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    labels,
    state,
    url: issue.url,
  };
}
