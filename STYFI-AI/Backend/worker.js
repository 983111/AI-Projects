export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    try {
      if (url.pathname === '/api/trends' && request.method === 'POST') {
        return await handleTrends(request, env, corsHeaders);
      } else if (url.pathname === '/api/compose-outfit' && request.method === 'POST') {
        return await handleComposeOutfit(request, env, corsHeaders);
      } else if (url.pathname === '/api/enhance-image' && request.method === 'POST') {
        return await handleEnhanceImage(request, env, corsHeaders);
      } else if (url.pathname === '/api/virtual-tryon' && request.method === 'POST') {
        return await handleVirtualTryOn(request, env, corsHeaders);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleEnhanceImage(request, env, corsHeaders) {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  const { imageData, prompt } = await request.json();
  if (!imageData) throw new Error("No imageData provided");

  const formattedImage = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
  const userPrompt = prompt || "Enhance this fashion image: provide a professional studio version with sharp details.";

  const payload = {
    model: "openai/gpt-5-image",
    // CRITICAL: Reduced to 100 to fit within 116 token balance
    max_tokens: 100, 
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: formattedImage } }
        ]
      }
    ],
    modalities: ["image", "text"]
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Styfi GPT-5 Editor"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`OpenRouter Error: ${data.error?.message || "Unknown error"}`);

  let finalImage = "";
  const message = data.choices?.[0]?.message;
  
  if (message?.images && message.images.length > 0) {
    const firstImage = message.images[0];
    finalImage = firstImage.image_url?.url || firstImage.url || firstImage;
  } else if (message?.content) {
    finalImage = message.content;
  }

  return new Response(JSON.stringify({
    success: !!finalImage,
    enhancedImage: finalImage
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ... (Rest of the handlers: Trends, Compose Outfit, Virtual Try-On) ...
async function handleTrends(request, env, corsHeaders) {
  const { category } = await request.json();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `Identify top 3 fashion trends for ${category}. Return JSON array.` }] }] })
  });
  const data = await response.json();
  let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return new Response(cleanText, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleComposeOutfit(request, env, corsHeaders) {
  const { productName, productCategory } = await request.json();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `Suggest 3 items to complete an outfit with ${productName} (${productCategory}). Return JSON array.` }] }] })
  });
  const data = await response.json();
  let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return new Response(cleanText, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleVirtualTryOn(request, env, corsHeaders) {
  const { userImageData, userMimeType, productImageData, productMimeType } = await request.json();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
            { inline_data: { mime_type: userMimeType, data: userImageData } },
            { inline_data: { mime_type: productMimeType, data: productImageData } },
            { text: `Describe a virtual try-on visualization.` }
          ] }]
      })
    });
    const data = await response.json();
    const guide = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return new Response(JSON.stringify({ visualizationGuide: guide }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}