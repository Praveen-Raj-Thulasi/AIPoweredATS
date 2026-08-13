import { z } from 'zod';
import { IAIProvider, AIProviderOptions, StructuredAIResponse } from './ai-provider.interface';
import { logger } from '../../utils/logger';

export class DevelopmentAIProvider implements IAIProvider {
  name = 'DevelopmentAIProvider';

  async generateCompletion(prompt: string, options?: AIProviderOptions): Promise<string> {
    return `Simulated LLM completion for prompt length ${prompt.length}`;
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIProviderOptions
  ): Promise<StructuredAIResponse<T>> {
    const start = Date.now();
    logger.info(`[AI Provider: Dev] Generating structured completion for prompt length ${prompt.length}...`);

    // Extract key technologies and concepts from prompt text
    const lower = prompt.toLowerCase();

    const capabilities: any[] = [];
    const relationships: any[] = [];

    const addCapability = (
      name: string,
      category: string,
      importance: string,
      proficiency: string,
      methods: string[],
      deps: string[],
      transfer: string[],
      evidence: string[],
      freshness: string,
      desc: string
    ) => {
      capabilities.push({
        name,
        category,
        description: desc,
        importance,
        expectedProficiency: proficiency,
        evaluationMethods: methods,
        dependencies: deps,
        transferableConcepts: transfer,
        evidenceRequirements: evidence,
        freshnessRequirements: freshness,
        confidenceScore: 0.95,
      });
    };

    // 1. Language / Framework Detection
    if (lower.includes('java') || lower.includes('spring')) {
      addCapability(
        'Java (JVM Core)',
        'languages_frameworks',
        'critical',
        'advanced',
        ['coding_challenge', 'technical_qa', 'debugging_scenario', 'transfer_test'],
        [],
        ['C# / .NET', 'Kotlin', 'Object-Oriented Design', 'JVM Memory Model'],
        ['Production experience building multithreaded backend services', 'Experience with concurrency and memory profiling'],
        'Active usage within the past 12-24 months',
        'Deep mastery of modern Java (17+), concurrency, garbage collection tuning, and JVM internals.'
      );

      addCapability(
        'Spring Boot & Microservices',
        'languages_frameworks',
        'critical',
        'advanced',
        ['system_design', 'technical_qa', 'code_review'],
        ['Java (JVM Core)'],
        ['Micronaut', 'Quarkus', 'ASP.NET Core', 'Express.js'],
        ['Designed and deployed production Spring Boot RESTful microservices', 'Experience with Spring Security and Data JPA'],
        'Active usage within the past 18 months',
        'Building enterprise-scale REST/GraphQL services, dependency injection, and JPA repository abstractions.'
      );

      relationships.push({
        sourceName: 'Java (JVM Core)',
        targetName: 'Spring Boot & Microservices',
        relationshipType: 'prerequisite_for',
        strength: 0.95,
        explanation: 'Deep Java fundamentals are essential before designing robust Spring Boot microservices.',
      });
    }

    if (lower.includes('typescript') || lower.includes('javascript') || lower.includes('node') || lower.includes('react')) {
      addCapability(
        'TypeScript & Type Systems',
        'languages_frameworks',
        'critical',
        'advanced',
        ['coding_challenge', 'debugging_scenario', 'code_review'],
        [],
        ['JavaScript ESNext', 'Flow', 'Rust Type System', 'C# Generics'],
        ['Demonstrated experience authoring complex generic types, conditional types, and strict type guards in production'],
        'Active usage within the past 12 months',
        'Advanced static typing, generic abstractions, AST transformations, and strict compiler configurations.'
      );

      if (lower.includes('react') || lower.includes('frontend') || lower.includes('full-stack') || lower.includes('full stack')) {
        addCapability(
          'React Architecture & State Lifecycle',
          'languages_frameworks',
          'high',
          'advanced',
          ['coding_challenge', 'system_design', 'debugging_scenario'],
          ['TypeScript & Type Systems'],
          ['Vue.js', 'SolidJS', 'Svelte', 'Component-Driven Architecture'],
          ['Shipped production single-page applications with concurrent rendering and custom hooks architecture'],
          'Active usage within the past 12 months',
          'Component lifecycle optimization, custom hook composition, virtual DOM reconciliation, and state isolation.'
        );

        relationships.push({
          sourceName: 'TypeScript & Type Systems',
          targetName: 'React Architecture & State Lifecycle',
          relationshipType: 'prerequisite_for',
          strength: 0.9,
          explanation: 'Strict TypeScript patterns form the foundation for robust enterprise React component libraries.',
        });
      }

      if (lower.includes('node') || lower.includes('backend') || lower.includes('full-stack') || lower.includes('full stack')) {
        addCapability(
          'Node.js Asynchronous Runtime',
          'languages_frameworks',
          'critical',
          'advanced',
          ['technical_qa', 'debugging_scenario', 'system_design'],
          ['TypeScript & Type Systems'],
          ['Go concurrency', 'Python asyncio', 'Event-Driven Architecture'],
          ['Engineered high-concurrency Node.js APIs handling asynchronous I/O and stream processing'],
          'Active usage within the past 12 months',
          'Event loop mechanics, stream processing, worker threads, and backpressure management.'
        );

        relationships.push({
          sourceName: 'TypeScript & Type Systems',
          targetName: 'Node.js Asynchronous Runtime',
          relationshipType: 'builds_upon',
          strength: 0.88,
          explanation: 'TypeScript builds upon the Node.js runtime to create type-safe backend microservices.',
        });
      }
    }

    if (lower.includes('python') || lower.includes('ml') || lower.includes('ai') || lower.includes('bedrock')) {
      addCapability(
        'Python Core & Data Structures',
        'languages_frameworks',
        'critical',
        'advanced',
        ['coding_challenge', 'technical_qa', 'transfer_test'],
        [],
        ['Modern scripting', 'Ruby', 'R'],
        ['Authored modular Python packages with type hints, asyncio, and unit testing suites'],
        'Active usage within the past 12 months',
        'Idiomatic Python (3.10+), generators, async/await, memory efficiency, and packaging.'
      );

      addCapability(
        'Generative AI & LLM Orchestration',
        'domain_knowledge',
        'critical',
        'advanced',
        ['system_design', 'technical_qa', 'debugging_scenario'],
        ['Python Core & Data Structures'],
        ['NLP Pipelines', 'Vector Embeddings', 'RAG Architectures', 'AWS Bedrock'],
        ['Implemented RAG retrieval architectures, prompt template chains, and evaluation harnesses'],
        'Active usage within the past 12 months',
        'LLM pipeline construction, semantic routing, vector embeddings, token budget management, and guardrails.'
      );

      relationships.push({
        sourceName: 'Python Core & Data Structures',
        targetName: 'Generative AI & LLM Orchestration',
        relationshipType: 'prerequisite_for',
        strength: 0.92,
        explanation: 'Solid Python foundations are required to construct resilient LLM orchestration and evaluation pipelines.',
      });
    }

    // 2. Systems Architecture & Storage
    addCapability(
      'Distributed Systems & API Design',
      'systems_architecture',
      'high',
      'advanced',
      ['system_design', 'technical_qa', 'transfer_test'],
      [],
      ['Microservices', 'Event-Driven Architecture', 'CAP Theorem', 'Idempotency'],
      ['Led architecture reviews and created RFCs for distributed service boundaries'],
      'Active usage within the past 24 months',
      'Designing fault-tolerant, horizontally scalable APIs with circuit breaking, rate limiting, and event brokers.'
    );

    addCapability(
      'Database Modeling & Index Optimization',
      'data_storage',
      'high',
      'intermediate',
      ['technical_qa', 'debugging_scenario', 'coding_challenge'],
      [],
      ['PostgreSQL', 'MongoDB', 'Query Planning', 'ACID Transactions'],
      ['Schema design with compound indexes and query optimization for high-read throughput'],
      'Active usage within the past 24 months',
      'Data normalization/denormalization trade-offs, compound index selection, and transaction isolation levels.'
    );

    // 3. Cloud & DevOps
    addCapability(
      'Cloud Platform & Containerization',
      'cloud_devops',
      'high',
      'intermediate',
      ['system_design', 'technical_qa'],
      [],
      ['AWS Ecosystem', 'Docker', 'Kubernetes', 'CI/CD Pipelines'],
      ['Deployed containerized workloads to cloud clusters with automated build and deployment pipelines'],
      'Active usage within the past 24 months',
      'Containerizing services with multi-stage Docker builds and managing cloud infrastructure primitives.'
    );

    // 4. Soft Skills & Engineering Practices
    addCapability(
      'Technical Communication & Code Review Rigor',
      'soft_skills',
      'medium',
      'advanced',
      ['behavioral_interview', 'code_review'],
      [],
      ['Constructive Feedback', 'Design Documentation', 'Cross-functional Collaboration'],
      ['Demonstrated history of mentoring peers and maintaining rigorous pull request quality standards'],
      'Continuous practice',
      'Articulating complex architectural trade-offs to stakeholders and elevating team engineering standards.'
    );

    relationships.push({
      sourceName: 'Database Modeling & Index Optimization',
      targetName: 'Distributed Systems & API Design',
      relationshipType: 'frequently_paired_with',
      strength: 0.85,
      explanation: 'Effective distributed systems require resilient data storage layers and optimized query patterns.',
    });

    relationships.push({
      sourceName: 'Cloud Platform & Containerization',
      targetName: 'Distributed Systems & API Design',
      relationshipType: 'builds_upon',
      strength: 0.88,
      explanation: 'Microservices and distributed APIs run on top of containerized cloud infrastructure.',
    });

    const candidateResult: any = {
      capabilities,
      relationships,
      summary: `Compiled ${capabilities.length} structured capabilities and ${relationships.length} relational dependency edges from the job specification.`,
    };

    // Strict validation against input schema
    const parsed = schema.parse(candidateResult);
    const durationMs = Date.now() - start;

    return {
      data: parsed,
      rawResponse: JSON.stringify(candidateResult, null, 2),
      modelName: options?.modelName || 'anthropic.claude-3-5-sonnet-v2-dev',
      providerName: this.name,
      tokensUsed: 1250,
      durationMs,
    };
  }
}
