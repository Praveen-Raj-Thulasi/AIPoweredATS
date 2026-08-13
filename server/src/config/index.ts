import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'verity_super_secure_jwt_access_secret_key_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'verity_super_secure_jwt_refresh_secret_key_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieName: 'verity_refresh_token',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_ats',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'verity-ats-production-resumes',
      evidenceBucketName: process.env.AWS_S3_EVIDENCE_BUCKET_NAME || 'verity-ats-candidate-evidence',
      reportsBucketName: process.env.AWS_S3_REPORTS_BUCKET_NAME || 'verity-ats-generated-reports',
      signedUrlExpirationSeconds: parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRATION || '900', 10), // 15 mins
      serverSideEncryption: process.env.AWS_S3_SSE_ALGORITHM || 'AES256',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10), // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'application/json',
        'image/png',
        'image/jpeg',
      ],
    },
    bedrock: {
      sonnetModelId: process.env.AWS_BEDROCK_SONNET_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      haikuModelId: process.env.AWS_BEDROCK_HAIKU_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      timeoutMs: parseInt(process.env.AWS_BEDROCK_TIMEOUT_MS || '30000', 10), // 30s
      maxTokens: parseInt(process.env.AWS_BEDROCK_MAX_TOKENS || '4096', 10),
      temperature: parseFloat(process.env.AWS_BEDROCK_TEMPERATURE || '0.2'),
      maxRetries: parseInt(process.env.AWS_BEDROCK_MAX_RETRIES || '3', 10),
    },
    ses: {
      fromEmail: process.env.AWS_SES_FROM_EMAIL || 'notifications@verity.ai',
      replyTo: process.env.AWS_SES_REPLY_TO || 'support@verity.ai',
      configurationSet: process.env.AWS_SES_CONFIGURATION_SET || undefined,
    },
    secretsManager: {
      secretName: process.env.AWS_SECRETS_MANAGER_NAME || 'verity/production/app-secrets',
      cacheTtlSeconds: parseInt(process.env.AWS_SECRETS_CACHE_TTL || '3600', 10), // 1 hour
      enabled: process.env.ENABLE_SECRETS_MANAGER === 'true',
    },
    cloudWatch: {
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/aws/ecs/verity-ats-production',
      metricNamespace: process.env.CLOUDWATCH_NAMESPACE || 'VERITY/RecruitmentIntelligence',
      enabled: process.env.ENABLE_CLOUDWATCH === 'true',
    },
  },
  ai: {
    enableMockFallback: process.env.ENABLE_AI_MOCK_FALLBACK !== 'false',
    enablePromptResponseCaching: process.env.ENABLE_AI_CACHE !== 'false',
    monthlyBudgetUsd: parseFloat(process.env.MONTHLY_AI_BUDGET_USD || '500.0'),
  },
  storage: {
    uploadDir: path.resolve(__dirname, '../../uploads'),
  },
};
