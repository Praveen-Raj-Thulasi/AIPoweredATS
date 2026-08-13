import { CandidateExperience, CandidateEducation } from '@ats/shared';

export interface ParsedResumeResult {
  rawText: string;
  extractedName?: { firstName: string; lastName: string };
  extractedEmail?: string;
  extractedPhone?: string;
  extractedSkills: string[];
  extractedExperience: CandidateExperience[];
  extractedEducation: CandidateEducation[];
  headline?: string;
  summary?: string;
  parsingStatus: 'completed' | 'failed';
  parserMetadata: {
    engine: string;
    version: string;
    parsedAt: string;
    durationMs: number;
    charCount: number;
  };
}

export interface IResumeParserService {
  parse(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedResumeResult>;
}
