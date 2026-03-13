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

    const systemPrompt = `You are a professional academic consultant at Scholira.
${userProfile ? `Student: ${userProfile.fullName || userProfile.name || ''}, from ${userProfile.originCountry || ''}, targeting ${userProfile.targetMajor || userProfile.major || 'CS'} at ${userProfile.studyLevel || 'bachelor'} level, region: ${userProfile.targetRegion || ''}, GPA: ${userProfile.gpa || ''}, SAT: ${userProfile.sat || userProfile.satScore || ''}.` : ''}

You must respond ONLY with your final answer. No thinking, no reasoning, no self-talk, no analysis before answering.
Write in plain conversational English. No asterisks, no hashtags, no dashes, no bullet points, no numbered lists, no markdown of any kind.
Structure your response as short separate paragraphs, one idea per paragraph. Each paragraph is 1-2 sentences. Use a blank line between paragraphs.
Keep the total response to 3-5 paragraphs unless the user asks for a detailed plan.`;

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
      let reply = data.choices?.[0]?.message?.content || 'No response from model.';

      // Strip <think>...</think> blocks
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      reply = reply.replace(/<\/?think>/gi, '').trim();

      // Cut off plain-text reasoning — extract only content after last reasoning signal
      const reasoningCutoffs = [
        /thus(?:\s+(?:respond|reply|answer|produce|we respond|we reply)[^\n]*)[\.\:]\s*/gi,
        /(?:potential reply|final answer|actual response|my response|so(?:,)? (?:respond|reply))[\s\S]*?[\.\:]\s*/gi,
        /(?:ok(?:ay)?[,\.]?\s*(?:so|let(?:'s)?|here(?:'s)?|produce|respond|reply))[^\n]*\n/gi,
        /(?:let(?:'s)? (?:respond|reply|produce|answer)[^\n]*\n)/gi,
      ];

      for (const pattern of reasoningCutoffs) {
        const matches = [...reply.matchAll(pattern)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const afterCutoff = reply.slice(lastMatch.index + lastMatch[0].length).trim();
          if (afterCutoff.length > 20) {
            reply = afterCutoff;
            break;
          }
        }
      }

      // Strip markdown formatting
      reply = reply.replace(/#{1,6}\s+/g, '');
      reply = reply.replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1');
      reply = reply.replace(/_{1,2}([^_\n]+)_{1,2}/g, '$1');
      reply = reply.replace(/^[-*+]\s+/gm, '');
      reply = reply.replace(/^\d+\.\s+/gm, '');
      reply = reply.replace(/\|.*\|/g, '');
      reply = reply.replace(/`([^`]+)`/g, '$1');

      // If model ignored paragraph instructions and returned a wall of text,
      // split into readable paragraphs at sentence endings
      if (!reply.includes('\n')) {
        reply = reply
          .replace(/\.\s+(?=[A-Z])/g, '.\n\n')
          .replace(/\?\s+(?=[A-Z])/g, '?\n\n')
          .replace(/!\s+(?=[A-Z])/g, '!\n\n');
      }

      // Collapse 3+ newlines to double newline
      reply = reply.replace(/\n{3,}/g, '\n\n').trim();

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
