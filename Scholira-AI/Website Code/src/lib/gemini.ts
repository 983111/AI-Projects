import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Using process.env.GEMINI_API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  // 1. Search for scholarships based on profile
  async findScholarships(profile: any) {
    const model = "gemini-3-flash-preview"; 
    
    const prompt = `
      Find 5-10 real, active scholarships for a student with this profile:
      GPA: ${profile.gpa}
      SAT: ${profile.satScore}
      Major: ${profile.major}
      Demographics: ${profile.demographics}
      Interests: ${profile.interests.join(', ')}

      For each scholarship, provide:
      - Name
      - Amount
      - Deadline (approximate if exact unknown)
      - Brief requirements
      - URL (if found, otherwise put "Search required")
      - Match Score (0-100 based on profile fit)

      Format the output as a JSON array of objects with keys: name, amount, deadline, requirements, url, matchScore.
      Ensure the JSON is valid. Do not include markdown formatting like \`\`\`json.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // Enable Google Search for real results
          responseMimeType: "application/json",
        }
      });
      
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Error finding scholarships:", error);
      return [];
    }
  },

  // 2. Draft an SOP or Essay
  async draftEssay(topic: string, profile: any, wordCount: number = 500) {
    const model = "gemini-3.1-pro-preview"; // Using Pro for higher quality writing
    
    const prompt = `
      Write a compelling college application essay or Statement of Purpose (SOP) on the topic: "${topic}".
      
      Target Word Count: ${wordCount} words.
      
      Student Profile to weave into the narrative:
      - Major Interest: ${profile.major}
      - Key Achievements: ${profile.achievements}
      - Personal Background: ${profile.demographics}
      - Interests: ${profile.interests.join(', ')}

      Tone: Professional, authentic, and ambitious.
      Structure: Strong hook, body paragraphs showing (not just telling) qualities, and a memorable conclusion.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Error drafting essay:", error);
      return "Failed to generate draft. Please try again.";
    }
  },

  // 3. Chat as an Admission Consultant
  async chat(message: string, history: any[], profile: any) {
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `
      You are an expert College Admission Consultant. Your goal is to help the student get into their dream school and secure scholarships.
      
      Student Profile:
      - Name: ${profile.name}
      - GPA: ${profile.gpa}
      - Major: ${profile.major}
      
      Advice Style:
      - Be encouraging but realistic.
      - Focus on actionable steps (e.g., "Improve your SAT math score by...", "Highlight your leadership in...").
      - If asked about specific colleges, provide data-backed insights (acceptance rates, culture).
      - If asked about essays, give specific feedback on structure and tone.
    `;

    try {
      // Convert history to Gemini format
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
        },
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
      });

      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Error in chat:", error);
      return "I'm having trouble connecting right now. Please try again.";
    }
  }
};

