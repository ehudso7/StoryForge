/**
 * Writing Excellence Engine - Draft Evaluator Service
 * U-WQES v2.0 (Universal Writing & Quality Enforcement Standard)
 *
 * Comprehensive content analysis system that scores writing on multiple dimensions
 * with zero tolerance for AI-detectable patterns.
 */

export interface EvaluationMetrics {
  // Core metrics
  glueWords: number; // Percentage of weak words (target: <40%)
  passiveVoice: number; // Percentage of passive constructions (target: <5%)
  dialogueBalance: number; // Percentage of dialogue (optimal: 30-50%)
  showVsTell: number; // Percentage of telling (target: <10%, INVERTED)
  wordRepetition: number; // Percentage of repeated words (target: <2%)

  // FCR metrics
  dynamicContent: number; // Action/conflict/tension (target: >70%)
  reflectiveContent: number; // Introspection/themes (target: ~30%)

  // AI detection
  aiPatterns: AIPattern[];
  aiPatternCount: number;

  // Coherence
  coherenceIssues: CoherenceIssue[];
  coherencePenalty: number;

  // Final score
  overallScore: number; // 0-100
  breakdown: ScoreBreakdown;
}

export interface AIPattern {
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
  examples: string[];
}

export interface CoherenceIssue {
  type: 'fragment' | 'repetitive' | 'nonsensical';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ScoreBreakdown {
  glueWordsScore: number;
  showVsTellScore: number;
  dynamicContentScore: number;
  dialogueBonus: number;
  aiPatternBonus: number;
  coherencePenalty: number;
}

// Comprehensive list of AI-detectable patterns (134 forbidden patterns)
const AI_PATTERNS = {
  // Academic/Business Jargon
  high: [
    'delve into', 'delving into', 'dive into', 'diving into',
    'robust', 'leveraging', 'paradigm shift', 'cutting-edge',
    'state-of-the-art', 'game-changer', 'synergy', 'holistic',
    'comprehensive', 'fundamental', 'essential', 'crucial',
    'pivotal', 'paramount', 'instrumental', 'integral',
    'multifaceted', 'nuanced', 'intricate', 'complex tapestry',
    'it is important to note', 'it should be noted that',
    'it is worth noting', 'interestingly', 'notably',
    'in conclusion', 'in summary', 'to summarize',
    'first and foremost', 'last but not least',
  ],

  // Overused AI transitions
  medium: [
    'moreover', 'furthermore', 'additionally', 'consequently',
    'nevertheless', 'nonetheless', 'subsequently', 'accordingly',
    'thus', 'hence', 'therefore', 'thereby', 'wherein',
    'in light of', 'with regard to', 'in terms of',
    'in the context of', 'in the realm of', 'in the landscape of',
    'serves as', 'serves to', 'acts as a', 'functions as',
    'plays a crucial role', 'plays a vital role',
  ],

  // Generic AI phrases
  low: [
    'at the end of the day', 'when all is said and done',
    'the fact of the matter', 'for all intents and purposes',
    'it goes without saying', 'needless to say',
    'as a matter of fact', 'in actual fact',
    'the bottom line', 'at this point in time',
  ],
};

// Glue words list (weak, filler words)
const GLUE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'can', 'that', 'which',
  'who', 'whom', 'this', 'these', 'those', 'it', 'its', "it's",
  'very', 'really', 'quite', 'rather', 'somewhat', 'just', 'even',
  'still', 'also', 'too', 'so', 'then', 'now', 'here', 'there',
]);

// Passive voice indicators
const PASSIVE_INDICATORS = [
  'was', 'were', 'been', 'being', 'is', 'are', 'am',
  'was able', 'were able', 'has been', 'have been', 'had been',
  'will be', 'would be', 'could be', 'should be', 'might be',
];

// "Telling" indicators (show don't tell violations)
const TELLING_INDICATORS = [
  'felt', 'thought', 'knew', 'realized', 'understood', 'believed',
  'wondered', 'imagined', 'remembered', 'forgot', 'decided',
  'seemed', 'appeared', 'looked like', 'sounded like',
  'was angry', 'was sad', 'was happy', 'was afraid', 'was nervous',
  'was excited', 'was worried', 'was confused', 'was surprised',
  'he felt', 'she felt', 'they felt', 'i felt',
  'he thought', 'she thought', 'they thought', 'i thought',
];

export class DraftEvaluator {
  /**
   * Evaluate a text draft and return comprehensive metrics
   */
  static evaluate(text: string): EvaluationMetrics {
    const words = this.tokenize(text);
    const sentences = this.splitSentences(text);
    const totalWords = words.length;

    // Calculate core metrics
    const glueWords = this.calculateGlueWords(words);
    const passiveVoice = this.calculatePassiveVoice(text, sentences);
    const dialogueBalance = this.calculateDialogueBalance(text);
    const showVsTell = this.calculateShowVsTell(text); // INVERTED - lower is better
    const wordRepetition = this.calculateWordRepetition(words);

    // FCR metrics
    const { dynamic, reflective } = this.calculateFCRMetrics(text);

    // AI pattern detection
    const aiPatterns = this.detectAIPatterns(text);

    // Coherence validation
    const coherenceIssues = this.validateCoherence(text, sentences);
    const coherencePenalty = this.calculateCoherencePenalty(coherenceIssues);

    // Calculate final score using v2.0 algorithm
    const breakdown = this.calculateScoreBreakdown({
      glueWords,
      showVsTell,
      dynamicContent: dynamic,
      dialogueBalance,
      aiPatternCount: aiPatterns.length,
      coherencePenalty,
    });

    const overallScore = Math.max(0, Math.min(100,
      breakdown.glueWordsScore +
      breakdown.showVsTellScore +
      breakdown.dynamicContentScore +
      breakdown.dialogueBonus +
      breakdown.aiPatternBonus -
      breakdown.coherencePenalty
    ));

    return {
      glueWords,
      passiveVoice,
      dialogueBalance,
      showVsTell,
      wordRepetition,
      dynamicContent: dynamic,
      reflectiveContent: reflective,
      aiPatterns,
      aiPatternCount: aiPatterns.length,
      coherenceIssues,
      coherencePenalty,
      overallScore: Math.round(overallScore * 10) / 10,
      breakdown,
    };
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private static splitSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private static calculateGlueWords(words: string[]): number {
    const glueCount = words.filter(word => GLUE_WORDS.has(word)).length;
    return (glueCount / words.length) * 100;
  }

  private static calculatePassiveVoice(text: string, sentences: string[]): number {
    const lowerText = text.toLowerCase();
    let passiveCount = 0;

    for (const indicator of PASSIVE_INDICATORS) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        passiveCount += matches.length;
      }
    }

    return (passiveCount / sentences.length) * 100;
  }

  private static calculateDialogueBalance(text: string): number {
    const dialogueMatches = text.match(/"[^"]+"/g) || [];
    const dialogueText = dialogueMatches.join(' ');
    const dialogueWords = dialogueText.split(/\s+/).filter(w => w.length > 0).length;
    const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;

    return (dialogueWords / totalWords) * 100;
  }

  private static calculateShowVsTell(text: string): number {
    // INVERTED: Lower percentage is better
    const lowerText = text.toLowerCase();
    let tellingCount = 0;
    const sentences = this.splitSentences(text);

    for (const indicator of TELLING_INDICATORS) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        tellingCount += matches.length;
      }
    }

    return (tellingCount / sentences.length) * 100;
  }

  private static calculateWordRepetition(words: string[]): number {
    const wordCount = new Map<string, number>();
    let repetitionScore = 0;

    // Count occurrences (excluding common words)
    for (const word of words) {
      if (word.length > 4 && !GLUE_WORDS.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    // Calculate repetition
    for (const count of wordCount.values()) {
      if (count > 2) {
        repetitionScore += count - 2;
      }
    }

    return (repetitionScore / words.length) * 100;
  }

  private static calculateFCRMetrics(text: string): { dynamic: number; reflective: number } {
    const sentences = this.splitSentences(text);
    let dynamicCount = 0;
    let reflectiveCount = 0;

    // Dynamic indicators: action verbs, short sentences, conflict words
    const dynamicWords = ['grabbed', 'ran', 'jumped', 'fired', 'struck', 'crashed', 'exploded',
      'charged', 'lunged', 'dove', 'slammed', 'burst', 'raced', 'fought', 'attacked'];

    // Reflective indicators: introspective verbs, longer sentences
    const reflectiveWords = ['pondered', 'considered', 'reflected', 'contemplated', 'mused',
      'wondered', 'thought', 'realized', 'understood', 'remembered'];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const wordCount = sentence.split(/\s+/).length;

      // Dynamic: short sentences + action words
      if (wordCount < 15 || dynamicWords.some(word => lowerSentence.includes(word))) {
        dynamicCount++;
      }

      // Reflective: longer sentences + introspective words
      if (wordCount > 20 || reflectiveWords.some(word => lowerSentence.includes(word))) {
        reflectiveCount++;
      }
    }

    const total = sentences.length;
    return {
      dynamic: (dynamicCount / total) * 100,
      reflective: (reflectiveCount / total) * 100,
    };
  }

  private static detectAIPatterns(text: string): AIPattern[] {
    const lowerText = text.toLowerCase();
    const patterns: AIPattern[] = [];

    // Check each severity level
    for (const [severity, patternList] of Object.entries(AI_PATTERNS)) {
      for (const pattern of patternList) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches && matches.length > 0) {
          // Find examples
          const examples: string[] = [];
          const sentences = this.splitSentences(text);

          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(pattern)) {
              examples.push(sentence.substring(0, 100));
              if (examples.length >= 2) break;
            }
          }

          patterns.push({
            pattern,
            severity: severity as 'low' | 'medium' | 'high',
            count: matches.length,
            examples,
          });
        }
      }
    }

    return patterns;
  }

  private static validateCoherence(text: string, sentences: string[]): CoherenceIssue[] {
    const issues: CoherenceIssue[] = [];

    // Check for fragments (< 5 words per sentence)
    const fragmentCount = sentences.filter(s => s.split(/\s+/).length < 5).length;
    if (fragmentCount > sentences.length * 0.3) {
      issues.push({
        type: 'fragment',
        severity: 'high',
        description: `Too many sentence fragments detected (${fragmentCount}/${sentences.length})`,
      });
    }

    // Check for repetitive patterns (same sentence structure repeated)
    const patterns = new Map<string, number>();
    for (const sentence of sentences) {
      const structure = sentence.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      patterns.set(structure, (patterns.get(structure) || 0) + 1);
    }

    for (const [pattern, count] of patterns.entries()) {
      if (count > 3) {
        issues.push({
          type: 'repetitive',
          severity: 'medium',
          description: `Repetitive sentence structure: "${pattern}..." (${count} times)`,
        });
      }
    }

    // Check for nonsensical combinations (random words without meaning)
    const words = this.tokenize(text);
    const uniqueRatio = new Set(words).size / words.length;
    if (uniqueRatio > 0.8 && words.length > 50) {
      issues.push({
        type: 'nonsensical',
        severity: 'high',
        description: 'Text appears to contain random or nonsensical word combinations',
      });
    }

    return issues;
  }

  private static calculateCoherencePenalty(issues: CoherenceIssue[]): number {
    let penalty = 0;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          penalty += 20;
          break;
        case 'medium':
          penalty += 10;
          break;
        case 'low':
          penalty += 5;
          break;
      }
    }

    return Math.min(penalty, 40); // Cap at 40 points
  }

  /**
   * Calculate score breakdown using v2.0 algorithm
   * Score = (100 - GlueWords%) × 0.15 + (100 - ShowVsTell%) × 0.25 + DynamicContent% × 0.25
   *         + DialogueBonus (0 or 15) + AIPatternBonus (0 or 20) - CoherencePenalty
   */
  private static calculateScoreBreakdown(params: {
    glueWords: number;
    showVsTell: number;
    dynamicContent: number;
    dialogueBalance: number;
    aiPatternCount: number;
    coherencePenalty: number;
  }): ScoreBreakdown {
    const glueWordsScore = (100 - params.glueWords) * 0.15;
    const showVsTellScore = (100 - params.showVsTell) * 0.25; // INVERTED
    const dynamicContentScore = params.dynamicContent * 0.25;

    // Dialogue bonus: 15 points if in optimal range (30-50%)
    const dialogueBonus = (params.dialogueBalance >= 30 && params.dialogueBalance <= 50) ? 15 : 0;

    // AI pattern bonus: 20 points if zero patterns detected
    const aiPatternBonus = params.aiPatternCount === 0 ? 20 : 0;

    return {
      glueWordsScore: Math.round(glueWordsScore * 10) / 10,
      showVsTellScore: Math.round(showVsTellScore * 10) / 10,
      dynamicContentScore: Math.round(dynamicContentScore * 10) / 10,
      dialogueBonus,
      aiPatternBonus,
      coherencePenalty: params.coherencePenalty,
    };
  }

  /**
   * Generate improvement suggestions based on evaluation
   */
  static generateSuggestions(metrics: EvaluationMetrics): string[] {
    const suggestions: string[] = [];

    if (metrics.glueWords > 40) {
      suggestions.push(`Reduce glue words (currently ${metrics.glueWords.toFixed(1)}%, target: <40%)`);
    }

    if (metrics.passiveVoice > 5) {
      suggestions.push(`Reduce passive voice (currently ${metrics.passiveVoice.toFixed(1)}%, target: <5%)`);
    }

    if (metrics.dialogueBalance < 30 || metrics.dialogueBalance > 50) {
      suggestions.push(`Adjust dialogue balance (currently ${metrics.dialogueBalance.toFixed(1)}%, optimal: 30-50%)`);
    }

    if (metrics.showVsTell > 10) {
      suggestions.push(`Show more, tell less (currently ${metrics.showVsTell.toFixed(1)}% telling, target: <10%)`);
    }

    if (metrics.dynamicContent < 70) {
      suggestions.push(`Increase dynamic content (currently ${metrics.dynamicContent.toFixed(1)}%, target: >70%)`);
    }

    if (metrics.aiPatternCount > 0) {
      suggestions.push(`Remove ${metrics.aiPatternCount} AI-detectable pattern(s)`);
    }

    if (metrics.coherenceIssues.length > 0) {
      suggestions.push(`Address ${metrics.coherenceIssues.length} coherence issue(s)`);
    }

    if (metrics.overallScore >= 90) {
      suggestions.push('✓ Excellent! Meets publication standards.');
    } else if (metrics.overallScore >= 80) {
      suggestions.push('Good progress! Minor improvements needed.');
    } else {
      suggestions.push('Significant improvements required to meet 90%+ standard.');
    }

    return suggestions;
  }
}
