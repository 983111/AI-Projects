export interface Scholarship {
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string[];
  location: string;
  // RAG-specific fields
  matchScore?: number;
  matchReasons?: string[];
  tags?: string[];
}

export interface SearchParams {
  originCountry: string;
  studyLevel: string;
  fieldOfStudy: string;
  targetRegion: string;
  gpa?: string;
  sat?: string;
  ielts?: string;
  toefl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  scholarships: Scholarship[];
  rawText?: string;
  sources?: GroundingSource[];
  advisorNote?: string | null;     // optional Gemini augmentation
  totalFound?: number;
  meta?: {
    engine: string;
    geminiAugmented: boolean;
  };
}
