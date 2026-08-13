import { logger } from '../../utils/logger';

export interface PromptSanitizationResult {
  sanitizedPrompt: string;
  injectionsDetected: string[];
  isTampered: boolean;
}

const INJECTION_PATTERNS: Array<{ name: string; regex: RegExp; replacement: string }> = [
  // 1. Direct Instruction Overrides
  {
    name: 'Instruction Override',
    regex: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|system|initial)\s+(?:instructions|prompts|rules|guidelines)/gi,
    replacement: '[FILTERED_INSTRUCTION_OVERRIDE]',
  },
  {
    name: 'System Roleplay Attempt',
    regex: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:a|an)?\s*(?:system|admin|root|jailbroken|unrestricted|god\s+mode|dan)/gi,
    replacement: '[FILTERED_ROLEPLAY_PROMPT]',
  },
  // 2. Delimiter Evasions
  {
    name: 'Delimiter Escape',
    regex: /<\/?(?:system|instruction|admin|prompt|human|assistant|user)>/gi,
    replacement: '[ESCAPED_DELIMITER]',
  },
  {
    name: 'Markdown Directive Evasion',
    regex: /(?:^|\n)(?:###\s*(?:System|Instruction|Override|Admin)|```(?:system|admin))/gi,
    replacement: '\n[FILTERED_MARKDOWN_INSTRUCTION]',
  },
  // 3. Prompt Exfiltration Probing
  {
    name: 'Exfiltration Probe',
    regex: /(?:reveal|print|output|dump|show|repeat)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|hidden\s+rules|api\s+keys|passwords)/gi,
    replacement: '[FILTERED_EXFILTRATION_PROBE]',
  },
  // 4. Candidate Score Manipulation
  {
    name: 'Score Manipulation',
    regex: /(?:give|assign|rate)\s+(?:this\s+candidate|me)\s+(?:a\s+score\s+of\s+)?(?:100%?|perfect|maximum|10\/10|verified)/gi,
    replacement: '[FILTERED_SCORE_MANIPULATION_CLAIM]',
  },
];

export class AISecurityService {
  /**
   * Sanitizes untrusted candidate content and wraps it in strong boundary isolation tags.
   */
  sanitizeUntrustedInput(rawInput: string): PromptSanitizationResult {
    if (!rawInput || typeof rawInput !== 'string') {
      return { sanitizedPrompt: '', injectionsDetected: [], isTampered: false };
    }

    let sanitized = rawInput;
    const injectionsDetected: string[] = [];

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.regex.test(sanitized)) {
        injectionsDetected.push(pattern.name);
        sanitized = sanitized.replace(pattern.regex, pattern.replacement);
      }
    }

    if (injectionsDetected.length > 0) {
      logger.warn(`[AI Security] Prompt injection attempt neutralized: ${injectionsDetected.join(', ')}`);
    }

    return {
      sanitizedPrompt: sanitized,
      injectionsDetected,
      isTampered: injectionsDetected.length > 0,
    };
  }

  /**
   * Encapsulates untrusted candidate text into an isolated XML boundary block.
   */
  encapsulateCandidateBoundary(candidateContent: string): string {
    const { sanitizedPrompt } = this.sanitizeUntrustedInput(candidateContent);
    return `\n<untrusted_candidate_data>\n${sanitizedPrompt}\n</untrusted_candidate_data>\n`;
  }

  /**
   * Validates AI response to ensure it does NOT contain executable shell commands or dangerous scripts.
   */
  validateSafeDeclarativeOutput(outputString: string): { isSafe: boolean; reason?: string } {
    if (!outputString) return { isSafe: true };

    const dangerousPatterns = [
      /\b(?:rm\s+-rf|sudo\s+|chmod\s+\+x|mkfs|dd\s+if=|curl\s+.*\|\s*sh|wget\s+.*\|\s*bash)\b/i,
      /\b(?:db\.dropDatabase|DROP\s+TABLE|DELETE\s+FROM|TRUNCATE\s+TABLE)\b/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /\beval\s*\(/i,
      /\bprocess\.exit\s*\(/i,
    ];

    for (const pat of dangerousPatterns) {
      if (pat.test(outputString)) {
        logger.error('[AI Security] Dangerous executable pattern detected in AI response. Neutralizing output.');
        return {
          isSafe: false,
          reason: 'AI output contains prohibited executable or destructive syntax.',
        };
      }
    }

    return { isSafe: true };
  }
}

export const aiSecurityService = new AISecurityService();
