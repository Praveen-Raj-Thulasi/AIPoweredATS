import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface CloudWatchMetricDatum {
  metricName: string;
  value: number;
  unit: 'Count' | 'Milliseconds' | 'Bytes' | 'None';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export class CloudWatchService {
  private namespace: string;

  constructor() {
    this.namespace = config.aws.cloudWatch.metricNamespace;
  }

  /**
   * Emits custom operational and security metric data to CloudWatch.
   */
  async putMetric(metric: CloudWatchMetricDatum): Promise<void> {
    const dimensions = metric.dimensions || {};
    const timestamp = metric.timestamp || new Date();

    // In live AWS execution:
    // const client = new CloudWatchClient({ region: config.aws.region });
    // await client.send(new PutMetricDataCommand({ Namespace: this.namespace, MetricData: [...] }));

    logger.debug(`[CloudWatch Metric] ${this.namespace} -> ${metric.metricName}: ${metric.value} ${metric.unit}`, {
      dimensions,
      timestamp: timestamp.toISOString(),
    });
  }

  /**
   * Tracks API response latency.
   */
  async trackLatency(route: string, method: string, durationMs: number, statusCode: number): Promise<void> {
    await this.putMetric({
      metricName: 'ApiLatency',
      value: durationMs,
      unit: 'Milliseconds',
      dimensions: {
        Route: route,
        Method: method,
        StatusCode: statusCode.toString(),
      },
    });

    if (statusCode >= 400) {
      await this.putMetric({
        metricName: 'ApiErrors',
        value: 1,
        unit: 'Count',
        dimensions: { Route: route, StatusCode: statusCode.toString() },
      });
    }
  }

  /**
   * Tracks AI token usage and cost metrics.
   */
  async trackAIUsage(modelId: string, inputTokens: number, outputTokens: number, costUsd: number): Promise<void> {
    await this.putMetric({
      metricName: 'AITokenUsage',
      value: inputTokens + outputTokens,
      unit: 'Count',
      dimensions: { ModelId: modelId },
    });

    await this.putMetric({
      metricName: 'AIEstimatedCostUsd',
      value: costUsd,
      unit: 'None',
      dimensions: { ModelId: modelId },
    });
  }

  /**
   * Tracks security audit events.
   */
  async trackSecurityEvent(eventType: 'auth_failure' | 'forbidden_access' | 'token_anomaly', details: Record<string, string>): Promise<void> {
    await this.putMetric({
      metricName: 'SecurityEventCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        EventType: eventType,
        ...details,
      },
    });
  }
}

export const cloudWatchService = new CloudWatchService();
