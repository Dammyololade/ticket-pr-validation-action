import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

/**
 * Headings to look for when extracting acceptance criteria
 */
const ACCEPTANCE_CRITERIA_HEADINGS = [
  'acceptance criteria',
  'ac',
  'requirements',
  'definition of done',
  'dod',
];

/**
 * Extracts acceptance criteria from markdown description
 * Looks for bullet/numbered lists under relevant headings
 * Falls back to entire description if no headings found
 */
export function extractAcceptanceCriteria(description: string | null): string {
  if (!description) {
    return '';
  }

  try {
    const tokens = md.parse(description, {});
    const criteria: string[] = [];
    let inCriteriaSection = false;
    let currentSection: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check if this is a heading
      if (token.type === 'heading_open') {
        // Process any accumulated content from previous section
        if (inCriteriaSection && currentSection.length > 0) {
          criteria.push(...currentSection);
          currentSection = [];
        }

        // Get the heading text
        const headingToken = tokens[i + 1];
        if (headingToken && headingToken.type === 'inline') {
          const headingText = headingToken.content.toLowerCase().trim();
          inCriteriaSection = ACCEPTANCE_CRITERIA_HEADINGS.some((acHeading) =>
            headingText.includes(acHeading)
          );
        } else {
          inCriteriaSection = false;
        }
      }

      // Collect list items when in criteria section
      if (inCriteriaSection) {
        if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
          // Start of a list
          continue;
        }

        if (token.type === 'list_item_open') {
          // Extract list item content
          let itemContent = '';
          let depth = 0;
          let j = i + 1;

          while (j < tokens.length) {
            const nextToken = tokens[j];

            if (nextToken.type === 'list_item_open') {
              depth++;
            }
            if (nextToken.type === 'list_item_close') {
              if (depth === 0) {
                break;
              }
              depth--;
            }

            if (nextToken.type === 'inline' && nextToken.content) {
              itemContent += nextToken.content + ' ';
            }

            j++;
          }

          if (itemContent.trim()) {
            currentSection.push(itemContent.trim());
          }
        }

        if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
          // End of list, but stay in criteria section
          continue;
        }
      }
    }

    // Add any remaining content from current section
    if (inCriteriaSection && currentSection.length > 0) {
      criteria.push(...currentSection);
    }

    // If we found criteria, return them
    if (criteria.length > 0) {
      return criteria.join('\n');
    }

    // Fallback: return entire description
    return description;
  } catch (error) {
    // If parsing fails, return entire description
    return description;
  }
}
