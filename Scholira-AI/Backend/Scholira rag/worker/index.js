/**
 * Scholara RAG Worker — index.js (logic only)
 * Scholarship data lives in scholarships.js — add new scholarships there.
 * Deploy with: wrangler deploy
 */

import { SCHOLARSHIPS, APPLICATION_URLS } from './scholarships.js';

// ── CORS Headers ───────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};


// ── Tokenizer ──────────────────────────────────────────────────────────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

// ── TF-IDF ────────────────────────────────────────────────────────────────────
function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  for (const k in tf) tf[k] = tf[k] / tokens.length;
  return tf;
}

function buildIDF(documents) {
  const idf = {};
  const N = documents.length;
  const allTerms = new Set(documents.flat());
  for (const term of allTerms) {
    const count = documents.filter((d) => d.includes(term)).length;
    idf[term] = Math.log((N + 1) / (count + 1)) + 1;
  }
  return idf;
}

function tfidfVector(tf, idf) {
  const vec = {};
  for (const term in tf) {
    vec[term] = tf[term] * (idf[term] || 0);
  }
  return vec;
}

function cosine(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const term in vecA) {
    dot += vecA[term] * (vecB[term] || 0);
  }
  for (const v of Object.values(vecA)) normA += v * v;
  for (const v of Object.values(vecB)) normB += v * v;
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Pre-build index at startup ─────────────────────────────────────────────────
function scholarshipToText(s) {
  return [s.name, s.provider, s.description, s.eligibility.join(" "),
    s.tags.join(" "), s.fieldsOfStudy.join(" "), s.studyLevels.join(" "),
    s.location, s.targetRegions.join(" "), s.allowedCountries.join(" ")
  ].join(" ");
}

const corpus = SCHOLARSHIPS.map((s) => tokenize(scholarshipToText(s)));
const IDF = buildIDF(corpus);
const DOC_VECTORS = corpus.map((tokens) => tfidfVector(termFrequency(tokens), IDF));

// ── Normalizers ────────────────────────────────────────────────────────────────

/**
 * Normalize a user-supplied study level string to one of the canonical DB values.
 * Returns an array of matching canonical levels so we can accept loose inputs.
 */
function normalizeStudyLevel(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();

  if (s.includes("high school") || s.includes("secondary") || s === "hs") {
    return ["High School"];
  }
  if (
    s.includes("bachelor") || s.includes("undergrad") || s === "ba" ||
    s === "bs" || s === "b.sc" || s === "b.a" || s === "ug"
  ) {
    return ["Bachelor's Degree"];
  }
  if (
    s.includes("master") || s.includes("msc") || s.includes("mba") ||
    s === "ma" || s === "ms" || s === "postgrad" || s.includes("postgraduate") ||
    s.includes("graduate") || s === "m.sc" || s === "m.a"
  ) {
    return ["Master's Degree"];
  }
  if (
    s.includes("phd") || s.includes("ph.d") || s.includes("doctor") ||
    s.includes("doctoral") || s === "d.phil"
  ) {
    return ["PhD"];
  }
  // Fallback: return the raw string as-is (maybe it already matches)
  return [raw];
}

/**
 * Normalize country name for comparison (case-insensitive, trim).
 */
function normalizeCountry(raw) {
  return (raw || "").trim().toLowerCase();
}

// ── Hard Filter ────────────────────────────────────────────────────────────────
function hardFilter(s, q) {
  // ── Country check (case-insensitive) ──────────────────────────────────────
  const qCountry = normalizeCountry(q.originCountry);
  const countryOk =
    s.allowedCountries.some((c) => normalizeCountry(c) === qCountry) ||
    s.allowedCountries.some((c) => normalizeCountry(c) === "international");
  if (!countryOk) return false;

  // ── Study level check (fuzzy) ──────────────────────────────────────────────
  const normalizedLevels = normalizeStudyLevel(q.studyLevel);
  if (normalizedLevels) {
    const levelOk = normalizedLevels.some((nl) => s.studyLevels.includes(nl));
    if (!levelOk) return false;
  }

  // ── Region check (flexible) ────────────────────────────────────────────────
  // "Globally" / "Anywhere globally" / empty = show ALL scholarships (no region filter)
  const qRegion = (q.targetRegion || "").toLowerCase().trim();
  const isGlobalQuery =
    !qRegion ||
    qRegion === "anywhere globally" ||
    qRegion === "global" ||
    qRegion === "globally" ||
    qRegion === "worldwide" ||
    qRegion === "all" ||
    qRegion === "any";

  if (!isGlobalQuery) {
    // Map common region aliases to canonical names used in DB
    const regionAliasMap = {
      "usa": "usa & canada",
      "us": "usa & canada",
      "united states": "usa & canada",
      "america": "usa & canada",
      "canada": "usa & canada",
      "north america": "usa & canada",
      "uk": "uk",
      "britain": "uk",
      "united kingdom": "uk",
      "england": "uk",
      "europe": "europe",
      "european": "europe",
      "eu": "europe",
      "asia": "asia",
      "asian": "asia",
      "australia": "australia & nz",
      "new zealand": "australia & nz",
      "oceania": "australia & nz",
      "australia & nz": "australia & nz",
    };
    const normalizedQRegion = regionAliasMap[qRegion] || qRegion;

    const regionOk = s.targetRegions.some((r) => {
      const rLow = r.toLowerCase().trim();
      // Scholarships tagged "Anywhere globally" always pass
      if (rLow === "anywhere globally") return true;
      // Exact match after alias mapping
      const rMapped = regionAliasMap[rLow] || rLow;
      if (rMapped === normalizedQRegion) return true;
      // Partial match (e.g. "usa & canada" contains "usa")
      if (rMapped.includes(normalizedQRegion) || normalizedQRegion.includes(rMapped)) return true;
      return false;
    });
    if (!regionOk) return false;
  }
  // If isGlobalQuery === true, skip region filter entirely → all regions shown

  // ── Score checks (only filter if the user supplied a value AND it's below min) ──
  const gpa = parseFloat(q.gpa);
  if (!isNaN(gpa) && s.minGPA !== null && gpa < s.minGPA) return false;

  const ielts = parseFloat(q.ielts);
  if (!isNaN(ielts) && s.minIELTS !== null && ielts < s.minIELTS) return false;

  const toefl = parseInt(q.toefl);
  if (!isNaN(toefl) && s.minTOEFL !== null && toefl < s.minTOEFL) return false;

  const sat = parseInt(q.sat);
  if (!isNaN(sat) && s.minSAT !== null && sat < s.minSAT) return false;

  return true;
}

// ── Match Reasons ──────────────────────────────────────────────────────────────
function getReasons(s, q) {
  const reasons = [];
  reasons.push(`Open to ${q.originCountry} citizens`);
  if (s.coversTuition && s.coverLiving) reasons.push("Full funding");
  else if (s.coversTuition) reasons.push("Covers tuition");
  if (q.gpa && s.minGPA) reasons.push(`GPA ${q.gpa} ✓`);
  if (q.ielts && s.minIELTS) reasons.push(`IELTS ${q.ielts} ✓`);
  if (q.toefl && s.minTOEFL) reasons.push(`TOEFL ${q.toefl} ✓`);
  reasons.push(s.location);
  return reasons;
}

// ── Boost Score ────────────────────────────────────────────────────────────────
function boostScore(s, q) {
  let boost = 0;
  const field = (q.fieldOfStudy || "").toLowerCase().trim();

  if (field) {
    // Field matches specifically
    if (s.fieldsOfStudy.some((f) => f.toLowerCase().includes(field) || field.includes(f.toLowerCase()))) {
      boost += 0.3;
    }
  }
  // Always reward "All fields" scholarships — they're open to everyone
  if (s.fieldsOfStudy.includes("All fields")) boost += 0.15;

  if (s.coversTuition && s.coverLiving) boost += 0.2;
  const qCountry = normalizeCountry(q.originCountry);
  if (
    s.allowedCountries.some((c) => normalizeCountry(c) === qCountry) &&
    !s.allowedCountries.some((c) => normalizeCountry(c) === "international")
  ) boost += 0.15;
  if (s.amountUSD >= 30000) boost += 0.1;
  if (s.amountUSD >= 50000) boost += 0.1;
  return boost;
}

// ── Main Search ────────────────────────────────────────────────────────────────
function search(query) {
  const tr = (query.targetRegion || "").toLowerCase();
  const isGlobal = !tr || tr.includes("global") || tr.includes("worldwide") || tr === "any" || tr === "all";
  const queryText = [
    query.originCountry, query.studyLevel, query.fieldOfStudy,
    isGlobal ? "international global worldwide" : query.targetRegion,
    query.studyLevel?.includes("Bachelor") ? "undergraduate bachelor" : "",
    query.studyLevel?.includes("Master") ? "graduate master postgraduate" : "",
    query.studyLevel?.includes("PhD") ? "doctorate doctoral phd" : "",
    (!isGlobal && tr.includes("europe")) ? "europe european germany france sweden" : "",
    (!isGlobal && tr.includes("usa")) ? "usa america fulbright" : "",
    (!isGlobal && tr.includes("uk")) ? "uk britain chevening cambridge oxford" : "",
    (!isGlobal && tr.includes("asia")) ? "asia korea japan china singapore" : "",
    (!isGlobal && tr.includes("australia")) ? "australia melbourne monash sydney" : "",
  ].join(" ");

  const qTokens = tokenize(queryText);
  const qVec = tfidfVector(termFrequency(qTokens), IDF);

  const results = [];
  for (let i = 0; i < SCHOLARSHIPS.length; i++) {
    const s = SCHOLARSHIPS[i];
    if (!hardFilter(s, query)) continue;

    const semantic = cosine(qVec, DOC_VECTORS[i]);
    const boost = boostScore(s, query);
    const score = semantic * 0.6 + boost * 0.4;

    results.push({
      name: s.name,
      provider: s.provider,
      amount: s.amount,
      deadline: s.deadline,
      description: s.description,
      eligibility: s.eligibility,
      location: s.location,
      matchScore: Math.round(score * 100),
      matchReasons: getReasons(s, query),
      tags: s.tags,
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

// ── Worker Entry Point ────────────────────────────────────────────────────────
export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();

      // Support both direct SearchParams and wrapped { type, ...params }
      const query = body;

      // originCountry and studyLevel are required for meaningful filtering
      if (!query.originCountry || !query.studyLevel) {
        return new Response(JSON.stringify({
          error: "Missing required fields: originCountry and studyLevel",
          scholarships: [],
          sources: [],
        }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }

      // fieldOfStudy is optional — default to empty string so search still works
      if (!query.fieldOfStudy) query.fieldOfStudy = "";
      // targetRegion default
      if (!query.targetRegion) query.targetRegion = "Anywhere globally";

      const rawScholarships = search(query);

      // ── Fallback: if nothing matched, relax country filter and return globally-open ones ──
      let finalRaw = rawScholarships;
      if (finalRaw.length === 0) {
        const normalizedLevels = normalizeStudyLevel(query.studyLevel) || [];
        finalRaw = SCHOLARSHIPS
          .filter((s) => {
            const levelOk = normalizedLevels.length === 0 || normalizedLevels.some((nl) => s.studyLevels.includes(nl));
            const isGlobal = s.allowedCountries.some((c) => normalizeCountry(c) === "international");
            return levelOk && isGlobal;
          })
          .map((s) => ({
            name: s.name,
            provider: s.provider,
            amount: s.amount,
            deadline: s.deadline,
            description: s.description,
            eligibility: s.eligibility,
            location: s.location,
            matchScore: 50,
            matchReasons: ["Open to international students", s.location],
            tags: s.tags,
          }))
          .slice(0, 10);
      }

      // Attach applicationUrl to each result
      const scholarships = finalRaw.map((s) => {
        const matchedEntry = SCHOLARSHIPS.find((db) => db.name === s.name);
        return {
          ...s,
          applicationUrl: matchedEntry ? (APPLICATION_URLS[matchedEntry.id] || undefined) : undefined,
        };
      });

      return new Response(JSON.stringify({
        scholarships,
        totalFound: scholarships.length,
        rawText: scholarships.length === 0
          ? "No scholarships matched your profile. Try broadening your region or relaxing score requirements."
          : null,
        sources: scholarships
          .filter((s) => s.applicationUrl)
          .slice(0, 5)
          .map((s) => ({ title: s.name, uri: s.applicationUrl })),
        meta: { engine: "Scholara RAG v2.0", version: "2025" }
      }), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }
};