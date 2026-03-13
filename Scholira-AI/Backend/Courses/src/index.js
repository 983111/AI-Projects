/**
 * Scholara Course Worker — scholara-backend
 * Handles POST requests with { query, subject?, level? }
 * Returns { courses: Course[], total: number }
 * Deploy with: wrangler deploy
 */

// ── CORS Headers ───────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Course Database ────────────────────────────────────────────────────────────
// Covers STEM, Business, Social Sciences, Arts — from edX, Coursera, Harvard, MIT, etc.
const COURSES = [
  // ── Computer Science & Programming ──────────────────────────────────────────
  {
    id: "c001",
    name: "CS50: Introduction to Computer Science",
    provider: "Harvard / edX",
    subject: "Computer Science",
    level: "Beginner",
    duration: "12 weeks (self-paced)",
    cost: "Free (Certificate: $149)",
    description: "Harvard University's introduction to the intellectual enterprises of computer science and the art of programming. Covers C, Python, SQL, JavaScript, and more.",
    skills: ["C", "Python", "SQL", "JavaScript", "Algorithms", "Data Structures"],
    tags: ["programming", "computer science", "beginner", "harvard", "edx", "popular"],
    link: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
    keywords: ["computer science", "programming", "coding", "cs", "software", "python", "javascript", "c", "beginner"]
  },
  {
    id: "c002",
    name: "Machine Learning Specialization",
    provider: "Stanford / Coursera",
    subject: "Machine Learning",
    level: "Intermediate",
    duration: "3 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Andrew Ng's foundational machine learning course covering supervised learning, unsupervised learning, and best practices from Stanford University.",
    skills: ["Python", "Machine Learning", "Neural Networks", "Supervised Learning", "TensorFlow"],
    tags: ["machine learning", "AI", "data science", "stanford", "coursera", "andrew ng"],
    link: "https://www.coursera.org/specializations/machine-learning-introduction",
    keywords: ["machine learning", "ml", "artificial intelligence", "ai", "neural network", "data science", "deep learning"]
  },
  {
    id: "c003",
    name: "Deep Learning Specialization",
    provider: "DeepLearning.AI / Coursera",
    subject: "Artificial Intelligence",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Master the foundations of deep learning with Andrew Ng. Build and train deep neural networks, CNNs, RNNs, and sequence models.",
    skills: ["Deep Learning", "TensorFlow", "Neural Networks", "Computer Vision", "NLP"],
    tags: ["deep learning", "AI", "neural networks", "andrew ng", "coursera"],
    link: "https://www.coursera.org/specializations/deep-learning",
    keywords: ["deep learning", "neural network", "ai", "artificial intelligence", "tensorflow", "cnn", "rnn"]
  },
  {
    id: "c004",
    name: "Python for Everybody Specialization",
    provider: "University of Michigan / Coursera",
    subject: "Programming",
    level: "Beginner",
    duration: "8 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn to program and analyze data with Python. Covers basics through databases and data visualization in this beginner-friendly specialization.",
    skills: ["Python", "Web Scraping", "Databases", "SQL", "Data Visualization"],
    tags: ["python", "programming", "beginner", "coursera", "data"],
    link: "https://www.coursera.org/specializations/python",
    keywords: ["python", "programming", "coding", "beginner", "data", "databases"]
  },
  {
    id: "c005",
    name: "Google Data Analytics Professional Certificate",
    provider: "Google / Coursera",
    subject: "Data Analytics",
    level: "Beginner",
    duration: "6 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Get professional training designed by Google. Learn job-ready skills including data cleaning, analysis, and visualization with R, SQL, and Tableau.",
    skills: ["SQL", "R", "Tableau", "Data Cleaning", "Data Visualization", "Spreadsheets"],
    tags: ["data analytics", "google", "beginner", "coursera", "SQL", "tableau"],
    link: "https://www.coursera.org/professional-certificates/google-data-analytics",
    keywords: ["data analytics", "data analysis", "google", "sql", "tableau", "r", "analytics"]
  },
  {
    id: "c006",
    name: "IBM Data Science Professional Certificate",
    provider: "IBM / Coursera",
    subject: "Data Science",
    level: "Beginner",
    duration: "11 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Launch your career in data science. Build data science skills, work with real datasets, and create a portfolio of projects to show employers.",
    skills: ["Python", "SQL", "Data Visualization", "Machine Learning", "Data Analysis", "Jupyter"],
    tags: ["data science", "IBM", "beginner", "coursera", "python", "sql"],
    link: "https://www.coursera.org/professional-certificates/ibm-data-science",
    keywords: ["data science", "ibm", "python", "sql", "machine learning", "data", "analytics"]
  },
  {
    id: "c007",
    name: "Full-Stack Web Development with React Specialization",
    provider: "Hong Kong University / Coursera",
    subject: "Web Development",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Master full-stack web development using React, Node.js, Express, and MongoDB. Build complete web applications from front to back end.",
    skills: ["React", "Node.js", "Express", "MongoDB", "HTML", "CSS", "JavaScript"],
    tags: ["web development", "react", "javascript", "full-stack", "coursera"],
    link: "https://www.coursera.org/specializations/full-stack-react",
    keywords: ["web development", "react", "javascript", "full stack", "nodejs", "html", "css", "frontend", "backend"]
  },
  {
    id: "c008",
    name: "Cybersecurity Professional Certificate",
    provider: "Google / Coursera",
    subject: "Cybersecurity",
    level: "Beginner",
    duration: "6 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Prepare for a career in cybersecurity with Google. Learn foundational concepts, tools, and hands-on techniques used by security professionals.",
    skills: ["SIEM", "Network Security", "Linux", "SQL", "Risk Management", "Incident Response"],
    tags: ["cybersecurity", "google", "beginner", "security", "coursera"],
    link: "https://www.coursera.org/professional-certificates/google-cybersecurity",
    keywords: ["cybersecurity", "security", "network security", "hacking", "ethical hacking", "infosec"]
  },
  {
    id: "c009",
    name: "AWS Cloud Practitioner Essentials",
    provider: "Amazon Web Services / edX",
    subject: "Cloud Computing",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free",
    description: "Gain an understanding of Amazon Web Services (AWS) cloud and the basic global infrastructure. Ideal for those pursuing the AWS Certified Cloud Practitioner certification.",
    skills: ["AWS", "Cloud Computing", "Cloud Security", "Storage", "Networking"],
    tags: ["cloud", "AWS", "amazon", "beginner", "edx", "certification"],
    link: "https://www.edx.org/learn/aws-certification/amazon-web-services-aws-cloud-practitioner-essentials",
    keywords: ["cloud", "aws", "amazon", "cloud computing", "devops", "infrastructure"]
  },
  {
    id: "c010",
    name: "Algorithms Specialization",
    provider: "Stanford / Coursera",
    subject: "Computer Science",
    level: "Advanced",
    duration: "4 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn the fundamentals of algorithms — divide and conquer, graph algorithms, dynamic programming, and NP-completeness — taught by Stanford professor Tim Roughgarden.",
    skills: ["Algorithms", "Data Structures", "Graph Theory", "Dynamic Programming", "Python"],
    tags: ["algorithms", "computer science", "stanford", "advanced", "coursera"],
    link: "https://www.coursera.org/specializations/algorithms",
    keywords: ["algorithms", "data structures", "computer science", "cs", "programming", "stanford"]
  },

  // ── Business & Management ────────────────────────────────────────────────────
  {
    id: "c011",
    name: "Business Analytics Specialization",
    provider: "Wharton / Coursera",
    subject: "Business Analytics",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn how to use data to make business decisions with Wharton's world-leading business analytics program. Covers marketing, operations, and people analytics.",
    skills: ["Data Analytics", "Excel", "Regression", "Business Intelligence", "SQL"],
    tags: ["business analytics", "wharton", "business", "data", "coursera"],
    link: "https://www.coursera.org/specializations/business-analytics",
    keywords: ["business analytics", "business", "analytics", "management", "data", "wharton", "mba"]
  },
  {
    id: "c012",
    name: "Leadership and Management for PM Specialization",
    provider: "UCI / Coursera",
    subject: "Project Management",
    level: "Intermediate",
    duration: "6 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Develop skills to become a high-performing project manager. Learn team leadership, organizational management, and project planning methodologies.",
    skills: ["Project Management", "Leadership", "Team Management", "Scheduling", "Risk Management"],
    tags: ["project management", "leadership", "business", "coursera"],
    link: "https://www.coursera.org/specializations/leadership-management-pm",
    keywords: ["project management", "leadership", "management", "business", "team", "pm", "pmp"]
  },
  {
    id: "c013",
    name: "Financial Markets",
    provider: "Yale / Coursera",
    subject: "Finance",
    level: "Beginner",
    duration: "7 weeks",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "An overview of the ideas, methods, and institutions that permit human society to manage risks and foster enterprise taught by Nobel Laureate Robert Shiller.",
    skills: ["Finance", "Stocks", "Bonds", "Risk Management", "Behavioral Finance"],
    tags: ["finance", "yale", "stocks", "markets", "beginner", "coursera"],
    link: "https://www.coursera.org/learn/financial-markets-global",
    keywords: ["finance", "financial markets", "stocks", "investment", "economics", "money", "banking"]
  },
  {
    id: "c014",
    name: "Digital Marketing Specialization",
    provider: "University of Illinois / Coursera",
    subject: "Marketing",
    level: "Beginner",
    duration: "8 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Master digital marketing in the era of AI-driven automation. Learn SEO, social media, email marketing, and data-driven strategy from Illinois.",
    skills: ["SEO", "Social Media", "Email Marketing", "Analytics", "Content Marketing"],
    tags: ["marketing", "digital marketing", "SEO", "business", "coursera"],
    link: "https://www.coursera.org/specializations/digital-marketing",
    keywords: ["marketing", "digital marketing", "seo", "social media", "advertising", "business", "content"]
  },
  {
    id: "c015",
    name: "Entrepreneurship Specialization",
    provider: "Wharton / Coursera",
    subject: "Entrepreneurship",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Launch your own business. Learn how to develop, test, and launch your startup idea with Wharton's entrepreneurship framework.",
    skills: ["Business Plan", "Fundraising", "Pitch", "Market Analysis", "Finance"],
    tags: ["entrepreneurship", "startup", "business", "wharton", "coursera"],
    link: "https://www.coursera.org/specializations/wharton-entrepreneurship",
    keywords: ["entrepreneurship", "startup", "business", "entrepreneur", "venture", "management"]
  },
  {
    id: "c016",
    name: "Supply Chain Management Specialization",
    provider: "Rutgers / Coursera",
    subject: "Supply Chain",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn to manage global supply chains and operations. Covers logistics, procurement, demand forecasting, and supply chain analytics.",
    skills: ["Logistics", "Procurement", "Demand Planning", "Analytics", "Operations"],
    tags: ["supply chain", "logistics", "operations", "business", "coursera"],
    link: "https://www.coursera.org/specializations/supply-chain-management",
    keywords: ["supply chain", "logistics", "operations", "procurement", "inventory", "business"]
  },

  // ── Data Science & AI ────────────────────────────────────────────────────────
  {
    id: "c017",
    name: "Applied Data Science with Python Specialization",
    provider: "University of Michigan / Coursera",
    subject: "Data Science",
    level: "Intermediate",
    duration: "5 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn to apply data science methods and techniques using Python. Covers text mining, social network analysis, and applied machine learning.",
    skills: ["Python", "Pandas", "Matplotlib", "Scikit-learn", "NLP", "Data Mining"],
    tags: ["data science", "python", "michigan", "applied", "coursera"],
    link: "https://www.coursera.org/specializations/data-science-python",
    keywords: ["data science", "python", "data", "analytics", "machine learning", "pandas", "numpy"]
  },
  {
    id: "c018",
    name: "Statistics and Data Science MicroMasters",
    provider: "MIT / edX",
    subject: "Statistics",
    level: "Advanced",
    duration: "1 year (self-paced)",
    cost: "$1,500 total (verified track)",
    description: "Develop a foundation in statistics and machine learning from MIT. Covers probability, data analysis, statistical inference, and computational applications.",
    skills: ["Statistics", "Probability", "Python", "R", "Machine Learning", "Data Analysis"],
    tags: ["statistics", "MIT", "data science", "edx", "advanced", "micromasters"],
    link: "https://www.edx.org/micromasters/mitx-statistics-and-data-science",
    keywords: ["statistics", "data science", "probability", "mit", "math", "machine learning", "quantitative"]
  },
  {
    id: "c019",
    name: "Natural Language Processing Specialization",
    provider: "DeepLearning.AI / Coursera",
    subject: "NLP",
    level: "Advanced",
    duration: "4 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Master NLP using logistic regression, naive Bayes, word vectors, machine translation, and attention models to build powerful NLP systems.",
    skills: ["NLP", "Transformers", "Python", "Sentiment Analysis", "Machine Translation"],
    tags: ["NLP", "natural language processing", "AI", "deep learning", "coursera"],
    link: "https://www.coursera.org/specializations/natural-language-processing",
    keywords: ["nlp", "natural language processing", "text", "language", "ai", "deep learning", "chatgpt", "llm"]
  },
  {
    id: "c020",
    name: "Generative AI with Large Language Models",
    provider: "DeepLearning.AI / Coursera",
    subject: "Generative AI",
    level: "Intermediate",
    duration: "3 weeks",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn the fundamentals of how generative AI works, and how to deploy it in real-world applications. Covers LLMs, fine-tuning, and RLHF.",
    skills: ["LLMs", "Prompt Engineering", "Fine-tuning", "RLHF", "Transformer Models"],
    tags: ["generative AI", "LLM", "ChatGPT", "AI", "coursera"],
    link: "https://www.coursera.org/learn/generative-ai-with-llms",
    keywords: ["generative ai", "llm", "large language model", "chatgpt", "gpt", "ai", "prompt engineering"]
  },

  // ── Engineering ──────────────────────────────────────────────────────────────
  {
    id: "c021",
    name: "Mechanics of Materials I",
    provider: "Georgia Tech / Coursera",
    subject: "Mechanical Engineering",
    level: "Intermediate",
    duration: "5 weeks",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn the fundamentals of structural analysis. Understand how materials behave under loading conditions — stress, strain, and deformation.",
    skills: ["Structural Analysis", "Stress Analysis", "Mechanics", "Engineering Design"],
    tags: ["mechanical engineering", "engineering", "mechanics", "georgia tech", "coursera"],
    link: "https://www.coursera.org/learn/mechanics-1",
    keywords: ["mechanical engineering", "mechanics", "engineering", "structures", "materials", "physics"]
  },
  {
    id: "c022",
    name: "Introduction to Engineering Mechanics",
    provider: "Georgia Tech / Coursera",
    subject: "Engineering",
    level: "Beginner",
    duration: "8 weeks",
    cost: "Free to audit",
    description: "This course is an introduction to learning and applying the principles required to solve engineering mechanics problems — statics and dynamics.",
    skills: ["Statics", "Dynamics", "Free Body Diagrams", "Vector Analysis"],
    tags: ["engineering", "mechanics", "physics", "beginner", "coursera"],
    link: "https://www.coursera.org/learn/engineering-mechanics-statics",
    keywords: ["engineering", "mechanics", "statics", "dynamics", "physics", "civil engineering"]
  },
  {
    id: "c023",
    name: "Solar Energy Engineering MicroMasters",
    provider: "Delft / edX",
    subject: "Renewable Energy",
    level: "Advanced",
    duration: "9 months",
    cost: "$540 total (verified track)",
    description: "Learn from the world's top solar energy experts at TU Delft. Covers the full solar energy value chain from photovoltaics to system design.",
    skills: ["Solar Energy", "PV Systems", "Renewable Energy", "Energy Storage", "Grid Integration"],
    tags: ["renewable energy", "solar", "engineering", "edx", "delft", "sustainability"],
    link: "https://www.edx.org/micromasters/delftx-solar-energy",
    keywords: ["solar energy", "renewable energy", "energy", "sustainability", "environmental", "engineering"]
  },

  // ── Social Sciences & Humanities ─────────────────────────────────────────────
  {
    id: "c024",
    name: "Introduction to Public Health",
    provider: "Johns Hopkins / Coursera",
    subject: "Public Health",
    level: "Beginner",
    duration: "4 weeks",
    cost: "Free to audit",
    description: "Get an introduction to the field of public health — what it is, what public health professionals do, and why it is important for society.",
    skills: ["Epidemiology", "Health Policy", "Health Promotion", "Disease Prevention"],
    tags: ["public health", "health", "medicine", "johns hopkins", "beginner", "coursera"],
    link: "https://www.coursera.org/learn/introduction-to-public-health",
    keywords: ["public health", "health", "medicine", "epidemiology", "health policy", "global health"]
  },
  {
    id: "c025",
    name: "The Science of Well-Being",
    provider: "Yale / Coursera",
    subject: "Psychology",
    level: "Beginner",
    duration: "10 weeks",
    cost: "Free to audit",
    description: "Yale's most popular course ever. Learn what psychological science says about happiness and put it into practice with proven habits for well-being.",
    skills: ["Psychology", "Positive Psychology", "Mindfulness", "Behavioral Science"],
    tags: ["psychology", "wellbeing", "yale", "popular", "beginner", "coursera"],
    link: "https://www.coursera.org/learn/the-science-of-well-being",
    keywords: ["psychology", "wellbeing", "happiness", "mental health", "behavioral science", "mindfulness"]
  },
  {
    id: "c026",
    name: "International Relations: An Introduction",
    provider: "University of Geneva / Coursera",
    subject: "International Relations",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free to audit",
    description: "Explore the key actors, dynamics, and phenomena that characterize today's world. Understand peace, security, global economy, and international institutions.",
    skills: ["International Relations", "Geopolitics", "Diplomacy", "Global Policy", "Security Studies"],
    tags: ["international relations", "political science", "diplomacy", "coursera"],
    link: "https://www.coursera.org/learn/international-relations",
    keywords: ["international relations", "political science", "diplomacy", "geopolitics", "policy", "security", "global affairs"]
  },
  {
    id: "c027",
    name: "Economics of Money and Banking",
    provider: "Columbia / Coursera",
    subject: "Economics",
    level: "Intermediate",
    duration: "13 weeks",
    cost: "Free to audit",
    description: "Understand money, banking, and the global financial system through the lens of economic history, theory, and current events.",
    skills: ["Monetary Policy", "Banking", "Macroeconomics", "Finance", "Financial Systems"],
    tags: ["economics", "banking", "finance", "columbia", "intermediate", "coursera"],
    link: "https://www.coursera.org/learn/money-banking",
    keywords: ["economics", "banking", "finance", "money", "monetary policy", "macroeconomics"]
  },
  {
    id: "c028",
    name: "Human Rights: The Rights of Refugees",
    provider: "Amnesty International / Coursera",
    subject: "Human Rights",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free",
    description: "Explore the rights that refugees and displaced people have under international law and how they are protected through advocacy and legal mechanisms.",
    skills: ["Human Rights", "International Law", "Advocacy", "Policy"],
    tags: ["human rights", "law", "international", "social sciences", "coursera"],
    link: "https://www.coursera.org/learn/human-rights-refugees",
    keywords: ["human rights", "law", "refugees", "international law", "advocacy", "policy", "social sciences"]
  },

  // ── Health & Medicine ────────────────────────────────────────────────────────
  {
    id: "c029",
    name: "Healthcare Innovation Specialization",
    provider: "Arizona State / edX",
    subject: "Healthcare",
    level: "Intermediate",
    duration: "4 months",
    cost: "Free to audit",
    description: "Learn to design, evaluate, and implement healthcare innovations. Covers digital health, value-based care, and healthcare entrepreneurship.",
    skills: ["Healthcare Innovation", "Digital Health", "Value-Based Care", "Health Systems"],
    tags: ["healthcare", "health", "innovation", "medicine", "edx"],
    link: "https://www.edx.org/learn/healthcare/arizona-state-university-healthcare-innovation",
    keywords: ["healthcare", "health", "medicine", "medical", "innovation", "hospital"]
  },
  {
    id: "c030",
    name: "Introduction to Clinical Data Science",
    provider: "UC San Diego / Coursera",
    subject: "Clinical Data Science",
    level: "Intermediate",
    duration: "7 months",
    cost: "Free to audit",
    description: "Understand how to work with clinical data to gain insights for improving healthcare. Covers SQL, R, machine learning, and clinical data standards.",
    skills: ["Clinical Data", "SQL", "R", "Machine Learning", "Health Informatics"],
    tags: ["data science", "healthcare", "clinical", "ucsd", "coursera"],
    link: "https://www.coursera.org/specializations/clinical-data-science",
    keywords: ["clinical data", "health data", "medical data", "data science", "healthcare", "informatics"]
  },

  // ── Environment & Sustainability ─────────────────────────────────────────────
  {
    id: "c031",
    name: "Sustainability through Soccer",
    provider: "University of Michigan / Coursera",
    subject: "Sustainability",
    level: "Beginner",
    duration: "4 weeks",
    cost: "Free",
    description: "An unusual but effective introduction to sustainability concepts using soccer as a lens. Learn about ecosystems, energy, and climate solutions.",
    skills: ["Sustainability", "Systems Thinking", "Environmental Science"],
    tags: ["sustainability", "environment", "michigan", "beginner", "coursera"],
    link: "https://www.coursera.org/learn/sustainability-through-soccer",
    keywords: ["sustainability", "environment", "climate", "green", "eco", "ecology", "environmental science"]
  },
  {
    id: "c032",
    name: "Climate Change and Health: From Science to Action",
    provider: "Yale / Coursera",
    subject: "Environmental Health",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free to audit",
    description: "Explore the connections between climate change and human health, and learn how communities can adapt and take action.",
    skills: ["Climate Science", "Environmental Health", "Public Health", "Policy"],
    tags: ["climate change", "environment", "health", "yale", "coursera"],
    link: "https://www.coursera.org/learn/climate-change-and-health",
    keywords: ["climate change", "environment", "sustainability", "health", "global warming", "carbon"]
  },

  // ── Language & Communication ─────────────────────────────────────────────────
  {
    id: "c033",
    name: "Business English Communication Skills",
    provider: "University of Washington / Coursera",
    subject: "Business English",
    level: "Intermediate",
    duration: "4 months",
    cost: "Free to audit",
    description: "Improve your professional English communication skills. Covers business writing, presentation skills, and workplace communication.",
    skills: ["Business Writing", "Email Writing", "Presentation", "Professional Communication"],
    tags: ["english", "communication", "business", "language", "coursera"],
    link: "https://www.coursera.org/specializations/business-english",
    keywords: ["english", "communication", "language", "writing", "business english", "ielts", "presentation"]
  },
  {
    id: "c034",
    name: "Academic Writing Made Easy",
    provider: "TU Munich / edX",
    subject: "Academic Writing",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free",
    description: "Learn the skills needed to write clear and effective academic texts in English. Ideal for non-native speakers preparing for university studies.",
    skills: ["Academic Writing", "Research Writing", "Essay Writing", "Citation"],
    tags: ["writing", "academic", "english", "university", "edx"],
    link: "https://www.edx.org/learn/english/technische-universitat-munchen-academic-writing-made-easy",
    keywords: ["academic writing", "writing", "english", "essay", "research", "university preparation"]
  },

  // ── Arts & Design ────────────────────────────────────────────────────────────
  {
    id: "c035",
    name: "Graphic Design Specialization",
    provider: "CalArts / Coursera",
    subject: "Graphic Design",
    level: "Beginner",
    duration: "6 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Start your journey in graphic design with CalArts. Build skills in typography, imagemaking, composition, and visual branding.",
    skills: ["Graphic Design", "Typography", "Adobe Illustrator", "Visual Design", "Branding"],
    tags: ["design", "graphic design", "art", "calarts", "adobe", "coursera"],
    link: "https://www.coursera.org/specializations/graphic-design",
    keywords: ["graphic design", "design", "art", "visual", "creative", "typography", "branding", "illustration"]
  },
  {
    id: "c036",
    name: "UI / UX Design Specialization",
    provider: "California Institute of Arts / Coursera",
    subject: "UX Design",
    level: "Beginner",
    duration: "7 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Design effective and engaging user experiences. Learn UX research, wireframing, prototyping, and usability testing.",
    skills: ["UX Design", "Figma", "Prototyping", "Wireframing", "User Research"],
    tags: ["UX", "UI", "design", "product design", "figma", "coursera"],
    link: "https://www.coursera.org/specializations/ui-ux-design",
    keywords: ["ux", "ui", "user experience", "design", "product design", "figma", "prototyping", "wireframe"]
  },

  // ── Law & Policy ─────────────────────────────────────────────────────────────
  {
    id: "c037",
    name: "An Introduction to International Law",
    provider: "Geneva Academy / Coursera",
    subject: "International Law",
    level: "Beginner",
    duration: "6 weeks",
    cost: "Free to audit",
    description: "Understand the basics of international law including the UN system, treaty law, and how states interact with each other legally.",
    skills: ["International Law", "Treaty Law", "UN System", "Dispute Resolution"],
    tags: ["law", "international law", "policy", "united nations", "coursera"],
    link: "https://www.coursera.org/learn/international-law",
    keywords: ["law", "international law", "legal", "policy", "un", "treaty", "human rights", "governance"]
  },
  {
    id: "c038",
    name: "Constitutional Interpretation",
    provider: "Princeton / Coursera",
    subject: "Law",
    level: "Intermediate",
    duration: "5 weeks",
    cost: "Free to audit",
    description: "Explore the principles and methods of constitutional interpretation, examining landmark cases and legal doctrines in American constitutional law.",
    skills: ["Constitutional Law", "Legal Analysis", "Case Study", "Critical Thinking"],
    tags: ["law", "constitutional", "legal", "princeton", "coursera"],
    link: "https://www.coursera.org/learn/constitutional-interpretation",
    keywords: ["law", "legal", "constitution", "political science", "policy", "governance"]
  },

  // ── Mathematics ──────────────────────────────────────────────────────────────
  {
    id: "c039",
    name: "Mathematics for Machine Learning Specialization",
    provider: "Imperial College London / Coursera",
    subject: "Mathematics",
    level: "Intermediate",
    duration: "4 months",
    cost: "Free to audit (Certificate: ~$49/mo)",
    description: "Learn the prerequisite mathematics for machine learning: linear algebra, multivariate calculus, and PCA. Bridging the gap between theory and practice.",
    skills: ["Linear Algebra", "Calculus", "Statistics", "PCA", "Python"],
    tags: ["mathematics", "math", "machine learning", "imperial college", "coursera"],
    link: "https://www.coursera.org/specializations/mathematics-machine-learning",
    keywords: ["mathematics", "math", "linear algebra", "calculus", "statistics", "machine learning"]
  },
  {
    id: "c040",
    name: "Introduction to Probability and Statistics",
    provider: "MIT / edX",
    subject: "Statistics",
    level: "Intermediate",
    duration: "16 weeks",
    cost: "Free (Verified: $150)",
    description: "MIT's foundational course in probability theory and statistics. Covers random variables, distributions, estimation, and hypothesis testing.",
    skills: ["Probability", "Statistics", "Hypothesis Testing", "Data Analysis", "Python"],
    tags: ["statistics", "probability", "math", "MIT", "edx"],
    link: "https://www.edx.org/learn/probability/massachusetts-institute-of-technology-probability-the-science-of-uncertainty-and-data",
    keywords: ["statistics", "probability", "math", "quantitative", "data analysis", "inference"]
  },
];

// ── TF-IDF Search Engine ───────────────────────────────────────────────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

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

// Build corpus and index at startup
function courseToText(c) {
  return [
    c.name, c.provider, c.subject, c.description,
    c.skills.join(" "), c.tags.join(" "), c.keywords.join(" "),
    c.level
  ].join(" ");
}

const corpus = COURSES.map((c) => tokenize(courseToText(c)));
const IDF = buildIDF(corpus);
const DOC_VECTORS = corpus.map((tokens) => tfidfVector(termFrequency(tokens), IDF));

// ── Level Filter ───────────────────────────────────────────────────────────────
const LEVEL_MAP = {
  beginner: ["Beginner"],
  intermediate: ["Intermediate"],
  advanced: ["Advanced"],
  all: ["Beginner", "Intermediate", "Advanced"],
};

function levelFilter(course, requestedLevel) {
  if (!requestedLevel || requestedLevel.toLowerCase() === "all") return true;
  const normalized = requestedLevel.toLowerCase();
  const allowed = LEVEL_MAP[normalized] || [];
  return allowed.includes(course.level);
}

// ── Main Search ────────────────────────────────────────────────────────────────
function search(params) {
  const { query = "", subject = "", level = "" } = params;

  const queryText = [query, subject].join(" ").trim();
  if (!queryText) {
    // Return a broad mix if no query
    return COURSES.slice(0, 9);
  }

  const qTokens = tokenize(queryText);
  const qVec = tfidfVector(termFrequency(qTokens), IDF);

  const results = [];
  for (let i = 0; i < COURSES.length; i++) {
    const course = COURSES[i];
    if (!levelFilter(course, level)) continue;

    const score = cosine(qVec, DOC_VECTORS[i]);
    if (score > 0.01) {
      results.push({ course, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  // Return top 9 results, strip internal score
  return results.slice(0, 9).map(({ course }) => course);
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

      // Accept { query } or { query, subject, level, type }
      const { query = "", subject = "", level = "" } = body;

      if (!query && !subject) {
        return new Response(JSON.stringify({
          courses: COURSES.slice(0, 9),
          total: COURSES.length,
        }), {
          status: 200,
          headers: { ...CORS, "Content-Type": "application/json" }
        });
      }

      const courses = search({ query, subject, level });

      return new Response(JSON.stringify({
        courses,
        total: courses.length,
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