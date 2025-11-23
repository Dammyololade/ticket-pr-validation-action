import { extractTicketIdFromBranch, extractTicketIdFromTitle } from '../src/ticket-detector';

describe('ticket-detector', () => {
  describe('extractTicketIdFromBranch', () => {
    it('should extract ticket ID from branch name with default pattern', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromBranch('feature/PROJ-123-add-feature', pattern)).toBe('PROJ-123');
      expect(extractTicketIdFromBranch('bugfix/ABC-456-fix-bug', pattern)).toBe('ABC-456');
      expect(extractTicketIdFromBranch('PROJ-789', pattern)).toBe('PROJ-789');
    });

    it('should be case-insensitive', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromBranch('feature/proj-123-add-feature', pattern)).toBe('proj-123');
      expect(extractTicketIdFromBranch('bugfix/abc-456-fix-bug', pattern)).toBe('abc-456');
    });

    it('should return null if no match found', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromBranch('feature/no-ticket-here', pattern)).toBeNull();
      expect(extractTicketIdFromBranch('main', pattern)).toBeNull();
    });

    it('should work with custom patterns', () => {
      const pattern = 'TICKET-[0-9]+';
      expect(extractTicketIdFromBranch('feature/TICKET-123', pattern)).toBe('TICKET-123');
      expect(extractTicketIdFromBranch('feature/PROJ-123', pattern)).toBeNull();
    });

    it('should return null for invalid regex pattern', () => {
      const invalidPattern = '[invalid';
      expect(extractTicketIdFromBranch('feature/PROJ-123', invalidPattern)).toBeNull();
    });
  });

  describe('extractTicketIdFromTitle', () => {
    it('should extract ticket ID from PR title', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromTitle('PROJ-123: Add new feature', pattern)).toBe('PROJ-123');
      expect(extractTicketIdFromTitle('[ABC-456] Fix bug', pattern)).toBe('ABC-456');
      expect(extractTicketIdFromTitle('Fix issue PROJ-789', pattern)).toBe('PROJ-789');
    });

    it('should be case-insensitive', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromTitle('proj-123: Add feature', pattern)).toBe('proj-123');
    });

    it('should return null if no match found', () => {
      const pattern = '[A-Za-z]+-[0-9]+';
      expect(extractTicketIdFromTitle('Add new feature', pattern)).toBeNull();
      expect(extractTicketIdFromTitle('No ticket here', pattern)).toBeNull();
    });
  });
});
