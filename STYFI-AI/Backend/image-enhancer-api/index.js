// ==================== CLOUDFLARE WORKER - AI IMAGE ENHANCER ====================
// Uses: Replicate API for actual image enhancement
// Transforms bad quality clothing photos into professional e-commerce images

// Required Secret: REPLICATE_API_KEY
// Get it from: https://replicate.com/account/api-tokens (Free tier available)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Main enhancement endpoint
      if (path === '/api/enhance/image') {
        return handleImageEnhancement(request, env, corsHeaders);
      }
      
      // Remove background + white background
      if (path === '/api/enhance/remove-background') {
        return handleBackgroundRemoval(request, env, corsHeaders);
      }
      
      // Professional lighting + wrinkle removal
      if (path === '/api/enhance/professional') {
        return handleProfessionalEnhancement(request, env, corsHeaders);
      }
      
      // Upscale image quality
      if (path === '/api/enhance/upscale') {
        return handleImageUpscale(request, env, corsHeaders);
      }
      
      // Custom enhancement
      if (path === '/api/enhance/custom') {
        return handleCustomEnhancement(request, env, corsHeaders);
      }
      
      // Check enhancement status
      if (path.startsWith('/api/enhance/status/')) {
        return handleStatusCheck(request, env, corsHeaders);
      }
      
      // API documentation
      if (path === '/' || path === '/api') {
        return new Response(JSON.stringify({
          service: 'AI Clothing Image Enhancer',
          version: '1.0.0',
          powered_by: 'Replicate API',
          endpoints: {
            'POST /api/enhance/image': 'Full enhancement (recommended)',
            'POST /api/enhance/remove-background': 'Remove background, add white',
            'POST /api/enhance/professional': 'Remove wrinkles + professional lighting',
            'POST /api/enhance/upscale': 'Upscale to higher resolution',
            'POST /api/enhance/custom': 'Custom enhancement with prompt',
            'GET /api/enhance/status/:id': 'Check enhancement status'
          },
          request_example: {
            image_url: 'https://example.com/image.jpg OR data:image/jpeg;base64,...',
            item_type: 'shirt',
            enhancement_level: 'high',
            background: 'white'
          },
          response_example: {
            success: true,
            enhanced_image_url: 'https://replicate.delivery/...',
            prediction_id: 'abc123',
            status: 'succeeded'
          },
          note: 'API returns URLs to enhanced images. Use status endpoint to check async jobs.'
        }, null, 2), { headers: corsHeaders });
      }
      
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: corsHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        hint: 'Make sure REPLICATE_API_KEY is set'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

// ==================== REPLICATE API FUNCTIONS ====================

async function createReplicatePrediction(model, input, env) {
  const apiKey = env.REPLICATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('REPLICATE_API_KEY not configured');
  }
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait'  // Wait for result instead of polling
    },
    body: JSON.stringify({
      version: model,
      input: input
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

async function getPredictionStatus(predictionId, env) {
  const apiKey = env.REPLICATE_API_KEY;
  
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

// ==================== REPLICATE MODELS ====================

const MODELS = {
  // SDXL Image-to-Image for enhancement
  SDXL_IMG2IMG: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  
  // Background removal
  BACKGROUND_REMOVAL: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  
  // Clarity upscaler
  CLARITY_UPSCALER: 'dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e',
  
  // Real-ESRGAN upscaler
  REAL_ESRGAN: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
  
  // GFPGAN (face/quality restoration)
  GFPGAN: '9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3'
};

// ==================== ENDPOINT HANDLERS ====================

async function handleImageEnhancement(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { 
    image_url,
    image_base64,
    item_type = 'clothing',
    enhancement_level = 'high',
    background = 'white'
  } = body;
  
  const imageInput = image_url || image_base64;
  
  if (!imageInput) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Either image_url or image_base64 required',
      example: {
        image_url: 'https://example.com/shirt.jpg',
        item_type: 'shirt',
        enhancement_level: 'high'
      }
    }), { status: 400, headers: corsHeaders });
  }
  
  // Enhancement prompt based on item type
  const enhancementPrompts = {
    shirt: 'professional product photo of a shirt on white background, studio lighting, no wrinkles, perfectly ironed, high quality, sharp details, e-commerce style',
    pants: 'professional product photo of pants on white background, studio lighting, wrinkle-free, perfectly pressed, high quality, sharp details, e-commerce style',
    dress: 'professional product photo of a dress on white background, studio lighting, no wrinkles, elegant presentation, high quality, sharp details, e-commerce style',
    shoes: 'professional product photo of shoes on white background, studio lighting, clean, high quality, sharp details, e-commerce style',
    clothing: 'professional product photo on white background, studio lighting, no wrinkles, perfectly presented, high quality, sharp details, e-commerce style, Amazon/Myntra quality'
  };
  
  const prompt = enhancementPrompts[item_type] || enhancementPrompts.clothing;
  
  // Step 1: Remove background
  console.log('Step 1: Removing background...');
  const bgRemoval = await createReplicatePrediction(
    MODELS.BACKGROUND_REMOVAL,
    {
      image: imageInput
    },
    env
  );
  
  const noBgImage = bgRemoval.output;
  
  // Step 2: Enhance with SDXL
  console.log('Step 2: Enhancing with AI...');
  const enhancement = await createReplicatePrediction(
    MODELS.SDXL_IMG2IMG,
    {
      image: noBgImage,
      prompt: prompt,
      negative_prompt: 'wrinkles, folds, creases, poor lighting, shadows, blurry, low quality, distorted, messy background',
      num_inference_steps: 50,
      guidance_scale: 7.5,
      strength: enhancement_level === 'high' ? 0.75 : enhancement_level === 'medium' ? 0.5 : 0.3
    },
    env
  );
  
  const enhancedImage = Array.isArray(enhancement.output) ? enhancement.output[0] : enhancement.output;
  
  return new Response(JSON.stringify({
    success: true,
    enhanced_image_url: enhancedImage,
    original_image: imageInput,
    enhancements_applied: [
      'Background removed',
      'Professional lighting applied',
      'Wrinkles reduced',
      'Quality enhanced',
      'E-commerce ready'
    ],
    prediction_id: enhancement.id,
    status: enhancement.status,
    processing_time: `${((Date.now() - new Date(enhancement.created_at)) / 1000).toFixed(1)}s`
  }, null, 2), { headers: corsHeaders });
}

async function handleBackgroundRemoval(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { image_url, image_base64, background_color = 'white' } = body;
  
  const imageInput = image_url || image_base64;
  
  if (!imageInput) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Either image_url or image_base64 required'
    }), { status: 400, headers: corsHeaders });
  }
  
  const prediction = await createReplicatePrediction(
    MODELS.BACKGROUND_REMOVAL,
    {
      image: imageInput
    },
    env
  );
  
  return new Response(JSON.stringify({
    success: true,
    image_url: prediction.output,
    background: 'removed (transparent)',
    note: 'Image has transparent background. Use in image editor to add white/colored background.',
    prediction_id: prediction.id
  }, null, 2), { headers: corsHeaders });
}

async function handleProfessionalEnhancement(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { image_url, image_base64, item_type = 'clothing' } = body;
  
  const imageInput = image_url || image_base64;
  
  if (!imageInput) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Either image_url or image_base64 required'
    }), { status: 400, headers: corsHeaders });
  }
  
  const prompt = `professional e-commerce product photography, ${item_type} on pure white background, studio lighting, perfectly ironed with no wrinkles or folds, crisp and sharp, high resolution, Amazon product photo quality, clean and minimal`;
  
  const prediction = await createReplicatePrediction(
    MODELS.SDXL_IMG2IMG,
    {
      image: imageInput,
      prompt: prompt,
      negative_prompt: 'wrinkles, creases, folds, poor lighting, shadows, dark, blurry, low quality, distorted, cluttered background, dirty, stains',
      num_inference_steps: 50,
      guidance_scale: 8.0,
      strength: 0.7
    },
    env
  );
  
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  
  return new Response(JSON.stringify({
    success: true,
    enhanced_image_url: output,
    enhancements: [
      'Wrinkles removed',
      'Professional lighting',
      'Studio quality',
      'White background'
    ],
    prediction_id: prediction.id
  }, null, 2), { headers: corsHeaders });
}

async function handleImageUpscale(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { image_url, image_base64, scale = 2 } = body;
  
  const imageInput = image_url || image_base64;
  
  if (!imageInput) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Either image_url or image_base64 required'
    }), { status: 400, headers: corsHeaders });
  }
  
  const prediction = await createReplicatePrediction(
    MODELS.REAL_ESRGAN,
    {
      image: imageInput,
      scale: scale,
      face_enhance: false
    },
    env
  );
  
  return new Response(JSON.stringify({
    success: true,
    upscaled_image_url: prediction.output,
    scale: `${scale}x`,
    prediction_id: prediction.id
  }, null, 2), { headers: corsHeaders });
}

async function handleCustomEnhancement(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { 
    image_url, 
    image_base64, 
    prompt, 
    negative_prompt = '',
    strength = 0.7
  } = body;
  
  const imageInput = image_url || image_base64;
  
  if (!imageInput || !prompt) {
    return new Response(JSON.stringify({
      success: false,
      error: 'image_url/image_base64 and prompt required',
      example: {
        image_url: 'https://example.com/image.jpg',
        prompt: 'professional photo, no wrinkles, white background',
        strength: 0.7
      }
    }), { status: 400, headers: corsHeaders });
  }
  
  const prediction = await createReplicatePrediction(
    MODELS.SDXL_IMG2IMG,
    {
      image: imageInput,
      prompt: prompt,
      negative_prompt: negative_prompt || 'low quality, blurry, distorted',
      num_inference_steps: 50,
      guidance_scale: 7.5,
      strength: strength
    },
    env
  );
  
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  
  return new Response(JSON.stringify({
    success: true,
    enhanced_image_url: output,
    prompt_used: prompt,
    prediction_id: prediction.id
  }, null, 2), { headers: corsHeaders });
}

async function handleStatusCheck(request, env, corsHeaders) {
  const url = new URL(request.url);
  const predictionId = url.pathname.split('/').pop();
  
  if (!predictionId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Prediction ID required'
    }), { status: 400, headers: corsHeaders });
  }
  
  const status = await getPredictionStatus(predictionId, env);
  
  return new Response(JSON.stringify({
    success: true,
    prediction_id: predictionId,
    status: status.status,
    output: status.output,
    error: status.error,
    created_at: status.created_at,
    completed_at: status.completed_at
  }, null, 2), { headers: corsHeaders });
}