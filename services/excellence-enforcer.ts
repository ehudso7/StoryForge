/**
 * Excellence Enforcer - Multi-Strategy Improvement System
 *
 * Applies targeted improvement strategies to draft text using OpenAI.
 * Each strategy targets specific metric weaknesses identified by the Draft Evaluator.
 *
 * Strategies:
 * 1. Dialogue Fixer - Adds natural speech patterns and conversational flow
 * 2. Show vs Tell Converter - Transforms telling into showing through action
 * 3. AI Pattern Eliminator - Removes all forbidden AI language patterns
 * 4. Metric Enforcer - Targets specific numerical metric weaknesses
 * 5. Sentence Variation - Improves rhythm and sentence structure diversity
 * 6. Sensory Enhancement - Adds concrete, visceral sensory details
 */

import { improveText, OpenAIResponse } from './openai-service';
import { DraftEvaluator, EvaluationMetrics } from './draft-evaluator';

export interface ImprovementStrategy {
  name: string;
  description: string;
  targetMetrics: string[]; // Which metrics this strategy improves
  priority: number; // 1-10, higher = more important
}

export interface ImprovementResult {
  strategy: string;
  originalText: string;
  improvedText: string;
  originalMetrics: EvaluationMetrics;
  improvedMetrics: EvaluationMetrics;
  improvement: MetricImprovement;
  success: boolean;
  error?: string;
}

export interface MetricImprovement {
  overallScoreDelta: number;
  glueWordsDelta: number;
  showVsTellDelta: number;
  dynamicContentDelta: number;
  dialogueBalanceDelta: number;
  aiPatternsDelta: number;
}

/**
 * Available improvement strategies with priorities
 */
const STRATEGIES: Record<string, ImprovementStrategy> = {
  ai_pattern_eliminator: {
    name: 'AI Pattern Eliminator',
    description: 'Removes all AI-detectable language patterns',
    targetMetrics: ['aiPatternCount'],
    priority: 10, // HIGHEST - must eliminate AI patterns
  },

  show_vs_tell_converter: {
    name: 'Show vs Tell Converter',
    description: 'Converts telling to showing through action and behavior',
    targetMetrics: ['showVsTell'],
    priority: 9,
  },

  dialogue_fixer: {
    name: 'Dialogue Fixer',
    description: 'Adds natural dialogue and conversational flow',
    targetMetrics: ['dialogueBalance'],
    priority: 8,
  },

  glue_word_reducer: {
    name: 'Glue Word Reducer',
    description: 'Eliminates weak filler words and strengthens prose',
    targetMetrics: ['glueWords'],
    priority: 7,
  },

  dynamic_content_booster: {
    name: 'Dynamic Content Booster',
    description: 'Increases action, conflict, and tension',
    targetMetrics: ['dynamicContent'],
    priority: 7,
  },

  passive_voice_eliminator: {
    name: 'Passive Voice Eliminator',
    description: 'Converts passive constructions to active voice',
    targetMetrics: ['passiveVoice'],
    priority: 6,
  },

  sentence_variation_enhancer: {
    name: 'Sentence Variation Enhancer',
    description: 'Improves sentence rhythm and structural diversity',
    targetMetrics: ['wordRepetition', 'overallScore'],
    priority: 5,
  },

  sensory_detail_enhancer: {
    name: 'Sensory Detail Enhancer',
    description: 'Adds concrete sensory details and specific nouns',
    targetMetrics: ['dynamicContent', 'showVsTell'],
    priority: 5,
  },
};

export class ExcellenceEnforcer {
  /**
   * Analyze metrics and determine which strategies to apply
   */
  static determineStrategies(metrics: EvaluationMetrics): ImprovementStrategy[] {
    const needed: ImprovementStrategy[] = [];

    // AI Patterns - ALWAYS eliminate if present
    if (metrics.aiPatternCount > 0) {
      needed.push(STRATEGIES.ai_pattern_eliminator);
    }

    // Show vs Tell - critical if > 10%
    if (metrics.showVsTell > 10) {
      needed.push(STRATEGIES.show_vs_tell_converter);
    }

    // Dialogue Balance - critical if outside 30-50% range
    if (metrics.dialogueBalance < 30 || metrics.dialogueBalance > 50) {
      needed.push(STRATEGIES.dialogue_fixer);
    }

    // Glue Words - critical if > 40%
    if (metrics.glueWords > 40) {
      needed.push(STRATEGIES.glue_word_reducer);
    }

    // Dynamic Content - critical if < 70%
    if (metrics.dynamicContent < 70) {
      needed.push(STRATEGIES.dynamic_content_booster);
    }

    // Passive Voice - important if > 5%
    if (metrics.passiveVoice > 5) {
      needed.push(STRATEGIES.passive_voice_eliminator);
    }

    // Always apply sentence variation if score < 90
    if (metrics.overallScore < 90) {
      needed.push(STRATEGIES.sentence_variation_enhancer);
    }

    // Add sensory details if dynamic content or show vs tell need work
    if (metrics.dynamicContent < 75 || metrics.showVsTell > 8) {
      needed.push(STRATEGIES.sensory_detail_enhancer);
    }

    // Sort by priority (highest first)
    return needed.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply a single improvement strategy to text
   */
  static async applyStrategy(
    text: string,
    strategy: ImprovementStrategy,
    genre: string
  ): Promise<ImprovementResult> {
    const originalMetrics = DraftEvaluator.evaluate(text);

    try {
      // Map strategy to OpenAI service weakness parameter
      const weaknessMap: Record<string, string> = {
        'AI Pattern Eliminator': 'ai_patterns',
        'Show vs Tell Converter': 'show_vs_tell',
        'Dialogue Fixer': 'dialogue_balance',
        'Glue Word Reducer': 'glue_words',
        'Dynamic Content Booster': 'dynamic_content',
        'Passive Voice Eliminator': 'passive_voice',
        'Sentence Variation Enhancer': 'sentence_variation',
        'Sensory Detail Enhancer': 'sensory_details',
      };

      const weakness = weaknessMap[strategy.name];
      const targetMetric = this.getTargetMetricDescription(strategy.targetMetrics[0], originalMetrics);

      // Call OpenAI to improve text
      const response: OpenAIResponse = await improveText({
        text,
        weakness,
        targetMetric,
        genre,
      });

      const improvedText = response.text;
      const improvedMetrics = DraftEvaluator.evaluate(improvedText);

      // Calculate improvement deltas
      const improvement: MetricImprovement = {
        overallScoreDelta: improvedMetrics.overallScore - originalMetrics.overallScore,
        glueWordsDelta: originalMetrics.glueWords - improvedMetrics.glueWords,
        showVsTellDelta: originalMetrics.showVsTell - improvedMetrics.showVsTell,
        dynamicContentDelta: improvedMetrics.dynamicContent - originalMetrics.dynamicContent,
        dialogueBalanceDelta: Math.abs(improvedMetrics.dialogueBalance - 40) - Math.abs(originalMetrics.dialogueBalance - 40), // Closer to optimal 40%
        aiPatternsDelta: originalMetrics.aiPatternCount - improvedMetrics.aiPatternCount,
      };

      return {
        strategy: strategy.name,
        originalText: text,
        improvedText,
        originalMetrics,
        improvedMetrics,
        improvement,
        success: true,
      };
    } catch (error) {
      return {
        strategy: strategy.name,
        originalText: text,
        improvedText: text, // Return original on error
        originalMetrics,
        improvedMetrics: originalMetrics,
        improvement: {
          overallScoreDelta: 0,
          glueWordsDelta: 0,
          showVsTellDelta: 0,
          dynamicContentDelta: 0,
          dialogueBalanceDelta: 0,
          aiPatternsDelta: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply multiple strategies in sequence, keeping best results
   */
  static async enforceExcellence(
    text: string,
    genre: string,
    maxStrategies = 3
  ): Promise<{
    finalText: string;
    strategies: ImprovementResult[];
    totalImprovement: number;
  }> {
    const initialMetrics = DraftEvaluator.evaluate(text);
    const strategiesToApply = this.determineStrategies(initialMetrics).slice(0, maxStrategies);

    let currentText = text;
    const results: ImprovementResult[] = [];
    let totalImprovement = 0;

    for (const strategy of strategiesToApply) {
      console.log(`Applying strategy: ${strategy.name}...`);

      const result = await this.applyStrategy(currentText, strategy, genre);
      results.push(result);

      // Keep improvement if score increased (or stayed same with metric improvement)
      if (result.success && result.improvement.overallScoreDelta >= 0) {
        currentText = result.improvedText;
        totalImprovement += result.improvement.overallScoreDelta;
        console.log(`✓ ${strategy.name}: +${result.improvement.overallScoreDelta.toFixed(1)} points`);
      } else {
        console.log(`✗ ${strategy.name}: No improvement or failed`);
      }

      // Stop if we've reached target (90%+)
      const currentMetrics = DraftEvaluator.evaluate(currentText);
      if (currentMetrics.overallScore >= 90) {
        console.log(`✓ Target score reached: ${currentMetrics.overallScore.toFixed(1)}%`);
        break;
      }
    }

    return {
      finalText: currentText,
      strategies: results,
      totalImprovement,
    };
  }

  /**
   * Apply single most critical strategy
   */
  static async applyMostCritical(
    text: string,
    genre: string
  ): Promise<ImprovementResult> {
    const metrics = DraftEvaluator.evaluate(text);
    const strategies = this.determineStrategies(metrics);

    if (strategies.length === 0) {
      // No improvements needed
      return {
        strategy: 'None',
        originalText: text,
        improvedText: text,
        originalMetrics: metrics,
        improvedMetrics: metrics,
        improvement: {
          overallScoreDelta: 0,
          glueWordsDelta: 0,
          showVsTellDelta: 0,
          dynamicContentDelta: 0,
          dialogueBalanceDelta: 0,
          aiPatternsDelta: 0,
        },
        success: true,
      };
    }

    // Apply highest priority strategy
    return await this.applyStrategy(text, strategies[0], genre);
  }

  /**
   * Target specific metric weakness
   */
  static async targetMetric(
    text: string,
    metricName: string,
    genre: string
  ): Promise<ImprovementResult> {
    // Find strategy that targets this metric
    const strategy = Object.values(STRATEGIES).find(s =>
      s.targetMetrics.includes(metricName)
    );

    if (!strategy) {
      throw new Error(`No strategy found for metric: ${metricName}`);
    }

    return await this.applyStrategy(text, strategy, genre);
  }

  /**
   * Dialogue Fixer - Specialized dialogue enhancement
   */
  static async fixDialogue(text: string, genre: string): Promise<ImprovementResult> {
    return await this.applyStrategy(text, STRATEGIES.dialogue_fixer, genre);
  }

  /**
   * Show vs Tell Converter - Specialized showing enhancement
   */
  static async convertToShowing(text: string, genre: string): Promise<ImprovementResult> {
    return await this.applyStrategy(text, STRATEGIES.show_vs_tell_converter, genre);
  }

  /**
   * AI Pattern Eliminator - Remove all AI patterns
   */
  static async eliminateAIPatterns(text: string, genre: string): Promise<ImprovementResult> {
    return await this.applyStrategy(text, STRATEGIES.ai_pattern_eliminator, genre);
  }

  /**
   * Batch process multiple text segments
   */
  static async batchEnforce(
    segments: string[],
    genre: string,
    maxStrategiesPerSegment = 2
  ): Promise<{
    segments: string[];
    results: ImprovementResult[][];
    totalImprovement: number;
  }> {
    const allResults: ImprovementResult[][] = [];
    const improvedSegments: string[] = [];
    let totalImprovement = 0;

    for (const segment of segments) {
      const result = await this.enforceExcellence(segment, genre, maxStrategiesPerSegment);
      improvedSegments.push(result.finalText);
      allResults.push(result.strategies);
      totalImprovement += result.totalImprovement;
    }

    return {
      segments: improvedSegments,
      results: allResults,
      totalImprovement,
    };
  }

  /**
   * Get human-readable target metric description
   */
  private static getTargetMetricDescription(
    metricName: string,
    currentMetrics: EvaluationMetrics
  ): string {
    const descriptions: Record<string, string> = {
      aiPatternCount: `Eliminate all ${currentMetrics.aiPatternCount} AI patterns. Target: 0 patterns.`,
      showVsTell: `Reduce telling from ${currentMetrics.showVsTell.toFixed(1)}% to <10%. Show through action.`,
      dialogueBalance: `Adjust dialogue from ${currentMetrics.dialogueBalance.toFixed(1)}% to 30-50% range.`,
      glueWords: `Reduce glue words from ${currentMetrics.glueWords.toFixed(1)}% to <40%.`,
      dynamicContent: `Increase dynamic content from ${currentMetrics.dynamicContent.toFixed(1)}% to >70%.`,
      passiveVoice: `Reduce passive voice from ${currentMetrics.passiveVoice.toFixed(1)}% to <5%.`,
      wordRepetition: `Reduce word repetition from ${currentMetrics.wordRepetition.toFixed(1)}% to <2%.`,
      overallScore: `Improve overall score from ${currentMetrics.overallScore.toFixed(1)} to 90%+.`,
    };

    return descriptions[metricName] || `Improve ${metricName}`;
  }

  /**
   * Get improvement summary statistics
   */
  static getImprovementSummary(results: ImprovementResult[]): {
    totalStrategies: number;
    successfulStrategies: number;
    failedStrategies: number;
    totalScoreImprovement: number;
    bestStrategy: string | null;
    worstStrategy: string | null;
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    let bestStrategy: ImprovementResult | null = null;
    let worstStrategy: ImprovementResult | null = null;

    for (const result of successful) {
      if (!bestStrategy || result.improvement.overallScoreDelta > bestStrategy.improvement.overallScoreDelta) {
        bestStrategy = result;
      }
      if (!worstStrategy || result.improvement.overallScoreDelta < worstStrategy.improvement.overallScoreDelta) {
        worstStrategy = result;
      }
    }

    const totalScoreImprovement = successful.reduce(
      (sum, r) => sum + r.improvement.overallScoreDelta,
      0
    );

    return {
      totalStrategies: results.length,
      successfulStrategies: successful.length,
      failedStrategies: failed.length,
      totalScoreImprovement,
      bestStrategy: bestStrategy?.strategy || null,
      worstStrategy: worstStrategy?.strategy || null,
    };
  }

  /**
   * Validate that improvement didn't introduce new problems
   */
  static validateImprovement(result: ImprovementResult): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check that overall score improved or stayed same
    if (result.improvement.overallScoreDelta < -2) {
      issues.push(`Score decreased by ${Math.abs(result.improvement.overallScoreDelta).toFixed(1)} points`);
    }

    // Check that we didn't introduce AI patterns
    if (result.improvement.aiPatternsDelta < 0) {
      issues.push(`Introduced ${Math.abs(result.improvement.aiPatternsDelta)} AI patterns`);
    }

    // Check that coherence wasn't broken
    if (result.improvedMetrics.coherenceIssues.length > result.originalMetrics.coherenceIssues.length + 2) {
      issues.push(`Introduced ${result.improvedMetrics.coherenceIssues.length - result.originalMetrics.coherenceIssues.length} coherence issues`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
