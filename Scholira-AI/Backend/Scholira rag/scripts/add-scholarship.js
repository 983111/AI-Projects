#!/usr/bin/env node
/**
 * add-scholarship.js
 * CLI tool to add a new scholarship to scholarships.json
 * 
 * Usage:
 *   node scripts/add-scholarship.js
 *
 * Or pipe a JSON object:
 *   echo '{"name":"My Scholarship",...}' | node scripts/add-scholarship.js --json
 */

import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "../data/scholarships.json");

const TEMPLATE = {
  id: "",                    // e.g. "s026"
  name: "",                  // Full scholarship name
  provider: "",              // Organization name
  amount: "",                // Human-readable amount
  amountUSD: 0,              // Approx USD value
  deadline: "",              // e.g. "March 2026"
  deadlineMonth: 0,          // 1-12
  description: "",           // 2-3 sentence description
  eligibility: [],           // Array of eligibility strings
  location: "",              // Study destination
  targetRegions: [],         // e.g. ["Europe", "USA & Canada"]
  allowedCountries: [],      // e.g. ["Uzbekistan", "Vietnam", "International"]
  studyLevels: [],           // e.g. ["Bachelor's Degree", "Master's Degree"]
  fieldsOfStudy: [],         // e.g. ["All fields"] or specific fields
  minGPA: null,              // e.g. 3.0 or null
  minIELTS: null,            // e.g. 6.5 or null
  minTOEFL: null,            // e.g. 90 or null
  minSAT: null,              // e.g. 1300 or null
  coversTuition: true,
  coverLiving: false,
  tags: [],
};

// If --json flag is passed, read from stdin
if (process.argv.includes("--json")) {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    try {
      const newScholarship = JSON.parse(input);
      addToDatabase(newScholarship);
    } catch (e) {
      console.error("Invalid JSON:", e.message);
      process.exit(1);
    }
  });
} else {
  // Interactive mode
  console.log("\n🎓 Scholara Scholarship Database Adder");
  console.log("━".repeat(40));
  console.log("Template (fill in scholarships.json directly):\n");
  console.log(JSON.stringify(TEMPLATE, null, 2));
  console.log("\n📝 Edit the template above and add it to data/scholarships.json");
  console.log("   Make sure to assign a unique ID (e.g., 's026')");
  console.log("\n🔄 To add via command line:");
  console.log("   echo '<json>' | node scripts/add-scholarship.js --json\n");
  showCurrentStats();
}

function addToDatabase(scholarship) {
  const db = JSON.parse(readFileSync(DB_PATH, "utf-8"));

  // Auto-assign ID if missing
  if (!scholarship.id) {
    const maxId = db.reduce((max, s) => {
      const num = parseInt(s.id.replace("s", ""));
      return num > max ? num : max;
    }, 0);
    scholarship.id = `s${String(maxId + 1).padStart(3, "0")}`;
  }

  // Check for duplicate
  if (db.find((s) => s.id === scholarship.id)) {
    console.error(`❌ Scholarship with ID ${scholarship.id} already exists`);
    process.exit(1);
  }

  db.push(scholarship);
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`✅ Added scholarship: "${scholarship.name}" (ID: ${scholarship.id})`);
  console.log(`📊 Database now has ${db.length} scholarships`);
}

function showCurrentStats() {
  const db = JSON.parse(readFileSync(DB_PATH, "utf-8"));
  console.log(`📊 Current database: ${db.length} scholarships`);

  const byRegion = {};
  for (const s of db) {
    for (const r of s.targetRegions || []) {
      byRegion[r] = (byRegion[r] || 0) + 1;
    }
  }
  console.log("By region:", byRegion);

  const byLevel = {};
  for (const s of db) {
    for (const l of s.studyLevels || []) {
      byLevel[l] = (byLevel[l] || 0) + 1;
    }
  }
  console.log("By level:", byLevel);
}
