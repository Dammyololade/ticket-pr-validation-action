import { buildComment, buildErrorComment } from '../src/comment-builder';
import { LinearTicket } from '../src/types';

describe('comment-builder', () => {
  describe('buildComment', () => {
    it('should build comment with ticket details', () => {
      const ticket: LinearTicket = {
        identifier: 'PROJ-123',
        title: 'Test Ticket',
        description: 'Test description',
        labels: [
          { name: 'bug', color: '#ff0000' },
          { name: 'priority', color: '#00ff00' },
        ],
        state: { name: 'In Progress', type: 'started' },
        url: 'https://linear.app/proj/PROJ-123',
      };

      const comment = buildComment(ticket, '@gemini-code-assist');

      expect(comment).toContain('@gemini-code-assist');
      expect(comment).toContain('PROJ-123');
      expect(comment).toContain('Test Ticket');
      expect(comment).toContain('https://linear.app/proj/PROJ-123');
      expect(comment).toContain('Test description');
      expect(comment).toContain('table');
      expect(comment).toContain('Criterion');
      expect(comment).toContain('Status');
      expect(comment).toContain('Notes');
    });

    it('should handle ticket without description', () => {
      const ticket: LinearTicket = {
        identifier: 'PROJ-456',
        title: 'No Description Ticket',
        description: null,
        labels: [],
        state: { name: 'Todo', type: 'unstarted' },
      };

      const comment = buildComment(ticket, '@assistant');

      expect(comment).toContain('PROJ-456');
      expect(comment).toContain('No Description Ticket');
      expect(comment).toContain('No description provided');
    });

    it('should handle ticket without labels', () => {
      const ticket: LinearTicket = {
        identifier: 'PROJ-789',
        title: 'No Labels Ticket',
        description: 'Description',
        labels: [],
        state: { name: 'Done', type: 'completed' },
      };

      const comment = buildComment(ticket, '@custom-assistant');

      expect(comment).toContain('PROJ-789');
      expect(comment).toContain('No Labels Ticket');
      expect(comment).toContain('@custom-assistant');
      expect(comment).toContain('Description');
    });

    it('should handle ticket without URL', () => {
      const ticket: LinearTicket = {
        identifier: 'PROJ-999',
        title: 'No URL Ticket',
        description: 'Description',
        labels: [],
        state: { name: 'Todo', type: 'unstarted' },
      };

      const comment = buildComment(ticket, '@assistant');
      expect(comment).not.toContain('**Link:**');
    });

    it('should include acceptance criteria section', () => {
      const ticket: LinearTicket = {
        identifier: 'PROJ-111',
        title: 'Ticket with AC',
        description: '## Acceptance Criteria\n\n- AC 1\n- AC 2',
        labels: [],
        state: { name: 'Todo', type: 'unstarted' },
      };

      const comment = buildComment(ticket, '@assistant');
      expect(comment).toContain('### Acceptance Criteria');
      expect(comment).toContain('AC 1');
      expect(comment).toContain('AC 2');
    });
  });

  describe('buildErrorComment', () => {
    it('should build error comment with message', () => {
      const errorMessage = 'Linear ticket not found: PROJ-123';
      const comment = buildErrorComment(errorMessage);

      expect(comment).toContain('⚠️');
      expect(comment).toContain('Ticket Validation Error');
      expect(comment).toContain(errorMessage);
      expect(comment).toContain('Linear API key');
      expect(comment).toContain('ticket exists');
    });
  });
});
