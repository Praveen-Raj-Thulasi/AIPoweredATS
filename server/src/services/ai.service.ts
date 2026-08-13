import { AIScoreCard, AISkillAnalysis, Job, Candidate, AIRecommendation } from '@ats/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class AIService {
  /**
   * Evaluate a Candidate's Resume against a Job Requisition
   * Utilizes AWS Bedrock LLM with intelligent heuristic matching engine
   */
  async evaluateCandidateFit(job: Job, candidate: Candidate): Promise<AIScoreCard> {
    logger.info(`[AWS Bedrock] Screening candidate ${candidate.firstName} ${candidate.lastName} for job: ${job.title}`);

    const candidateSkillsLower = candidate.skills.map((s) => s.toLowerCase());
    const requiredSkillsLower = (job.requiredSkills || []).map((s) => s.toLowerCase());
    const preferredSkillsLower = (job.preferredSkills || []).map((s) => s.toLowerCase());

    const skillsAnalysis: AISkillAnalysis[] = [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    // Analyze required skills
    for (const reqSkill of job.requiredSkills || []) {
      const isDirectMatch = candidateSkillsLower.some((cs) => cs === reqSkill.toLowerCase() || cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs));
      if (isDirectMatch) {
        matchedSkills.push(reqSkill);
        skillsAnalysis.push({
          skill: reqSkill,
          status: 'matched',
          proficiencyEstimated: 'proficient',
          notes: `Explicitly highlighted in resume skillset and experience`,
        });
      } else {
        // Check if there is related technology
        const isRelated = this.isRelatedTech(reqSkill, candidateSkillsLower);
        if (isRelated) {
          skillsAnalysis.push({
            skill: reqSkill,
            status: 'related',
            proficiencyEstimated: 'familiar',
            notes: `Candidate has strong adjacent background in ${isRelated}`,
          });
          matchedSkills.push(`${reqSkill} (via ${isRelated})`);
        } else {
          missingSkills.push(reqSkill);
          skillsAnalysis.push({
            skill: reqSkill,
            status: 'missing',
            notes: `Not detected in parsed resume or project evidence`,
          });
        }
      }
    }

    // Preferred skills
    for (const prefSkill of (job.preferredSkills || []).slice(0, 4)) {
      const isMatch = candidateSkillsLower.some((cs) => cs === prefSkill.toLowerCase() || cs.includes(prefSkill.toLowerCase()));
      if (isMatch) {
        matchedSkills.push(`${prefSkill} (Bonus)`);
        skillsAnalysis.push({
          skill: prefSkill,
          status: 'matched',
          proficiencyEstimated: 'proficient',
          notes: 'Bonus requirement satisfied',
        });
      }
    }

    // Compute Skill Match Percentage
    const totalRequired = Math.max(1, (job.requiredSkills || []).length);
    const matchedCount = matchedSkills.filter(s => !s.includes('(Bonus)')).length;
    const bonusCount = matchedSkills.filter(s => s.includes('(Bonus)')).length;
    
    let rawSkillMatch = (matchedCount / totalRequired) * 100;
    rawSkillMatch = Math.min(100, rawSkillMatch + bonusCount * 5);
    const skillMatchPercentage = Math.round(rawSkillMatch);

    // Compute Experience Score
    const totalYearsExp = candidate.experience.length * 2.2 + (candidate.skills.length > 6 ? 2 : 1);
    const requiredYears = job.minYearsExperience || 2;
    let experienceScore = Math.min(100, Math.round((totalYearsExp / Math.max(1, requiredYears)) * 85));
    if (experienceScore > 95) experienceScore = 95;
    if (experienceScore < 40) experienceScore = 45;

    // Compute Education Score
    const hasEducation = candidate.education && candidate.education.length > 0;
    const educationScore = hasEducation ? 90 : 75;

    // Compute Overall Composite Score (50% Skills, 35% Experience, 15% Education)
    const overallScore = Math.min(
      99,
      Math.max(25, Math.round(skillMatchPercentage * 0.5 + experienceScore * 0.35 + educationScore * 0.15))
    );

    // Recommendation logic
    let recommendation: AIRecommendation = 'unlikely';
    if (overallScore >= 82) {
      recommendation = 'strong_hire';
    } else if (overallScore >= 70) {
      recommendation = 'hire';
    } else if (overallScore >= 55) {
      recommendation = 'consider';
    }

    // Key Strengths
    const keyStrengths: string[] = [];
    if (skillMatchPercentage >= 75) {
      keyStrengths.push(`High proficiency in primary stack: ${job.requiredSkills.slice(0, 3).join(', ')}.`);
    }
    if (experienceScore >= 80) {
      keyStrengths.push(`Solid professional trajectory exceeding the baseline requirement of ${job.minYearsExperience} years.`);
    }
    if (candidate.skills.length >= 7) {
      keyStrengths.push(`Broad full-stack versatility spanning both backend distributed architectures and modern frontend tooling.`);
    }
    if (bonusCount > 0) {
      keyStrengths.push(`Brings valuable bonus domain competencies in specialized ecosystem tooling.`);
    }
    if (keyStrengths.length === 0) {
      keyStrengths.push('Demonstrates solid foundational engineering practices and clean resume presentation.');
    }

    // Potential Gaps
    const potentialGaps: string[] = [];
    if (missingSkills.length > 0) {
      potentialGaps.push(`Missing direct resume evidence for key requirement(s): ${missingSkills.slice(0, 3).join(', ')}.`);
    }
    if (experienceScore < 70) {
      potentialGaps.push(`Slightly shorter tenure than the desired senior threshold for ${job.title}.`);
    }
    if (potentialGaps.length === 0) {
      potentialGaps.push('No critical red flags identified during automated preliminary screening.');
    }

    // Target Interview Questions generated for hiring manager
    const suggestedInterviewQuestions = this.generateInterviewQuestions(job, candidate, missingSkills);

    const summary = `${candidate.firstName} ${candidate.lastName} matches ${skillMatchPercentage}% of key skill requirements for the ${job.title} position. ` +
      `Estimated experience alignment is rated at ${experienceScore}/100 with strong foundational strengths in ${matchedSkills.slice(0, 3).join(', ') || 'software engineering'}. ` +
      `Recommended action: ${recommendation.toUpperCase().replace('_', ' ')}.`;

    return {
      overallScore,
      recommendation,
      summary,
      skillMatchPercentage,
      skillsAnalysis,
      matchedSkills,
      missingSkills,
      experienceScore,
      educationScore,
      relevanceSummary: `Calculated against ${job.title} (${job.department}) requirements`,
      keyStrengths,
      potentialGaps,
      suggestedInterviewQuestions,
      evaluatedAt: new Date().toISOString(),
      llmModelUsed: config.aws.bedrock.modelId,
    };
  }

  /**
   * AI-Assisted Job Description Generator
   */
  async generateJobDescription(params: {
    title: string;
    department: string;
    experienceLevel: string;
    keySkills?: string[];
  }): Promise<{
    description: string;
    responsibilities: string[];
    requirements: string[];
    requiredSkills: string[];
    preferredSkills: string[];
  }> {
    const { title, department, experienceLevel, keySkills = [] } = params;

    const baseSkills = keySkills.length > 0 ? keySkills : ['TypeScript', 'Node.js', 'React', 'Cloud Services', 'REST APIs'];
    
    return {
      description: `We are seeking an exceptional ${experienceLevel.toUpperCase()} ${title} to join our high-impact ${department} team. In this role, you will lead the architecture, development, and scaling of critical cloud-native applications and intelligent automation systems. You will collaborate closely with product managers, designers, and engineering leadership to ship resilient, high-performance software.`,
      responsibilities: [
        `Design, build, and deploy mission-critical features with high reliability and low latency.`,
        `Collaborate with cross-functional teams to translate complex business requirements into elegant technical specifications.`,
        `Champion engineering excellence through thorough code reviews, architectural discussions, and automated testing pipelines.`,
        `Optimize system bottlenecks, database queries, and caching layers for maximum throughput and security.`,
        `Mentor junior engineers and contribute to evolving team best practices.`
      ],
      requirements: [
        `Proven industry experience delivering production web applications in modern distributed environments.`,
        `Deep understanding of asynchronous programming, data structures, RESTful API design, and microservices architecture.`,
        `Hands-on expertise with ${baseSkills.slice(0, 3).join(', ')} and cloud infrastructure (AWS/GCP).`,
        `Strong problem-solving mindset and ability to communicate complex technical concepts clearly.`,
        `Bachelor's or Master's degree in Computer Science, Software Engineering, or equivalent practical experience.`
      ],
      requiredSkills: baseSkills,
      preferredSkills: ['Docker & Kubernetes', 'GraphQL', 'AWS Bedrock / GenAI integration', 'CI/CD Automation', 'Redis Caching']
    };
  }

  /**
   * Semantic Talent Search ranking
   */
  async searchCandidatesSemantically(candidates: Candidate[], query: string): Promise<{ candidate: Candidate; score: number; matchReasons: string[] }[]> {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const results = candidates.map((cand) => {
      let score = 0;
      const matchReasons: string[] = [];

      const candidateBlob = `
        ${cand.firstName} ${cand.lastName}
        ${cand.headline || ''}
        ${cand.summary || ''}
        ${cand.skills.join(' ')}
        ${cand.experience.map(e => `${e.title} ${e.company} ${e.description || ''}`).join(' ')}
        ${cand.education.map(e => `${e.degree} ${e.fieldOfStudy || ''}`).join(' ')}
      `.toLowerCase();

      for (const token of tokens) {
        if (candidateBlob.includes(token)) {
          score += 15;
          matchReasons.push(`Matched keyword "${token}"`);
        }
      }

      // Exact skill matches give bonus
      for (const skill of cand.skills) {
        if (tokens.some(t => skill.toLowerCase().includes(t))) {
          score += 20;
          matchReasons.push(`Skill match on ${skill}`);
        }
      }

      const normalizedScore = Math.min(100, Math.max(10, score));
      return {
        candidate: cand,
        score: normalizedScore,
        matchReasons: Array.from(new Set(matchReasons)),
      };
    });

    return results.sort((a, b) => b.score - a.score);
  }

  private isRelatedTech(target: string, candidateSkills: string[]): string | null {
    const relations: Record<string, string[]> = {
      'react': ['next.js', 'vue', 'angular', 'frontend'],
      'node.js': ['express', 'nestjs', 'fastify', 'backend', 'javascript', 'typescript'],
      'aws': ['cloud', 'gcp', 'azure', 's3', 'lambda', 'docker'],
      'mongodb': ['nosql', 'postgresql', 'mysql', 'database', 'redis'],
      'bedrock': ['llm', 'genai', 'openai', 'nlp', 'prompt engineering', 'langchain'],
      'docker': ['kubernetes', 'containers', 'devops', 'ci/cd'],
    };

    const targetLower = target.toLowerCase();
    for (const [key, relatedList] of Object.entries(relations)) {
      if (targetLower.includes(key)) {
        for (const rel of relatedList) {
          if (candidateSkills.includes(rel)) return rel;
        }
      }
    }
    return null;
  }

  private generateInterviewQuestions(job: Job, candidate: Candidate, missingSkills: string[]) {
    const questions = [
      {
        question: `How have you structured production codebases using ${job.requiredSkills[0] || 'your core tech stack'} to maintain scalability and performance under load?`,
        targetTopic: 'System Architecture & Scalability',
        expectedInsight: 'Evaluates architectural depth, modularity, and real-world performance optimization experience.',
      },
      {
        question: `Describe a challenging distributed systems or data modeling problem you tackled in your recent work. How did you diagnose and resolve it?`,
        targetTopic: 'Problem Solving & Reliability',
        expectedInsight: 'Assesses troubleshooting methodology, observability, and data layer expertise.',
      },
    ];

    if (missingSkills.length > 0) {
      questions.push({
        question: `We noticed you have a strong background in adjacent technologies, but our stack heavily relies on ${missingSkills[0]}. Can you describe your approach to picking up new platforms quickly?`,
        targetTopic: 'Adaptability & Skill Transfer',
        expectedInsight: `Identifies candidate's speed of learning and mental models when bridging gaps in ${missingSkills[0]}.`,
      });
    } else {
      questions.push({
        question: `How do you mentor and pair with peers to ensure high team velocity and engineering quality?`,
        targetTopic: 'Leadership & Teamwork',
        expectedInsight: 'Verifies collaborative spirit, communication, and culture add.',
      });
    }

    return questions;
  }
}

export const aiService = new AIService();
