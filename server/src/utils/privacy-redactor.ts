/**
 * Privacy Redactor Utility for VERITY ATS
 * Enforces strict PII, credential, and document sanitization across all logs and telemetry streams.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'authorization',
  'secret',
  'secretaccesskey',
  'awssecretaccesskey',
  'privatekey',
  'ssn',
  'creditcard',
  'cookie',
  'resumerawtext',
  'rawcontent',
]);

/**
 * Deeply sanitizes any object or value, replacing sensitive keys or patterns with [REDACTED].
 */
export function sanitizeLogPayload<T>(input: T, maxDepth = 6): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'object') {
    if (typeof input === 'string') {
      return sanitizeString(input) as unknown as T;
    }
    return input;
  }

  if (maxDepth <= 0) return '[NESTED_OBJECT]' as unknown as T;

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeLogPayload(item, maxDepth - 1)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogPayload(value, maxDepth - 1);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitizes plain string payloads against bearer tokens, AWS keys, or API credentials.
 */
export function sanitizeString(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    // Redact Bearer tokens: Bearer eyJhbGciOi...
    .replace(/Bearer\s+([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi, 'Bearer [REDACTED_JWT]')
    // Redact AWS Secret Keys (40 chars base64)
    .replace(/(aws_secret_access_key|secretAccessKey|secretKey)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi, '$1=[REDACTED_KEY]')
    // Redact Password patterns: password: "..."
    .replace(/(password|passwd|pwd)\s*[:=]\s*["']?[^"',\s]+["']?/gi, '$1=[REDACTED_PASSWORD]');
}
