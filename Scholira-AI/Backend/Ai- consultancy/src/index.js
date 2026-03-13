export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
    }

    const { messages, userProfile } = body;

    if (!messages || !Array.isArray(messages)) {
      return corsResponse(JSON.stringify({ error: 'messages array required' }), 400);
    }

    const systemPrompt = `You are a professional academic consultant at Scholira, helping students from Central and Southeast Asia find scholarships and courses.
${userProfile ? `
Student Profile:
- Name: ${userProfile.fullName || userProfile.name || 'N/A'}
- Origin: ${userProfile.originCountry || 'N/A'}
- Target Major: ${userProfile.targetMajor || userProfile.major || 'N/A'}
- Study Level: ${userProfile.studyLevel || 'N/A'}
- Target Region: ${userProfile.targetRegion || 'N/A'}
- GPA: ${userProfile.gpa || 'N/A'}
- SAT: ${userProfile.sat || userProfile.satScore || 'N/A'}
- Interests: ${userProfile.interests || 'N/A'}
- Achievements: ${userProfile.achievements || 'N/A'}
` : ''}
Give concise, practical advice on scholarships, applications, SOPs, essays, and study abroad planning. Be direct and helpful. Do not repeat yourself.`;

    try {
      const response = await fetch('https://api.k2think.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.K2_API_KEY}`,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'MBZUAI-IFM/K2-Think-v2',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('K2 API error:', errText);
        return corsResponse(JSON.stringify({ error: `Upstream API error: ${response.status}` }), 502);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'No response from model.';

      return corsResponse(JSON.stringify({ reply }), 200);

    } catch (err) {
      console.error('Worker error:', err);
      return corsResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  }
};

function corsResponse(body, status) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new Response(body, { status, headers });
}