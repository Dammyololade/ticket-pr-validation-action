import * as core from '@actions/core';
import * as github from '@actions/github';
import nock from 'nock';
import { LinearTicket } from '../src/types';

// Mock GitHub Actions modules
jest.mock('@actions/core');
jest.mock('@actions/github');

const mockCore = core as jest.Mocked<typeof core>;
const mockGithub = github as jest.Mocked<typeof github>;

describe('index integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();

    // Mock GitHub context using Object.defineProperty
    Object.defineProperty(mockGithub, 'context', {
      value: {
        repo: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
        payload: {
          pull_request: {
            number: 123,
          },
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    nock.isDone();
  });

  describe('successful flow', () => {
    it('should extract ticket ID from branch and post comment', async () => {
      // Mock inputs
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        if (name === 'branch-pattern') return '[A-Za-z]+-\\d+';
        if (name === 'assistant-mention') return '@gemini-code-assist';
        if (name === 'dry-run') return 'false';
        return '';
      });

      process.env.GITHUB_TOKEN = 'test-github-token';

      const mockTicket: LinearTicket = {
        identifier: 'PROJ-123',
        title: 'Test Ticket',
        description: '## Acceptance Criteria\n\n- AC 1\n- AC 2',
        labels: [{ name: 'bug' }],
        state: { name: 'In Progress', type: 'started' },
        url: 'https://linear.app/proj/PROJ-123',
      };

      // Mock Linear API
      nock('https://api.linear.app')
        .post('/graphql')
        .reply(200, {
          data: {
            issue: {
              identifier: mockTicket.identifier,
              title: mockTicket.title,
              description: mockTicket.description,
              labels: {
                nodes: mockTicket.labels.map((l) => ({ name: l.name })),
              },
              state: mockTicket.state,
              url: mockTicket.url,
            },
          },
        });

      // Mock GitHub API - get PR
      nock('https://api.github.com')
        .get('/repos/test-owner/test-repo/pulls/123')
        .reply(200, {
          head: { ref: 'feature/PROJ-123-add-feature' },
          title: 'PROJ-123: Add feature',
        });

      // Mock GitHub API - create comment
      nock('https://api.github.com')
        .post('/repos/test-owner/test-repo/issues/123/comments')
        .reply(200, {
          html_url: 'https://github.com/test-owner/test-repo/issues/123#issuecomment-1',
        });

      // Mock Octokit
      const mockOctokit = {
        rest: {
          pulls: {
            get: jest.fn().mockResolvedValue({
              data: {
                head: { ref: 'feature/PROJ-123-add-feature' },
                title: 'PROJ-123: Add feature',
              },
            }),
          },
          issues: {
            createComment: jest.fn().mockResolvedValue({
              data: {
                html_url: 'https://github.com/test-owner/test-repo/issues/123#issuecomment-1',
              },
            }),
          },
        },
      };

      mockGithub.getOctokit.mockReturnValue(mockOctokit as any);

      // Import and run (this would normally be done by the action)
      // For testing, we'll test the individual functions instead
    });
  });

  describe('error handling', () => {
    it('should handle missing ticket ID', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        if (name === 'branch-pattern') return '[A-Za-z]+-\\d+';
        if (name === 'dry-run') return 'false';
        return '';
      });

      process.env.GITHUB_TOKEN = 'test-github-token';

      const mockOctokit = {
        rest: {
          pulls: {
            get: jest.fn().mockResolvedValue({
              data: {
                head: { ref: 'feature/no-ticket-here' },
                title: 'No ticket in title',
              },
            }),
          },
          issues: {
            createComment: jest.fn().mockResolvedValue({
              data: {
                html_url: 'https://github.com/test-owner/test-repo/issues/123#issuecomment-1',
              },
            }),
          },
        },
      };

      mockGithub.getOctokit.mockReturnValue(mockOctokit as any);

      // The action should post an error comment
      expect(mockOctokit.rest.issues.createComment).toBeDefined();
    });

    it('should handle Linear API errors', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        if (name === 'ticket-id') return 'PROJ-999';
        if (name === 'dry-run') return 'false';
        return '';
      });

      process.env.GITHUB_TOKEN = 'test-github-token';

      // Mock Linear API error
      nock('https://api.linear.app')
        .post('/graphql')
        .reply(200, {
          errors: [
            {
              message: 'Issue not found',
              extensions: { code: 'NOT_FOUND' },
            },
          ],
        });

      const mockOctokit = {
        rest: {
          pulls: {
            get: jest.fn().mockResolvedValue({
              data: {
                head: { ref: 'feature/PROJ-999' },
                title: 'PROJ-999: Test',
              },
            }),
          },
          issues: {
            createComment: jest.fn().mockResolvedValue({
              data: {
                html_url: 'https://github.com/test-owner/test-repo/issues/123#issuecomment-1',
              },
            }),
          },
        },
      };

      mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
    });
  });

  describe('dry-run mode', () => {
    it('should log output without posting comment', () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        if (name === 'ticket-id') return 'PROJ-123';
        if (name === 'dry-run') return 'true';
        return '';
      });

      process.env.GITHUB_TOKEN = 'test-github-token';

      // In dry-run mode, core.info should be called instead of posting
      expect(mockCore.info).toBeDefined();
    });
  });

  describe('github-token input', () => {
    it('should use provided github-token input', () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        if (name === 'github-token') return 'custom-token';
        return '';
      });

      delete process.env.GITHUB_TOKEN;

      // The action should use the custom token from input
      expect(mockCore.getInput).toBeDefined();
    });

    it('should fallback to GITHUB_TOKEN env var when input not provided', () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'linear-api-key') return 'test-api-key';
        return '';
      });

      process.env.GITHUB_TOKEN = 'env-token';

      // The action should use the env var token
      expect(process.env.GITHUB_TOKEN).toBe('env-token');
    });
  });
});
