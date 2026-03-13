/**
 * Scholara RAG Engine
 * Pure TypeScript TF-IDF vectorizer + cosine similarity search
 * No external API needed for retrieval — fully offline-capable
 */

import scholarshipsData from "../data/scholarships.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  amountUSD: number;
  deadline: string;
  deadlineMonth: number;
  description: string;
  eligibility: string[];
  location: string;
  targetRegions: string[];
  allowedCountries: string[];
  studyLevels: string[];
  fieldsOfStudy: string[];
  minGPA: number | null;
  minIELTS: number | null;
  minTOEFL: number | null;
  minSAT: number | null;
  coversTuition: boolean;
  coverLiving: boolean;
  tags: string[];
}

export interface SearchQuery {
  originCountry: string;
  studyLevel: string;
  fieldOfStudy: string;
  targetRegion: string;
  gpa?: string;
  sat?: string;
  ielts?: string;
  toefl?: string;
}

export interface RankedScholarship extends Scholarship {
  score: number;
  matchReasons: string[];
}

// ─── TF-IDF Vectorizer ────────────────────────────────────────────────────────

/**
 * Tokenize text into normalized tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Build a document string from a scholarship for vectorization
 */
function scholarshipToDocument(s: Scholarship): string {
  return [
    s.name,
    s.provider,
    s.description,
    s.eligibility.join(" "),
    s.tags.join(" "),
    s.fieldsOfStudy.join(" "),
    s.studyLevels.join(" "),
    s.location,
    s.targetRegions.join(" "),
    s.allowedCountries.join(" "),
  ].join(" ");
}

/**
 * Build a query document string from user search params
 */
function queryToDocument(q: SearchQuery): string {
  return [
    q.originCountry,
    q.studyLevel,
    q.fieldOfStudy,
    q.targetRegion,
    // expand common synonyms
    q.studyLevel.includes("Bachelor") ? "undergraduate bachelor degree" : "",
    q.studyLevel.includes("Master") ? "graduate master postgraduate" : "",
    q.studyLevel.includes("PhD") ? "doctorate doctoral research phd" : "",
    q.targetRegion.includes("Europe") ? "europe european germany france netherlands sweden belgium" : "",
    q.targetRegion.includes("USA") ? "usa america united states fulbright" : "",
    q.targetRegion.includes("UK") ? "uk united kingdom british chevening cambridge" : "",
    q.targetRegion.includes("Asia") ? "asia korea japan china singapore" : "",
    q.targetRegion.includes("Australia") ? "australia new zealand" : "",
    q.fieldOfStudy,
  ]
    .join(" ")
    .trim();
}

// ─── TF-IDF Core ──────────────────────────────────────────────────────────────

type TermFrequency = Map<string, number>;
type IDF = Map<string, number>;

function termFrequency(tokens: string[]): TermFrequency {
  const tf: TermFrequency = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // normalize
  for (const [k, v] of tf) {
    tf.set(k, v / tokens.length);
  }
  return tf;
}

function buildIDF(documents: string[][]): IDF {
  const idf: IDF = new Map();
  const N = documents.length;
  const allTerms = new Set(documents.flat());
  for (const term of allTerms) {
    const docsWithTerm = documents.filter((d) => d.includes(term)).length;
    idf.set(term, Math.log((N + 1) / (docsWithTerm + 1)) + 1);
  }
  return idf;
}

function tfidfVector(tf: TermFrequency, idf: IDF): Map<string, number> {
  const vec = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) || 0;
    vec.set(term, tfVal * idfVal);
  }
  return vec;
}

function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, valA] of vecA) {
    const valB = vecB.get(term) || 0;
    dot += valA * valB;
  }
  for (const val of vecA.values()) normA += val * val;
  for (const val of vecB.values()) normB += val * val;

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Pre-built Index ──────────────────────────────────────────────────────────

const scholarships = scholarshipsData as Scholarship[];

// Build corpus once at startup
const corpus = scholarships.map((s) => tokenize(scholarshipToDocument(s)));
const idf = buildIDF(corpus);
const docVectors = corpus.map((tokens) => tfidfVector(termFrequency(tokens), idf));

// ─── Hard Filters ─────────────────────────────────────────────────────────────

function passesHardFilters(s: Scholarship, q: SearchQuery): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Country eligibility
  const countryMatch =
    s.allowedCountries.includes(q.originCountry) ||
    s.allowedCountries.includes("International");
  if (!countryMatch) return { passes: false, reasons: [] };

  // Study level match
  const levelMatch = s.studyLevels.includes(q.studyLevel);
  if (!levelMatch) return { passes: false, reasons: [] };

  // Region match (if user chose specific region)
  if (q.targetRegion !== "Anywhere globally") {
    const regionMatch = s.targetRegions.some(
      (r) =>
        r === q.targetRegion ||
        r === "Anywhere globally" ||
        q.targetRegion.includes(r) ||
        r.includes(q.targetRegion.split(" ")[0])
    );
    if (!regionMatch) return { passes: false, reasons: [] };
  }

  // GPA filter — only block if scholarship requires HIGHER GPA
  if (q.gpa && s.minGPA !== null) {
    const userGPA = parseFloat(q.gpa);
    if (!isNaN(userGPA) && userGPA < s.minGPA) {
      return { passes: false, reasons: [] };
    }
    if (!isNaN(userGPA)) reasons.push(`GPA ${userGPA} meets min ${s.minGPA}`);
  }

  // IELTS filter
  if (q.ielts && s.minIELTS !== null) {
    const userIELTS = parseFloat(q.ielts);
    if (!isNaN(userIELTS) && userIELTS < s.minIELTS) {
      return { passes: false, reasons: [] };
    }
    if (!isNaN(userIELTS)) reasons.push(`IELTS ${userIELTS} meets min ${s.minIELTS}`);
  }

  // TOEFL filter
  if (q.toefl && s.minTOEFL !== null) {
    const userTOEFL = parseInt(q.toefl);
    if (!isNaN(userTOEFL) && userTOEFL < s.minTOEFL) {
      return { passes: false, reasons: [] };
    }
    if (!isNaN(userTOEFL)) reasons.push(`TOEFL ${userTOEFL} meets min ${s.minTOEFL}`);
  }

  // SAT filter
  if (q.sat && s.minSAT !== null) {
    const userSAT = parseInt(q.sat);
    if (!isNaN(userSAT) && userSAT < s.minSAT) {
      return { passes: false, reasons: [] };
    }
  }

  // Add match reasons
  reasons.push(`Open to ${q.originCountry} citizens`);
  if (s.coversTuition) reasons.push("Covers tuition");
  if (s.coverLiving) reasons.push("Covers living expenses");
  reasons.push(s.location);

  return { passes: true, reasons };
}

// ─── Score Boosters ───────────────────────────────────────────────────────────

function getBoostScore(s: Scholarship, q: SearchQuery): number {
  let boost = 0;

  // Field of study exact match
  const field = q.fieldOfStudy.toLowerCase();
  if (s.fieldsOfStudy.some((f) => f.toLowerCase().includes(field) || field.includes(f.toLowerCase()))) {
    boost += 0.3;
  }
  if (s.fieldsOfStudy.includes("All fields")) boost += 0.1;

  // Full funding boost
  if (s.coversTuition && s.coverLiving) boost += 0.2;

  // Country specificity boost (scholarship specifically mentions their country)
  if (s.allowedCountries.includes(q.originCountry) && !s.allowedCountries.includes("International")) {
    boost += 0.15;
  }

  // Deadline urgency boost (upcoming deadlines)
  const currentMonth = new Date().getMonth() + 1;
  const monthsUntil = ((s.deadlineMonth - currentMonth + 12) % 12) || 12;
  if (monthsUntil <= 2) boost += 0.1; // urgent
  if (monthsUntil <= 4) boost += 0.05;

  // High value boost
  if (s.amountUSD >= 30000) boost += 0.1;
  if (s.amountUSD >= 50000) boost += 0.1;

  return boost;
}

// ─── Main Search Function ─────────────────────────────────────────────────────

export function searchScholarships(query: SearchQuery, topK: number = 20): RankedScholarship[] {
  // Build query vector
  const queryTokens = tokenize(queryToDocument(query));
  const queryTF = termFrequency(queryTokens);
  const queryVector = tfidfVector(queryTF, idf);

  const results: RankedScholarship[] = [];

  for (let i = 0; i < scholarships.length; i++) {
    const s = scholarships[i];
    const { passes, reasons } = passesHardFilters(s, query);
    if (!passes) continue;

    // TF-IDF cosine similarity
    const semanticScore = cosineSimilarity(queryVector, docVectors[i]);

    // Boost score
    const boostScore = getBoostScore(s, query);

    // Final score (weighted)
    const finalScore = semanticScore * 0.6 + boostScore * 0.4;

    results.push({
      ...s,
      score: finalScore,
      matchReasons: reasons,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

// ─── Result Formatter ─────────────────────────────────────────────────────────

export interface FormattedScholarship {
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string[];
  location: string;
  matchScore: number;
  matchReasons: string[];
  tags: string[];
}

export function formatResults(ranked: RankedScholarship[]): FormattedScholarship[] {
  return ranked.map((s) => ({
    name: s.name,
    provider: s.provider,
    amount: s.amount,
    deadline: s.deadline,
    description: s.description,
    eligibility: s.eligibility,
    location: s.location,
    matchScore: Math.round(s.score * 100),
    matchReasons: s.matchReasons,
    tags: s.tags,
  }));
}
