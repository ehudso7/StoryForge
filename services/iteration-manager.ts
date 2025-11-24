/**
 * Iteration Manager - Improvement Cycle Tracking System
 *
 * Manages iterative improvement cycles for text with:
 * - Snapshot history of each iteration with full metrics
 * - Best-ever value tracking for each metric
 * - Metric locks (prevent regression on metrics that reached target)
 * - Iteration limits (max 15 iterations)
 * - Auto-stop when target score reached (90%+)
 * - Comprehensive improvement history and analytics
 */

import { DraftEvaluator, EvaluationMetrics } from './draft-evaluator';
import { ExcellenceEnforcer, ImprovementResult } from './excellence-enforcer';

export interface IterationSnapshot {
  iteration: number;
  timestamp: Date;
  text: string;
  metrics: EvaluationMetrics;
  strategies: string[]; // Strategies applied in this iteration
  improvements: MetricChange[];
  locked: string[]; // Metrics that are locked (can't regress)
}

export interface MetricChange {
  metric: string;
  before: number;
  after: number;
  delta: number;
  improved: boolean;
}

export interface MetricLock {
  metric: string;
  targetValue: number;
  currentValue: number;
  locked: boolean;
  lockedAt?: number; // Iteration when locked
}

export interface BestEverValues {
  overallScore: number;
  glueWords: number; // Lower is better
  passiveVoice: number; // Lower is better
  dialogueBalance: number; // Closest to 40% is best
  showVsTell: number; // Lower is better (INVERTED)
  wordRepetition: number; // Lower is better
  dynamicContent: number; // Higher is better
  reflectiveContent: number;
  aiPatternCount: number; // Lower is better
  iteration: number; // When best score was achieved
}

export interface IterationHistory {
  snapshots: IterationSnapshot[];
  bestEver: BestEverValues;
  locks: MetricLock[];
  targetReached: boolean;
  totalIterations: number;
  finalScore: number;
  totalImprovement: number;
}

// Maximum iterations allowed
const MAX_ITERATIONS = 15;

// Target score for auto-stop
const TARGET_SCORE = 90;

// Metric targets for locking
const METRIC_TARGETS = {
  overallScore: 90,
  glueWords: 40, // <40%
  passiveVoice: 5, // <5%
  dialogueBalanceMin: 30, // 30-50% range
  dialogueBalanceMax: 50,
  showVsTell: 10, // <10%
  wordRepetition: 2, // <2%
  dynamicContent: 70, // >70%
  aiPatternCount: 0, // Zero tolerance
};

export class IterationManager {
  private history: IterationHistory;
  private currentText: string;
  private genre: string;

  constructor(initialText: string, genre: string) {
    this.currentText = initialText;
    this.genre = genre;

    const initialMetrics = DraftEvaluator.evaluate(initialText);

    this.history = {
      snapshots: [
        {
          iteration: 0,
          timestamp: new Date(),
          text: initialText,
          metrics: initialMetrics,
          strategies: [],
          improvements: [],
          locked: [],
        },
      ],
      bestEver: this.initializeBestEver(initialMetrics),
      locks: this.initializeLocks(initialMetrics),
      targetReached: initialMetrics.overallScore >= TARGET_SCORE,
      totalIterations: 0,
      finalScore: initialMetrics.overallScore,
      totalImprovement: 0,
    };
  }

  /**
   * Initialize best-ever values from initial metrics
   */
  private initializeBestEver(metrics: EvaluationMetrics): BestEverValues {
    return {
      overallScore: metrics.overallScore,
      glueWords: metrics.glueWords,
      passiveVoice: metrics.passiveVoice,
      dialogueBalance: metrics.dialogueBalance,
      showVsTell: metrics.showVsTell,
      wordRepetition: metrics.wordRepetition,
      dynamicContent: metrics.dynamicContent,
      reflectiveContent: metrics.reflectiveContent,
      aiPatternCount: metrics.aiPatternCount,
      iteration: 0,
    };
  }

  /**
   * Initialize metric locks
   */
  private initializeLocks(metrics: EvaluationMetrics): MetricLock[] {
    return [
      {
        metric: 'overallScore',
        targetValue: METRIC_TARGETS.overallScore,
        currentValue: metrics.overallScore,
        locked: metrics.overallScore >= METRIC_TARGETS.overallScore,
      },
      {
        metric: 'glueWords',
        targetValue: METRIC_TARGETS.glueWords,
        currentValue: metrics.glueWords,
        locked: metrics.glueWords < METRIC_TARGETS.glueWords,
      },
      {
        metric: 'passiveVoice',
        targetValue: METRIC_TARGETS.passiveVoice,
        currentValue: metrics.passiveVoice,
        locked: metrics.passiveVoice < METRIC_TARGETS.passiveVoice,
      },
      {
        metric: 'dialogueBalance',
        targetValue: 40, // Optimal center
        currentValue: metrics.dialogueBalance,
        locked: metrics.dialogueBalance >= METRIC_TARGETS.dialogueBalanceMin &&
                metrics.dialogueBalance <= METRIC_TARGETS.dialogueBalanceMax,
      },
      {
        metric: 'showVsTell',
        targetValue: METRIC_TARGETS.showVsTell,
        currentValue: metrics.showVsTell,
        locked: metrics.showVsTell < METRIC_TARGETS.showVsTell,
      },
      {
        metric: 'dynamicContent',
        targetValue: METRIC_TARGETS.dynamicContent,
        currentValue: metrics.dynamicContent,
        locked: metrics.dynamicContent > METRIC_TARGETS.dynamicContent,
      },
      {
        metric: 'aiPatternCount',
        targetValue: METRIC_TARGETS.aiPatternCount,
        currentValue: metrics.aiPatternCount,
        locked: metrics.aiPatternCount === METRIC_TARGETS.aiPatternCount,
      },
    ];
  }

  /**
   * Run one improvement iteration
   */
  async runIteration(maxStrategies = 3): Promise<{
    success: boolean;
    improved: boolean;
    snapshot: IterationSnapshot;
    shouldContinue: boolean;
    message: string;
  }> {
    // Check if we should stop
    if (this.history.totalIterations >= MAX_ITERATIONS) {
      return {
        success: false,
        improved: false,
        snapshot: this.getCurrentSnapshot(),
        shouldContinue: false,
        message: `Maximum iterations reached (${MAX_ITERATIONS})`,
      };
    }

    if (this.history.targetReached) {
      return {
        success: true,
        improved: false,
        snapshot: this.getCurrentSnapshot(),
        shouldContinue: false,
        message: `Target score ${TARGET_SCORE}% already reached`,
      };
    }

    const iterationNumber = this.history.totalIterations + 1;
    const previousMetrics = this.getCurrentMetrics();

    console.log(`\n=== Iteration ${iterationNumber} ===`);
    console.log(`Current score: ${previousMetrics.overallScore.toFixed(1)}%`);

    try {
      // Apply improvement strategies
      const result = await ExcellenceEnforcer.enforceExcellence(
        this.currentText,
        this.genre,
        maxStrategies
      );

      const newMetrics = DraftEvaluator.evaluate(result.finalText);

      // Validate against locks
      const lockViolations = this.checkLockViolations(newMetrics);
      if (lockViolations.length > 0) {
        console.log(`⚠ Lock violations detected: ${lockViolations.join(', ')}`);
        // Revert - don't update text
        return {
          success: false,
          improved: false,
          snapshot: this.getCurrentSnapshot(),
          shouldContinue: true,
          message: `Lock violations: ${lockViolations.join(', ')}. Reverted changes.`,
        };
      }

      // Calculate improvements
      const improvements = this.calculateMetricChanges(previousMetrics, newMetrics);
      const improved = newMetrics.overallScore > previousMetrics.overallScore;

      // Update best-ever values
      this.updateBestEver(newMetrics, iterationNumber);

      // Update locks
      this.updateLocks(newMetrics, iterationNumber);

      // Create snapshot
      const snapshot: IterationSnapshot = {
        iteration: iterationNumber,
        timestamp: new Date(),
        text: result.finalText,
        metrics: newMetrics,
        strategies: result.strategies.map(s => s.strategy),
        improvements,
        locked: this.getLockedMetrics(),
      };

      // Update history
      this.history.snapshots.push(snapshot);
      this.history.totalIterations = iterationNumber;
      this.history.finalScore = newMetrics.overallScore;
      this.history.totalImprovement += result.totalImprovement;
      this.history.targetReached = newMetrics.overallScore >= TARGET_SCORE;

      // Update current text only if improved
      if (improved) {
        this.currentText = result.finalText;
      }

      const shouldContinue = !this.history.targetReached && iterationNumber < MAX_ITERATIONS;

      return {
        success: true,
        improved,
        snapshot,
        shouldContinue,
        message: improved
          ? `Improved: ${previousMetrics.overallScore.toFixed(1)}% → ${newMetrics.overallScore.toFixed(1)}% (+${result.totalImprovement.toFixed(1)})`
          : `No improvement: ${previousMetrics.overallScore.toFixed(1)}% (strategies had no positive effect)`,
      };
    } catch (error) {
      return {
        success: false,
        improved: false,
        snapshot: this.getCurrentSnapshot(),
        shouldContinue: true,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Run iterations until target reached or max iterations
   */
  async runUntilTarget(maxStrategiesPerIteration = 3): Promise<IterationHistory> {
    let shouldContinue = true;

    while (shouldContinue) {
      const result = await this.runIteration(maxStrategiesPerIteration);
      console.log(result.message);

      shouldContinue = result.shouldContinue && result.success;

      // Add delay between iterations to respect rate limits
      if (shouldContinue) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return this.getHistory();
  }

  /**
   * Check if new metrics violate any locks
   */
  private checkLockViolations(newMetrics: EvaluationMetrics): string[] {
    const violations: string[] = [];

    for (const lock of this.history.locks) {
      if (!lock.locked) continue;

      let violated = false;

      switch (lock.metric) {
        case 'overallScore':
          violated = newMetrics.overallScore < lock.currentValue - 1; // Allow 1 point tolerance
          break;
        case 'glueWords':
          violated = newMetrics.glueWords > lock.currentValue + 2; // Allow 2% tolerance
          break;
        case 'passiveVoice':
          violated = newMetrics.passiveVoice > lock.currentValue + 1;
          break;
        case 'dialogueBalance':
          violated = newMetrics.dialogueBalance < METRIC_TARGETS.dialogueBalanceMin ||
                     newMetrics.dialogueBalance > METRIC_TARGETS.dialogueBalanceMax;
          break;
        case 'showVsTell':
          violated = newMetrics.showVsTell > lock.currentValue + 2;
          break;
        case 'dynamicContent':
          violated = newMetrics.dynamicContent < lock.currentValue - 3;
          break;
        case 'aiPatternCount':
          violated = newMetrics.aiPatternCount > lock.currentValue;
          break;
      }

      if (violated) {
        violations.push(lock.metric);
      }
    }

    return violations;
  }

  /**
   * Update best-ever values if new metrics are better
   */
  private updateBestEver(metrics: EvaluationMetrics, iteration: number): void {
    const best = this.history.bestEver;

    // Overall score (higher is better)
    if (metrics.overallScore > best.overallScore) {
      best.overallScore = metrics.overallScore;
      best.iteration = iteration;
    }

    // Metrics where lower is better
    if (metrics.glueWords < best.glueWords) best.glueWords = metrics.glueWords;
    if (metrics.passiveVoice < best.passiveVoice) best.passiveVoice = metrics.passiveVoice;
    if (metrics.showVsTell < best.showVsTell) best.showVsTell = metrics.showVsTell;
    if (metrics.wordRepetition < best.wordRepetition) best.wordRepetition = metrics.wordRepetition;
    if (metrics.aiPatternCount < best.aiPatternCount) best.aiPatternCount = metrics.aiPatternCount;

    // Metrics where higher is better
    if (metrics.dynamicContent > best.dynamicContent) best.dynamicContent = metrics.dynamicContent;
    if (metrics.reflectiveContent > best.reflectiveContent) best.reflectiveContent = metrics.reflectiveContent;

    // Dialogue balance (closer to 40% is better)
    const currentDistance = Math.abs(metrics.dialogueBalance - 40);
    const bestDistance = Math.abs(best.dialogueBalance - 40);
    if (currentDistance < bestDistance) {
      best.dialogueBalance = metrics.dialogueBalance;
    }
  }

  /**
   * Update lock status based on new metrics
   */
  private updateLocks(metrics: EvaluationMetrics, iteration: number): void {
    for (const lock of this.history.locks) {
      if (lock.locked) continue; // Already locked

      let shouldLock = false;
      let newValue = 0;

      switch (lock.metric) {
        case 'overallScore':
          newValue = metrics.overallScore;
          shouldLock = metrics.overallScore >= METRIC_TARGETS.overallScore;
          break;
        case 'glueWords':
          newValue = metrics.glueWords;
          shouldLock = metrics.glueWords < METRIC_TARGETS.glueWords;
          break;
        case 'passiveVoice':
          newValue = metrics.passiveVoice;
          shouldLock = metrics.passiveVoice < METRIC_TARGETS.passiveVoice;
          break;
        case 'dialogueBalance':
          newValue = metrics.dialogueBalance;
          shouldLock = metrics.dialogueBalance >= METRIC_TARGETS.dialogueBalanceMin &&
                       metrics.dialogueBalance <= METRIC_TARGETS.dialogueBalanceMax;
          break;
        case 'showVsTell':
          newValue = metrics.showVsTell;
          shouldLock = metrics.showVsTell < METRIC_TARGETS.showVsTell;
          break;
        case 'dynamicContent':
          newValue = metrics.dynamicContent;
          shouldLock = metrics.dynamicContent > METRIC_TARGETS.dynamicContent;
          break;
        case 'aiPatternCount':
          newValue = metrics.aiPatternCount;
          shouldLock = metrics.aiPatternCount === METRIC_TARGETS.aiPatternCount;
          break;
      }

      lock.currentValue = newValue;

      if (shouldLock) {
        lock.locked = true;
        lock.lockedAt = iteration;
        console.log(`🔒 Metric locked: ${lock.metric} at ${newValue.toFixed(1)}`);
      }
    }
  }

  /**
   * Get list of currently locked metrics
   */
  private getLockedMetrics(): string[] {
    return this.history.locks.filter(l => l.locked).map(l => l.metric);
  }

  /**
   * Calculate metric changes between iterations
   */
  private calculateMetricChanges(
    before: EvaluationMetrics,
    after: EvaluationMetrics
  ): MetricChange[] {
    const changes: MetricChange[] = [
      {
        metric: 'overallScore',
        before: before.overallScore,
        after: after.overallScore,
        delta: after.overallScore - before.overallScore,
        improved: after.overallScore > before.overallScore,
      },
      {
        metric: 'glueWords',
        before: before.glueWords,
        after: after.glueWords,
        delta: before.glueWords - after.glueWords, // Lower is better
        improved: after.glueWords < before.glueWords,
      },
      {
        metric: 'showVsTell',
        before: before.showVsTell,
        after: after.showVsTell,
        delta: before.showVsTell - after.showVsTell, // Lower is better
        improved: after.showVsTell < before.showVsTell,
      },
      {
        metric: 'dynamicContent',
        before: before.dynamicContent,
        after: after.dynamicContent,
        delta: after.dynamicContent - before.dynamicContent,
        improved: after.dynamicContent > before.dynamicContent,
      },
      {
        metric: 'aiPatternCount',
        before: before.aiPatternCount,
        after: after.aiPatternCount,
        delta: before.aiPatternCount - after.aiPatternCount, // Lower is better
        improved: after.aiPatternCount < before.aiPatternCount,
      },
    ];

    return changes;
  }

  /**
   * Get current snapshot
   */
  private getCurrentSnapshot(): IterationSnapshot {
    return this.history.snapshots[this.history.snapshots.length - 1];
  }

  /**
   * Get current metrics
   */
  private getCurrentMetrics(): EvaluationMetrics {
    return this.getCurrentSnapshot().metrics;
  }

  /**
   * Get current text
   */
  getCurrentText(): string {
    return this.currentText;
  }

  /**
   * Get complete history
   */
  getHistory(): IterationHistory {
    return this.history;
  }

  /**
   * Get improvement summary
   */
  getSummary(): {
    initialScore: number;
    finalScore: number;
    totalImprovement: number;
    iterations: number;
    targetReached: boolean;
    bestIteration: number;
    lockedMetrics: string[];
  } {
    const initial = this.history.snapshots[0].metrics;
    const final = this.getCurrentMetrics();

    return {
      initialScore: initial.overallScore,
      finalScore: final.overallScore,
      totalImprovement: this.history.totalImprovement,
      iterations: this.history.totalIterations,
      targetReached: this.history.targetReached,
      bestIteration: this.history.bestEver.iteration,
      lockedMetrics: this.getLockedMetrics(),
    };
  }

  /**
   * Export history as JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Get iteration comparison
   */
  compareIterations(iteration1: number, iteration2: number): {
    iteration1: IterationSnapshot;
    iteration2: IterationSnapshot;
    improvements: MetricChange[];
  } | null {
    if (iteration1 >= this.history.snapshots.length || iteration2 >= this.history.snapshots.length) {
      return null;
    }

    const snap1 = this.history.snapshots[iteration1];
    const snap2 = this.history.snapshots[iteration2];

    return {
      iteration1: snap1,
      iteration2: snap2,
      improvements: this.calculateMetricChanges(snap1.metrics, snap2.metrics),
    };
  }
}
