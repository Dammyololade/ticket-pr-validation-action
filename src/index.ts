import * as core from '@actions/core';
import * as github from '@actions/github';
import { ActionInputs, ActionOutputs } from './types';
import { extractTicketIdFromBranch, extractTicketIdFromTitle } from './ticket-detector';
import { fetchLinearTicket } from './linear-client';
import { buildComment, buildErrorComment } from './comment-builder';

/**
 * Parses action inputs
 */
function parseInputs(): ActionInputs {
  // Fallback to process.env when core.getInput doesn't work (e.g., local testing or certain environments)
  const linearApiKey =
    core.getInput('linear-api-key', { required: false }) ||
    process.env.INPUT_LINEAR_API_KEY ||
    (() => {
      throw new Error('linear-api-key is required');
    })();
  const githubToken =
    core.getInput('github-token', { required: false }) ||
    process.env.INPUT_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    '';

  if (!githubToken) {
    throw new Error(
      'GitHub token is required. Provide github-token input or set GITHUB_TOKEN environment variable.'
    );
  }

  // Fallback to process.env when core.getInput doesn't work
  const ticketId =
    core.getInput('ticket-id', { required: false }) || process.env.INPUT_TICKET_ID || undefined;
  const branchPattern =
    core.getInput('branch-pattern', { required: false }) ||
    process.env.INPUT_BRANCH_PATTERN ||
    '[A-Za-z]+-\\d+';
  const prNumberInput =
    core.getInput('pr-number', { required: false }) || process.env.INPUT_PR_NUMBER || '';
  const prNumber = prNumberInput ? parseInt(prNumberInput, 10) : undefined;
  const assistantMention =
    core.getInput('assistant-mention', { required: false }) ||
    process.env.INPUT_ASSISTANT_MENTION ||
    '@gemini-code-assist';
  const dryRunInput =
    core.getInput('dry-run', { required: false }) || process.env.INPUT_DRY_RUN || 'false';
  const dryRun = dryRunInput === 'true';

  return {
    linearApiKey,
    githubToken,
    ticketId,
    branchPattern,
    prNumber,
    assistantMention,
    dryRun,
  };
}

/**
 * Determines PR number from context or input
 */
function getPrNumber(inputs: ActionInputs): number {
  if (inputs.prNumber) {
    return inputs.prNumber;
  }

  const prNumber = github.context.payload.pull_request?.number;
  if (!prNumber) {
    throw new Error(
      'PR number not found. Provide pr-number input or run this action on a pull_request event.'
    );
  }

  return prNumber;
}

/**
 * Determines ticket ID from various sources
 */
function getTicketId(inputs: ActionInputs, prBranch: string, prTitle: string): string {
  // 1. Explicit input
  if (inputs.ticketId) {
    return inputs.ticketId;
  }

  // 2. Extract from branch name
  const branchTicketId = extractTicketIdFromBranch(prBranch, inputs.branchPattern);
  if (branchTicketId) {
    return branchTicketId;
  }

  // 3. Extract from PR title
  const titleTicketId = extractTicketIdFromTitle(prTitle, inputs.branchPattern);
  if (titleTicketId) {
    return titleTicketId;
  }

  throw new Error(
    `Could not extract ticket ID from branch "${prBranch}" or PR title "${prTitle}" using pattern "${inputs.branchPattern}"`
  );
}

/**
 * Sets action outputs
 */
function setOutputs(outputs: ActionOutputs): void {
  core.setOutput('ticket-id', outputs.ticketId);
  core.setOutput('comment-url', outputs.commentUrl);
  core.setOutput('success', outputs.success.toString());
}

/**
 * Main action execution
 */
async function run(): Promise<void> {
  try {
    const inputs = parseInputs();
    const octokit = github.getOctokit(inputs.githubToken);

    // Get PR number
    const prNumber = getPrNumber(inputs);

    // Get PR details
    const { data: pr } = await octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    const prBranch = pr.head.ref;
    const prTitle = pr.title;

    // Get ticket ID
    let ticketId: string;
    try {
      ticketId = getTicketId(inputs, prBranch, prTitle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorComment = buildErrorComment(errorMessage);

      if (inputs.dryRun) {
        core.info('DRY RUN - Would post error comment:');
        core.info(errorComment);
        setOutputs({
          ticketId: '',
          commentUrl: 'dry-run',
          success: false,
        });
        return;
      }

      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        body: errorComment,
      });

      setOutputs({
        ticketId: '',
        commentUrl: '',
        success: false,
      });
      return;
    }

    // Fetch Linear ticket
    let ticket;
    try {
      ticket = await fetchLinearTicket(inputs.linearApiKey, ticketId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorComment = buildErrorComment(
        `Failed to fetch Linear ticket ${ticketId}: ${errorMessage}`
      );

      if (inputs.dryRun) {
        core.info('DRY RUN - Would post error comment:');
        core.info(errorComment);
        setOutputs({
          ticketId,
          commentUrl: 'dry-run',
          success: false,
        });
        return;
      }

      const { data: comment } = await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        body: errorComment,
      });

      setOutputs({
        ticketId,
        commentUrl: comment.html_url,
        success: false,
      });
      return;
    }

    // Build comment
    const comment = buildComment(ticket, inputs.assistantMention);

    if (inputs.dryRun) {
      core.info('DRY RUN - Would post comment:');
      core.info(comment);
      setOutputs({
        ticketId,
        commentUrl: 'dry-run',
        success: true,
      });
      return;
    }

    // Post comment
    const { data: postedComment } = await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      body: comment,
    });

    core.info(`Posted comment: ${postedComment.html_url}`);

    setOutputs({
      ticketId,
      commentUrl: postedComment.html_url,
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
    setOutputs({
      ticketId: '',
      commentUrl: '',
      success: false,
    });
  }
}

// Run the action
run();
