import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Job,
  Capability,
  CapabilityRelationship,
  JobCapabilityModel,
  CapabilityImportance,
  ProficiencyLevel,
  EvaluationMethod,
  CapabilityCategory,
  RelationshipType,
  RecruiterModification,
} from '@ats/shared';
import { aiProvider } from './bedrock.provider';
import { atsStore } from '../../models/store';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/errors';

// Strict Zod Schemas
export const CapabilitySchema = z.object({
  name: z.string().min(2),
  category: z.enum([
    'languages_frameworks',
    'systems_architecture',
    'data_storage',
    'cloud_devops',
    'testing_quality',
    'domain_knowledge',
    'soft_skills',
  ]),
  description: z.string().min(10),
  importance: z.enum(['critical', 'high', 'medium', 'low']),
  expectedProficiency: z.enum(['foundational', 'intermediate', 'advanced', 'expert']),
  evaluationMethods: z.array(
    z.enum([
      'coding_challenge',
      'technical_qa',
      'debugging_scenario',
      'system_design',
      'transfer_test',
      'code_review',
      'behavioral_interview',
    ])
  ),
  dependencies: z.array(z.string()).default([]),
  transferableConcepts: z.array(z.string()).default([]),
  evidenceRequirements: z.array(z.string()).default([]),
  freshnessRequirements: z.string().default('Active within past 24 months'),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const CapabilityRelationshipSchema = z.object({
  sourceName: z.string().min(2),
  targetName: z.string().min(2),
  relationshipType: z.enum(['prerequisite_for', 'builds_upon', 'transfers_to', 'frequently_paired_with']),
  strength: z.number().min(0).max(1).default(0.8),
  explanation: z.string().min(5),
});

export const CompiledCapabilityModelSchema = z.object({
  capabilities: z.array(CapabilitySchema).min(1),
  relationships: z.array(CapabilityRelationshipSchema).default([]),
  summary: z.string().optional(),
});

export class CapabilityCompilerService {
  /**
   * Compiles a Job Description into a structured capability model and capability graph
   */
  async compileJobToCapabilityModel(
    job: Job,
    organizationId: string,
    requestedBy: string
  ): Promise<JobCapabilityModel> {
    const start = Date.now();
    logger.info(`[Capability Compiler] Compiling capability model for job ${job.id} (${job.title})...`);

    // 1. Construct multi-dimensional prompt
    const prompt = this.buildCompilerPrompt(job);

    // 2. Invoke decoupled AI Provider with strict Zod schema validation
    const aiResponse = await aiProvider.generateStructured(prompt, CompiledCapabilityModelSchema, {
      temperature: 0.2,
      modelName: 'anthropic.claude-3-5-sonnet-v2',
      systemPrompt:
        'You are an expert Principal Talent & Capability Architect. Transform job descriptions into multi-dimensional capability models with dependency graphs rather than flat keywords.',
    });

    const compiledData = aiResponse.data;

    // 3. Normalize & assign persistent UUIDs to capabilities
    const capabilities: Capability[] = compiledData.capabilities.map((c) => ({
      id: uuidv4(),
      name: c.name,
      category: c.category,
      description: c.description,
      importance: c.importance,
      expectedProficiency: c.expectedProficiency,
      evaluationMethods: c.evaluationMethods,
      dependencies: c.dependencies || [],
      transferableConcepts: c.transferableConcepts || [],
      evidenceRequirements: c.evidenceRequirements || [],
      freshnessRequirements: c.freshnessRequirements || 'Active within past 24 months',
      confidenceScore: c.confidenceScore,
    }));

    // 4. Normalize relationships
    const relationships: CapabilityRelationship[] = (compiledData.relationships || []).map((r) => ({
      id: uuidv4(),
      sourceName: r.sourceName,
      targetName: r.targetName,
      relationshipType: r.relationshipType,
      strength: r.strength ?? 0.8,
      explanation: r.explanation,
    }));

    // 5. Create versioned JobCapabilityModel record
    const capabilityModel: JobCapabilityModel = {
      id: uuidv4(),
      jobId: job.id,
      organizationId,
      version: 1,
      status: 'pending_review',
      capabilities,
      relationships,
      originalJdSnapshot: {
        title: job.title,
        description: job.description,
        requirements: job.requirements || [],
        requiredSkills: job.requiredSkills || [],
        experienceLevel: job.experienceLevel,
      },
      aiProviderUsed: aiResponse.providerName,
      modelName: aiResponse.modelName,
      compilationDurationMs: Date.now() - start,
      modifications: [
        {
          id: uuidv4(),
          action: 'add_capability',
          details: `AI Initial Generation of ${capabilities.length} capabilities using ${aiResponse.modelName}`,
          modifiedBy: 'AI Capability Compiler',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save capability model in ATS store
    await atsStore.saveJobCapabilityModel(capabilityModel);

    // Update Job with reference
    await atsStore.updateJob(
      job.id,
      { hasCapabilityModel: true, capabilityModelId: capabilityModel.id },
      organizationId
    );

    // Audit Log
    await atsStore.logAuditEvent({
      userId: requestedBy,
      organizationId,
      action: 'capability_model.compile',
      resource: 'capability_model',
      resourceId: capabilityModel.id,
      status: 'success',
      metadata: {
        jobId: job.id,
        capabilitiesCount: capabilities.length,
        relationshipsCount: relationships.length,
        durationMs: capabilityModel.compilationDurationMs,
      },
    });

    return capabilityModel;
  }

  /**
   * Recruiter updates/customizes capabilities within a job model
   */
  async updateCapabilityModel(
    jobId: string,
    organizationId: string,
    capabilities: Capability[],
    relationships: CapabilityRelationship[],
    modifiedBy: string,
    modificationSummary?: string
  ): Promise<JobCapabilityModel> {
    const existing = await atsStore.getJobCapabilityModelByJobId(jobId, organizationId);
    if (!existing) {
      throw ApiError.notFound('Capability model not found for this job requisition');
    }

    const newVersion = existing.version + 1;
    const modificationRecord: RecruiterModification = {
      id: uuidv4(),
      action: 'edit_capability',
      details: modificationSummary || `Recruiter modified capabilities (v${newVersion})`,
      modifiedBy,
      timestamp: new Date().toISOString(),
    };

    const updatedModel: JobCapabilityModel = {
      ...existing,
      version: newVersion,
      status: 'customized',
      capabilities,
      relationships,
      modifications: [...existing.modifications, modificationRecord],
      updatedAt: new Date().toISOString(),
    };

    await atsStore.saveJobCapabilityModel(updatedModel);

    await atsStore.logAuditEvent({
      userId: modifiedBy,
      organizationId,
      action: 'capability_model.update',
      resource: 'capability_model',
      resourceId: updatedModel.id,
      status: 'success',
      metadata: { version: newVersion, modificationDetails: modificationRecord.details },
    });

    return updatedModel;
  }

  /**
   * Recruiter explicitly approves capability model for candidate screening & proof-of-ability
   */
  async approveCapabilityModel(
    jobId: string,
    organizationId: string,
    approvedBy: string
  ): Promise<JobCapabilityModel> {
    const existing = await atsStore.getJobCapabilityModelByJobId(jobId, organizationId);
    if (!existing) {
      throw ApiError.notFound('Capability model not found for this job requisition');
    }

    const updatedModel: JobCapabilityModel = {
      ...existing,
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      modifications: [
        ...existing.modifications,
        {
          id: uuidv4(),
          action: 'approve',
          details: `Recruiter approved capability model for live evaluation`,
          modifiedBy: approvedBy,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    await atsStore.saveJobCapabilityModel(updatedModel);

    await atsStore.logAuditEvent({
      userId: approvedBy,
      organizationId,
      action: 'capability_model.approve',
      resource: 'capability_model',
      resourceId: updatedModel.id,
      status: 'success',
    });

    return updatedModel;
  }

  private buildCompilerPrompt(job: Job): string {
    return `
JOB TITLE: ${job.title}
DEPARTMENT: ${job.department}
EXPERIENCE LEVEL: ${job.experienceLevel} (${job.minYearsExperience}+ years)
LOCATION: ${job.location}

DESCRIPTION:
${job.description}

RESPONSIBILITIES:
${job.responsibilities.map((r) => `- ${r}`).join('\n')}

REQUIREMENTS & SKILLS:
Required Skills: ${job.requiredSkills.join(', ')}
Preferred Skills: ${job.preferredSkills.join(', ')}
Requirements:
${job.requirements.map((req) => `- ${req}`).join('\n')}

INSTRUCTIONS:
Deconstruct this job description into high-fidelity capabilities. Do not output simple keyword buzzwords.
For each capability, determine:
1. Category ('languages_frameworks', 'systems_architecture', 'data_storage', 'cloud_devops', 'testing_quality', 'domain_knowledge', 'soft_skills')
2. Importance ('critical', 'high', 'medium', 'low')
3. Expected Proficiency Level ('foundational', 'intermediate', 'advanced', 'expert')
4. Suggested Evaluation Methods (coding_challenge, technical_qa, debugging_scenario, system_design, transfer_test, code_review, behavioral_interview)
5. Prerequisite / Dependency capabilities
6. Transferable concepts (e.g. C# -> Java, React -> Vue)
7. Evidence requirements and Freshness constraints.
8. Establish directed relationship edges between capabilities (prerequisite_for, builds_upon, transfers_to, frequently_paired_with).
`;
  }
}

export const capabilityCompiler = new CapabilityCompilerService();
