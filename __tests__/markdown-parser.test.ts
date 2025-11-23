import { extractAcceptanceCriteria } from '../src/markdown-parser';

describe('markdown-parser', () => {
  describe('extractAcceptanceCriteria', () => {
    it('should extract acceptance criteria from heading', () => {
      const description = `
# Feature Description

Some description here.

## Acceptance Criteria

- Criterion 1
- Criterion 2
- Criterion 3

## Other Section

Some other content.
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('Criterion 1');
      expect(result).toContain('Criterion 2');
      expect(result).toContain('Criterion 3');
    });

    it('should work with case-insensitive headings', () => {
      const description = `
## acceptance criteria

- Item 1
- Item 2
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should work with "AC" heading', () => {
      const description = `
## AC

- Criterion A
- Criterion B
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('Criterion A');
      expect(result).toContain('Criterion B');
    });

    it('should work with "Requirements" heading', () => {
      const description = `
## Requirements

- Req 1
- Req 2
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('Req 1');
      expect(result).toContain('Req 2');
    });

    it('should combine multiple matching sections', () => {
      const description = `
## Acceptance Criteria

- AC 1
- AC 2

## Requirements

- Req 1
- Req 2
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('AC 1');
      expect(result).toContain('AC 2');
      expect(result).toContain('Req 1');
      expect(result).toContain('Req 2');
    });

    it('should include nested lists', () => {
      const description = `
## Acceptance Criteria

- Main item 1
  - Sub item 1.1
  - Sub item 1.2
- Main item 2
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('Main item 1');
      expect(result).toContain('Sub item 1.1');
      expect(result).toContain('Sub item 1.2');
      expect(result).toContain('Main item 2');
    });

    it('should work with numbered lists', () => {
      const description = `
## Acceptance Criteria

1. First criterion
2. Second criterion
3. Third criterion
`;

      const result = extractAcceptanceCriteria(description);
      expect(result).toContain('First criterion');
      expect(result).toContain('Second criterion');
      expect(result).toContain('Third criterion');
    });

    it('should fallback to entire description if no headings found', () => {
      const description = `
This is a description without any specific headings.

- Some bullet point
- Another bullet point
`;

      const result = extractAcceptanceCriteria(description);
      // The parser may process markdown, so check that it contains the original content
      expect(result).toContain('This is a description without any specific headings');
      expect(result).toContain('Some bullet point');
      expect(result).toContain('Another bullet point');
    });

    it('should handle null description', () => {
      expect(extractAcceptanceCriteria(null)).toBe('');
    });

    it('should handle empty description', () => {
      expect(extractAcceptanceCriteria('')).toBe('');
    });

    it('should handle malformed markdown gracefully', () => {
      const malformed = 'This is not valid markdown [[[';
      const result = extractAcceptanceCriteria(malformed);
      expect(result).toBe(malformed);
    });
  });
});
