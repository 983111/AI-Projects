/**
 * test-rag.js — Run with: node test-rag.js
 * Tests the scholarship search logic locally before deploying
 */

const { readFileSync } = require('fs');
const path = require('path');

// Load scholarships from JSON file
const dbPath = path.join(__dirname, 'data', 'scholarships.json');
let scholarships;

try {
  scholarships = JSON.parse(readFileSync(dbPath, 'utf-8'));
  console.log(`\n📂 Loaded ${scholarships.length} scholarships from database\n`);
} catch (e) {
  console.error('❌ Could not load scholarships.json:', e.message);
  console.error('   Make sure data/scholarships.json exists in this folder');
  process.exit(1);
}

// ── Test Queries ──────────────────────────────────────────────────────────────
// Change these values to test different search scenarios
const TEST_QUERIES = [
  {
    label: "Uzbek student → Master's → Europe → CS → GPA 3.5 → IELTS 7.0",
    query: {
      originCountry: "Uzbekistan",
      studyLevel: "Master's Degree",
      fieldOfStudy: "Computer Science",
      targetRegion: "Europe",
      gpa: "3.5",
      ielts: "7.0",
      toefl: "",
      sat: ""
    }
  },
  {
    label: "Vietnamese student → Bachelor's → Asia → No scores entered",
    query: {
      originCountry: "Vietnam",
      studyLevel: "Bachelor's Degree",
      fieldOfStudy: "Business",
      targetRegion: "Asia",
      gpa: "",
      ielts: "",
      toefl: "",
      sat: ""
    }
  },
  {
    label: "Indonesian student → PhD → Anywhere → Engineering → GPA 3.8",
    query: {
      originCountry: "Indonesia",
      studyLevel: "PhD",
      fieldOfStudy: "Engineering",
      targetRegion: "Anywhere globally",
      gpa: "3.8",
      ielts: "7.5",
      toefl: "",
      sat: ""
    }
  }
];

// ── Hard Filter Function ──────────────────────────────────────────────────────
function hardFilter(s, q) {
  // Country check
  const countryOk = s.allowedCountries.includes(q.originCountry) ||
                    s.allowedCountries.includes("International");
  if (!countryOk) return false;

  // Study level check
  const levelOk = s.studyLevels.includes(q.studyLevel);
  if (!levelOk) return false;

  // Region check
  if (q.targetRegion && q.targetRegion !== "Anywhere globally") {
    const regionOk = s.targetRegions.some(r =>
      r === "Anywhere globally" ||
      r === q.targetRegion ||
      q.targetRegion.includes(r) ||
      r.includes(q.targetRegion.split(" ")[0])
    );
    if (!regionOk) return false;
  }

  // Score checks (only filter if user provided a score AND scholarship has a minimum)
  if (q.gpa && s.minGPA !== null) {
    if (parseFloat(q.gpa) < s.minGPA) return false;
  }
  if (q.ielts && s.minIELTS !== null) {
    if (parseFloat(q.ielts) < s.minIELTS) return false;
  }
  if (q.toefl && s.minTOEFL !== null) {
    if (parseInt(q.toefl) < s.minTOEFL) return false;
  }
  if (q.sat && s.minSAT !== null) {
    if (parseInt(q.sat) < s.minSAT) return false;
  }

  return true;
}

// ── Run Tests ─────────────────────────────────────────────────────────────────
for (const test of TEST_QUERIES) {
  console.log('─'.repeat(60));
  console.log(`🔍 Test: ${test.label}`);
  console.log('─'.repeat(60));

  const results = scholarships.filter(s => hardFilter(s, test.query));

  if (results.length === 0) {
    console.log('  ⚠️  No scholarships matched this query\n');
  } else {
    console.log(`  ✅ Found ${results.length} matching scholarships:\n`);
    results.forEach((s, i) => {
      const fullFunding = s.coversTuition && s.coverLiving ? '💰 Full' : '📋 Partial';
      console.log(`  ${i + 1}. ${s.name}`);
      console.log(`     Provider : ${s.provider}`);
      console.log(`     Funding  : ${fullFunding} — ${s.amount}`);
      console.log(`     Deadline : ${s.deadline}`);
      console.log(`     Location : ${s.location}\n`);
    });
  }
}

console.log('─'.repeat(60));
console.log('\n✅ Test complete! If you see results above, your database works.\n');
console.log('Next step: run  npx wrangler deploy  to go live\n');