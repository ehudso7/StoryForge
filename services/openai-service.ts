/**
 * OpenAI Service - GPT-4o Integration for StoryForge
 *
 * Handles all OpenAI API interactions for novel generation including:
 * - Scene generation (700-800 words)
 * - Chapter assembly (3,500-4,000 words)
 * - Style improvement passes
 * - Zero tolerance AI language enforcement
 * - FCR (Fiction Conflict Ratio) requirements
 * - Genre-specific guidelines
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Token limits for different operations
const TOKEN_LIMITS = {
  scene: 1200, // ~700-800 words
  chapter: 5000, // ~3,500-4,000 words
  improvement: 2000,
};

export interface SceneGenerationParams {
  outline: string;
  genre: string;
  pov: string;
  tone: string;
  previousContext?: string;
  characterNames: string[];
  targetLength?: number; // words, defaults to 700-800
}

export interface ChapterAssemblyParams {
  scenes: string[];
  chapterNumber: number;
  genre: string;
  tone: string;
  targetLength?: number; // words, defaults to 3,500-4,000
}

export interface ImprovementParams {
  text: string;
  weakness: string; // e.g., "glue words", "passive voice", "show vs tell"
  targetMetric: string;
  genre: string;
}

export interface OpenAIResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

/**
 * Core forbidden patterns that must NEVER appear in generated text
 * Based on U-WQES v2.0 standards
 */
const FORBIDDEN_PATTERNS = [
  // Academic/Business Jargon - ABSOLUTE ZERO TOLERANCE
  'delve into', 'delving into', 'dive into', 'diving into',
  'robust', 'leveraging', 'paradigm shift', 'cutting-edge',
  'state-of-the-art', 'game-changer', 'synergy', 'holistic',
  'comprehensive', 'fundamental', 'essential', 'crucial',
  'pivotal', 'paramount', 'instrumental', 'integral',
  'multifaceted', 'nuanced', 'intricate', 'complex tapestry',

  // Meta-narrative phrases - FORBIDDEN
  'it is important to note', 'it should be noted that',
  'it is worth noting', 'interestingly', 'notably',
  'in conclusion', 'in summary', 'to summarize',
  'first and foremost', 'last but not least',

  // Overused AI transitions - ELIMINATE
  'moreover', 'furthermore', 'additionally', 'consequently',
  'nevertheless', 'nonetheless', 'subsequently', 'accordingly',
  'thus', 'hence', 'therefore', 'thereby', 'wherein',
  'in light of', 'with regard to', 'in terms of',
  'in the context of', 'in the realm of', 'in the landscape of',
  'serves as', 'serves to', 'acts as a', 'functions as',
  'plays a crucial role', 'plays a vital role',
];

/**
 * Generate base system prompt with zero tolerance instructions
 */
function getBaseSystemPrompt(genre: string): string {
  return `You are a master fiction writer creating ${genre} content for commercial publication.

ABSOLUTE REQUIREMENTS - ZERO TOLERANCE:

1. FORBIDDEN LANGUAGE (INSTANT DISQUALIFICATION):
Never use: ${FORBIDDEN_PATTERNS.slice(0, 20).join(', ')}, or any academic/business jargon.
These patterns instantly identify AI writing. Use natural, human dialogue and description only.

2. SHOW, DON'T TELL (MANDATORY):
- Replace "he felt angry" with "his fists clenched, jaw tight"
- Replace "she was scared" with "her hands trembled, heart racing"
- Replace "he thought about" with direct action or dialogue
- NEVER use: felt, thought, knew, realized, believed, seemed, appeared
- Show emotion through action, dialogue, body language

3. ACTIVE VOICE (REQUIRED):
- "She grabbed the knife" NOT "The knife was grabbed by her"
- "He fired the gun" NOT "The gun was fired"
- Minimize: was, were, been, being, has been, had been
- Use strong action verbs: grabbed, lunged, sprinted, shattered

4. DIALOGUE (30-50% OF TEXT):
- Natural, conversational speech with contractions
- Interruptions, fragments, regional dialect if appropriate
- Subtext and conflict in every exchange
- No exposition dumps disguised as dialogue
- "I'm not going." NOT "I am not going to go with you."

5. GLUE WORDS (<40%):
- Eliminate weak words: very, really, quite, rather, just, even
- Cut unnecessary articles and prepositions
- Strong nouns and verbs, minimal modifiers
- "She sprinted" NOT "She ran very quickly"

6. FICTION CONFLICT RATIO (FCR):
- 70%+ DYNAMIC: action, conflict, tension, dialogue
- 30% reflective: introspection, description, themes
- Every scene needs conflict or tension
- No passive reflection without stakes

7. SENSORY DETAILS (CONCRETE):
- Specific nouns: "Glock 19" not "gun", "bourbon" not "drink"
- Visceral sensory details: sounds, smells, textures, tastes
- Show physical environment through character interaction
- "The whiskey burned his throat" NOT "He drank whiskey"

8. SENTENCE VARIATION:
- Mix short punchy sentences with longer flowing ones
- Vary sentence structure and rhythm
- "He ran. Heart pounding. Door ahead." vs longer descriptive sentences
- Never start 3+ sentences the same way

9. WORD CHOICE:
- Never repeat significant words within 50 words
- Use synonyms strategically
- Avoid clichés and overused phrases
- Fresh, specific language always

10. GENRE CONVENTIONS (${genre.toUpperCase()}):
${getGenreGuidelines(genre)}

PRODUCE PROFESSIONAL, HUMAN-SOUNDING PROSE INDISTINGUISHABLE FROM TOP AUTHORS.
Zero AI patterns. Zero exposition. Zero telling. Pure show.`;
}

/**
 * Get genre-specific writing guidelines
 */
function getGenreGuidelines(genre: string): string {
  const guidelines: Record<string, string> = {
    'thriller': `- High stakes, constant tension, ticking clocks
- Short chapters, cliffhanger endings
- Visceral action scenes with specific tactical details
- Paranoia, conspiracy, twists every 50-100 pages`,

    'mystery': `- Clues planted organically through action
- Red herrings via character behavior, not exposition
- Detective observations through active investigation
- Revelation through dialogue and discovery`,

    'romance': `- Emotional tension and conflict between leads
- Chemistry shown through dialogue, not description
- Internal conflict externalized through action
- Genuine obstacles, not manufactured misunderstandings`,

    'science fiction': `- Technology integrated naturally, no info dumps
- Worldbuilding through character interaction
- Scientific concepts shown through action and consequences
- Grounded human drama amid speculation`,

    'fantasy': `- Magic system shown through use, not explanation
- Worldbuilding via immersion, not exposition
- Cultural details through character experience
- Quest/conflict structures with clear stakes`,

    'horror': `- Atmosphere through sensory dread
- Unknown threats, partial reveals
- Visceral fear responses in characters
- Psychological unraveling shown through behavior`,

    'literary fiction': `- Character depth through action and choice
- Thematic elements woven into plot
- Sophisticated prose without pretension
- Emotional truth in every scene`,
  };

  return guidelines[genre.toLowerCase()] || guidelines['thriller'];
}

/**
 * Generate a single scene (700-800 words)
 */
export async function generateScene(
  params: SceneGenerationParams
): Promise<OpenAIResponse> {
  const targetWords = params.targetLength || 750;

  const systemPrompt = getBaseSystemPrompt(params.genre);

  const userPrompt = `Generate a ${targetWords}-word scene based on this outline:

${params.outline}

SCENE REQUIREMENTS:
- POV: ${params.pov}
- Tone: ${params.tone}
- Characters: ${params.characterNames.join(', ')}
- Length: ${targetWords} words (strict)
${params.previousContext ? `\nPrevious context:\n${params.previousContext.substring(0, 500)}...` : ''}

Write ONLY the scene content. No titles, no meta-commentary.
Start immediately with action or dialogue.
Meet all ABSOLUTE REQUIREMENTS above.
Make it indistinguishable from human-written professional fiction.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9, // High creativity for fiction
        max_tokens: TOKEN_LIMITS.scene,
        presence_penalty: 0.6, // Encourage variety
        frequency_penalty: 0.8, // Discourage repetition
      });
    });

    await rateLimitDelay();

    return {
      text: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  } catch (error) {
    throw new Error(`Scene generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Assemble multiple scenes into a cohesive chapter (3,500-4,000 words)
 */
export async function assembleChapter(
  params: ChapterAssemblyParams
): Promise<OpenAIResponse> {
  const targetWords = params.targetLength || 3750;

  const systemPrompt = getBaseSystemPrompt(params.genre);

  const userPrompt = `Assemble Chapter ${params.chapterNumber} from these scenes into a cohesive ${targetWords}-word chapter:

SCENES:
${params.scenes.map((scene, i) => `--- SCENE ${i + 1} ---\n${scene}\n`).join('\n')}

ASSEMBLY REQUIREMENTS:
- Target length: ${targetWords} words
- Add smooth transitions between scenes
- Ensure narrative flow and pacing
- Maintain consistent POV and voice
- Add chapter opening hook if needed
- Strengthen scene endings/transitions
- Ensure all ABSOLUTE REQUIREMENTS are met
- Remove any AI patterns that slipped through

Output ONLY the complete chapter text, no meta-commentary.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: TOKEN_LIMITS.chapter,
        presence_penalty: 0.5,
        frequency_penalty: 0.7,
      });
    });

    await rateLimitDelay();

    return {
      text: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  } catch (error) {
    throw new Error(`Chapter assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Improve text targeting specific metric weaknesses
 */
export async function improveText(
  params: ImprovementParams
): Promise<OpenAIResponse> {
  const systemPrompt = getBaseSystemPrompt(params.genre);

  // Strategy-specific prompts based on weakness
  const improvementStrategies: Record<string, string> = {
    'glue_words': `TASK: Eliminate weak glue words and filler language.

STRATEGY:
- Remove: very, really, quite, rather, just, even, still, also
- Cut unnecessary articles (a, an, the) where possible
- Eliminate redundant prepositions
- Replace weak verbs with strong action verbs
- "She ran quickly" → "She sprinted"
- Keep meaning exact, increase impact

Rewrite this text with <40% glue words:`,

    'passive_voice': `TASK: Convert passive voice to active voice.

STRATEGY:
- "was grabbed" → "grabbed"
- "had been taken" → "took"
- "was being followed" → "followed"
- Put actor before action
- Use strong action verbs
- Increase immediacy and impact

Rewrite this text in active voice (<5% passive):`,

    'show_vs_tell': `TASK: Show, don't tell. Eliminate all telling.

STRATEGY:
- "he felt angry" → "his fists clenched, jaw tight, eyes blazing"
- "she was scared" → "her hands trembled, breath shallow, eyes darting"
- "he realized" → show the moment through action/reaction
- Never use: felt, thought, knew, realized, believed, seemed
- Show emotion through: body language, action, dialogue, behavior

Rewrite this showing everything through action:`,

    'dialogue_balance': `TASK: Increase natural dialogue to 30-50% of text.

STRATEGY:
- Convert exposition to dialogue where possible
- Add character conversations that advance plot
- Use dialogue for conflict and tension
- Natural speech with contractions
- Subtext and implication
- Keep action/dialogue beats integrated

Rewrite adding more natural dialogue:`,

    'ai_patterns': `TASK: ELIMINATE ALL AI-DETECTABLE PATTERNS.

FORBIDDEN (remove completely):
${FORBIDDEN_PATTERNS.join(', ')}

STRATEGY:
- Replace academic language with concrete nouns/verbs
- Remove all meta-narrative phrases
- Simplify transitions to natural flow
- Use human-sounding prose
- Zero business jargon, zero AI tells

Rewrite with zero AI patterns:`,

    'sentence_variation': `TASK: Improve sentence rhythm and variation.

STRATEGY:
- Mix short punchy sentences with longer ones
- Vary sentence openings (never 3+ same starts)
- Alternate sentence structures
- Create rhythmic flow
- "He ran. Fast. Door ahead." + longer descriptive sentences
- Build tension through rhythm

Rewrite with varied sentence structures:`,

    'dynamic_content': `TASK: Increase dynamic content (action, conflict, tension) to 70%+.

STRATEGY:
- Add action beats and physical movement
- Insert conflict or tension
- Show stakes and consequences
- Cut passive reflection without stakes
- Add sensory details through action
- "He grabbed the knife, blade glinting" not "He held a knife"

Rewrite with maximum action and tension:`,

    'sensory_details': `TASK: Add concrete sensory details.

STRATEGY:
- Specific nouns: "Glock 19" not "gun", "bourbon" not "drink"
- Visceral sensory: sounds, smells, textures, tastes
- Physical environment through interaction
- "Whiskey burned his throat, oak and caramel" not "He drank"
- Ground reader in physical reality

Rewrite with rich sensory details:`,
  };

  const strategy = improvementStrategies[params.weakness] || improvementStrategies['show_vs_tell'];

  const userPrompt = `${strategy}

TARGET METRIC: ${params.targetMetric}

ORIGINAL TEXT:
${params.text}

IMPROVED TEXT (maintain exact plot/meaning, improve style only):`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7, // Lower temp for improvement (precision)
        max_tokens: TOKEN_LIMITS.improvement,
        presence_penalty: 0.6,
        frequency_penalty: 0.8,
      });
    });

    await rateLimitDelay();

    return {
      text: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  } catch (error) {
    throw new Error(`Text improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retry mechanism with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0) {
      throw error;
    }

    // Check if error is rate limit
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      console.log(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1);
    }

    // For other errors, throw immediately
    throw error;
  }
}

/**
 * Rate limiting delay between requests
 */
async function rateLimitDelay(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

/**
 * Validate OpenAI API key is configured
 */
export function validateOpenAIConfig(): { valid: boolean; error?: string } {
  if (!process.env.OPENAI_API_KEY) {
    return {
      valid: false,
      error: 'OPENAI_API_KEY environment variable is not set',
    };
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    return {
      valid: false,
      error: 'OPENAI_API_KEY appears to be invalid (should start with sk-)',
    };
  }

  return { valid: true };
}

/**
 * Test OpenAI connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await openai.models.list();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current rate limit status (estimate)
 */
export function getRateLimitInfo() {
  return {
    delayBetweenRequests: RATE_LIMIT_DELAY,
    maxRetries: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  };
}
