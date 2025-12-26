/**
 * Skill Suggestion Engine
 *
 * Analyzes agent context (name, role, purpose) and suggests
 * relevant skills from the template library.
 */

import { SKILL_TEMPLATES, SkillTemplate, SkillCategory } from './templates';

export interface AgentContext {
  name?: string;
  role?: string;
  purpose?: string;
  tags?: string[];
  existingSkillNames?: string[];
}

export interface SuggestionResult {
  template: SkillTemplate;
  score: number;
  matchedKeywords: string[];
  reason: string;
}

/**
 * Suggest skills based on agent context.
 * Analyzes the agent's name, role, purpose, and tags to find matching skill templates.
 */
export function suggestSkills(
  context: AgentContext,
  options: {
    maxResults?: number;
    minScore?: number;
    excludeCategories?: SkillCategory[];
  } = {}
): SuggestionResult[] {
  const { maxResults = 6, minScore = 0.1, excludeCategories = [] } = options;

  // Build searchable text from context
  const contextText = [
    context.name || '',
    context.role || '',
    context.purpose || '',
    ...(context.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  if (!contextText.trim()) {
    return [];
  }

  // Extract words from context for matching
  const contextWords = extractWords(contextText);

  // Score each template
  const results: SuggestionResult[] = [];

  for (const template of SKILL_TEMPLATES) {
    // Skip if in excluded categories
    if (excludeCategories.includes(template.category)) {
      continue;
    }

    // Skip if already has this skill
    if (context.existingSkillNames?.some(
      (name) => name.toLowerCase() === template.name.toLowerCase()
    )) {
      continue;
    }

    const { score, matchedKeywords } = calculateScore(contextWords, template);

    if (score >= minScore) {
      results.push({
        template,
        score,
        matchedKeywords,
        reason: generateReason(matchedKeywords, template),
      });
    }
  }

  // Sort by score descending and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Get top skill suggestions for a specific category
 */
export function suggestSkillsForCategory(
  category: SkillCategory,
  context: AgentContext,
  maxResults = 3
): SuggestionResult[] {
  const contextText = [
    context.name || '',
    context.role || '',
    context.purpose || '',
    ...(context.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  const contextWords = extractWords(contextText);

  const categoryTemplates = SKILL_TEMPLATES.filter((t) => t.category === category);

  const results: SuggestionResult[] = categoryTemplates
    .filter((template) => !context.existingSkillNames?.some(
      (name) => name.toLowerCase() === template.name.toLowerCase()
    ))
    .map((template) => {
      const { score, matchedKeywords } = calculateScore(contextWords, template);
      return {
        template,
        score,
        matchedKeywords,
        reason: generateReason(matchedKeywords, template),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return results;
}

/**
 * Check if an agent would benefit from skill suggestions
 * (has enough context to make meaningful suggestions)
 */
export function hasEnoughContext(context: AgentContext): boolean {
  const text = [context.name, context.role, context.purpose].filter(Boolean).join(' ');
  return text.length >= 10; // At least some meaningful text
}

/**
 * Extract meaningful words from text
 */
function extractWords(text: string): string[] {
  // Common stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very',
    'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'any', 'this', 'that', 'these', 'those',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'whose',
    'agent', 'agents', 'role', 'purpose', 'help', 'helps', 'helping',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate match score between context and template
 */
function calculateScore(
  contextWords: string[],
  template: SkillTemplate
): { score: number; matchedKeywords: string[] } {
  const matchedKeywords: string[] = [];
  let score = 0;

  // Check keyword matches
  for (const keyword of template.keywords) {
    const keywordLower = keyword.toLowerCase();

    // Exact match
    if (contextWords.includes(keywordLower)) {
      matchedKeywords.push(keyword);
      score += 0.3;
      continue;
    }

    // Partial/fuzzy match
    for (const contextWord of contextWords) {
      if (keywordLower.includes(contextWord) || contextWord.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        score += 0.15;
        break;
      }
    }
  }

  // Check domain match
  const domainWords = extractWords(template.domain.toLowerCase());
  for (const domainWord of domainWords) {
    if (contextWords.includes(domainWord)) {
      score += 0.2;
    }
  }

  // Check name match
  const nameWords = extractWords(template.name.toLowerCase());
  for (const nameWord of nameWords) {
    if (contextWords.includes(nameWord)) {
      score += 0.25;
    }
  }

  // Check description match
  const descWords = extractWords(template.description.toLowerCase());
  let descMatches = 0;
  for (const descWord of descWords) {
    if (contextWords.includes(descWord)) {
      descMatches++;
    }
  }
  score += Math.min(descMatches * 0.1, 0.3);

  // Normalize score
  const normalizedScore = Math.min(score, 1);

  return {
    score: normalizedScore,
    matchedKeywords: [...new Set(matchedKeywords)],
  };
}

/**
 * Generate a human-readable reason for the suggestion
 */
function generateReason(matchedKeywords: string[], template: SkillTemplate): string {
  if (matchedKeywords.length === 0) {
    return `Common skill for ${template.category.replace('-', ' ')} agents`;
  }

  if (matchedKeywords.length === 1) {
    return `Matches "${matchedKeywords[0]}" in your agent description`;
  }

  if (matchedKeywords.length === 2) {
    return `Matches "${matchedKeywords[0]}" and "${matchedKeywords[1]}"`;
  }

  return `Matches ${matchedKeywords.length} keywords: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`;
}

/**
 * Get diverse suggestions covering different categories
 */
export function getDiverseSuggestions(
  context: AgentContext,
  maxResults = 6
): SuggestionResult[] {
  const allSuggestions = suggestSkills(context, { maxResults: 20, minScore: 0.05 });

  // Group by category
  const byCategory = new Map<SkillCategory, SuggestionResult[]>();
  for (const suggestion of allSuggestions) {
    const category = suggestion.template.category;
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(suggestion);
  }

  // Take top from each category until we have enough
  const results: SuggestionResult[] = [];
  const categories = [...byCategory.keys()];
  let index = 0;

  while (results.length < maxResults && categories.some((cat) => byCategory.get(cat)!.length > 0)) {
    const category = categories[index % categories.length];
    const categorySuggestions = byCategory.get(category)!;

    if (categorySuggestions.length > 0) {
      results.push(categorySuggestions.shift()!);
    }

    index++;
  }

  return results.sort((a, b) => b.score - a.score);
}
