import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDB } from './utils/db';
import { seedDatabase } from './seed';
import routes from './routes';
import { ApiError } from './utils/errors';
import {
  nosqlInjectionGuard,
  xssSanitizer,
  ownershipFieldGuard,
  apiLimiter,
} from './middlewares/security.middleware';

export const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// CORS configuration with credentials support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and configured origin
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and Cookie Parsers with strict size limits
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL, XSS, Ownership and API Rate Protection
app.use(nosqlInjectionGuard);
app.use(xssSanitizer);
app.use(ownershipFieldGuard);
app.use('/api', apiLimiter);

// Static uploads serving (local S3 storage fallback)
app.use('/uploads', express.static(config.storage.uploadDir));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.originalUrl.includes('/health')) {
      logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VERITY ATS Backend Engine',
    version: '1.0.0',
    awsBedrockModel: config.aws.bedrock.modelId,
    s3Bucket: config.aws.s3.bucketName,
  });
});

// Mount API routes under /api/v1 and alias /api
app.use('/api/v1', routes);
app.use('/api', routes); // backwards compatibility

// Centralized Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || (err instanceof ApiError ? err.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error('Unhandled server error:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err.details || undefined,
    },
  });
});

export async function startServer() {
  await connectDB();
  await seedDatabase();

  return app.listen(config.port, () => {
    logger.info(`🚀 VERITY ATS Server running at http://localhost:${config.port}`);
    logger.info(`📊 Health check: http://localhost:${config.port}/health`);
    logger.info(`🤖 AWS Bedrock Model Engine: ${config.aws.bedrock.modelId}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('Fatal startup error:', err);
  });
}
