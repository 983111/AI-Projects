// ==================== CLOUDFLARE WORKER - FASHION TRENDS API ====================
// Uses: Google Trends (SerpAPI) + Groq AI Analysis
// Secrets needed: SERPAPI_KEY, GROQ_API_KEY

const FASHION_KEYWORDS = [
  'y2k fashion', 'cargo pants', 'oversized blazer', 'baby tee', 
  'wide leg jeans', 'corset top', 'maxi skirt', 'leather jacket',
  'platform sneakers', 'midi dress', 'crop cardigan', 'puff sleeve',
  'satin dress', 'knit vest', 'high waisted shorts', 'trench coat',
  'mini skirt', 'boyfriend jeans', 'halter top', 'mom jeans',
  'bucket hat', 'chunky loafers', 'slip dress', 'denim jacket',
  'ballet flats', 'pleated skirt', 'crop top', 'wide leg pants'
];

const CLOTHING_CATEGORIES = {
  tops: ['tee', 'blouse', 'top', 'shirt', 'sweater', 'cardigan', 'hoodie', 'vest', 'halter'],
  bottoms: ['jeans', 'pants', 'shorts', 'skirt', 'trousers', 'leggings'],
  dresses: ['dress', 'gown', 'romper', 'jumpsuit', 'slip dress'],
  outerwear: ['jacket', 'coat', 'blazer', 'trench'],
  footwear: ['shoes', 'boots', 'sneakers', 'heels', 'sandals', 'loafers', 'flats'],
  accessories: ['hat', 'bag', 'belt', 'scarf', 'jewelry']
};

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
      // Main trending endpoint
      if (path === '/api/trends/realtime') {
        return handleRealTimeTrends(request, env, corsHeaders);
      }
      
      // Search specific trend
      if (path === '/api/trends/search') {
        return handleSearchTrend(request, env, corsHeaders);
      }
      
      // Get detailed item analysis
      if (path.startsWith('/api/trends/item/')) {
        return handleItemDetails(request, env, corsHeaders);
      }
      
      // AI-powered seller recommendations
      if (path === '/api/seller/recommendations') {
        return handleSellerRecommendations(request, env, corsHeaders);
      }
      
      // Buyer discovery feed
      if (path === '/api/buyer/discover') {
        return handleBuyerDiscover(request, env, corsHeaders);
      }
      
      // Analytics overview
      if (path === '/api/analytics/overview') {
        return handleAnalytics(request, env, corsHeaders);
      }
      
      // Compare multiple items
      if (path === '/api/trends/compare') {
        return handleCompare(request, env, corsHeaders);
      }
      
      // AI trend analysis
      if (path === '/api/trends/ai-analyze') {
        return handleAIAnalysis(request, env, corsHeaders);
      }
      
      // Regional trends
      if (path === '/api/trends/regional') {
        return handleRegionalTrends(request, env, corsHeaders);
      }
      
      // API documentation
      if (path === '/' || path === '/api') {
        return new Response(JSON.stringify({
          service: 'Fashion Trend Detector API',
          version: '2.0.0',
          powered_by: ['Google Trends (SerpAPI)', 'Groq AI (Llama 3.3 70B)'],
          endpoints: {
            'GET /api/trends/realtime': 'Real-time trending items',
            'GET /api/trends/search?q=item': 'Search specific trend',
            'GET /api/trends/item/:keyword': 'Detailed trend analysis',
            'POST /api/seller/recommendations': 'AI seller recommendations',
            'GET /api/buyer/discover': 'Buyer discovery feed',
            'GET /api/analytics/overview': 'Market analytics',
            'POST /api/trends/compare': 'Compare multiple items',
            'POST /api/trends/ai-analyze': 'AI trend insights',
            'GET /api/trends/regional?geo=US': 'Regional trends'
          },
          example_usage: {
            realtime: 'GET /api/trends/realtime?limit=10&category=tops',
            search: 'GET /api/trends/search?q=cargo+pants',
            compare: 'POST /api/trends/compare {"items": ["cargo pants", "wide leg jeans"]}'
          }
        }, null, 2), { headers: corsHeaders });
      }
      
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: corsHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        hint: 'Check if SERPAPI_KEY and GROQ_API_KEY are set'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

// ==================== GOOGLE TRENDS API ====================

async function fetchGoogleTrends(keyword, env, geo = 'US') {
  const apiKey = env.SERPAPI_KEY;
  
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured');
  }
  
  const url = `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=${geo}&data_type=TIMESERIES&api_key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SerpAPI error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

async function fetchRelatedQueries(keyword, env, geo = 'US') {
  const apiKey = env.SERPAPI_KEY;
  const url = `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=${geo}&data_type=RELATED_QUERIES&api_key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) return null;
  
  return await response.json();
}

async function fetchInterestByRegion(keyword, env) {
  const apiKey = env.SERPAPI_KEY;
  const url = `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&data_type=GEO_MAP&api_key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) return null;
  
  return await response.json();
}

// ==================== GROQ AI ====================

async function analyzeWithGroq(prompt, env, data = null) {
  const apiKey = env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  const messages = [
    {
      role: 'system',
      content: 'You are a fashion trend analyst. Provide insights on clothing trends, market opportunities, and recommendations. Always return valid JSON only, no markdown or extra text.'
    },
    {
      role: 'user',
      content: data ? `${prompt}\n\nData: ${JSON.stringify(data)}` : prompt
    }
  ];
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.3,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  const content = result.choices[0]?.message?.content || '{}';
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { error: 'No valid JSON in AI response', raw: content };
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return { error: 'Failed to parse AI response', raw: content };
  }
}

// ==================== ENDPOINT HANDLERS ====================

async function handleRealTimeTrends(request, env, corsHeaders) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '15');
  const category = url.searchParams.get('category');
  const geo = url.searchParams.get('geo') || 'US';
  
  // Select keywords to fetch
  let keywords = [...FASHION_KEYWORDS];
  
  if (category && CLOTHING_CATEGORIES[category]) {
    keywords = keywords.filter(k => 
      CLOTHING_CATEGORIES[category].some(term => k.includes(term))
    );
  }
  
  keywords = keywords.slice(0, Math.min(limit, 25));
  
  // Fetch trends in parallel
  const trendPromises = keywords.map(keyword => 
    fetchGoogleTrends(keyword, env, geo)
      .then(data => ({ keyword, data, success: true }))
      .catch(error => ({ keyword, error: error.message, success: false }))
  );
  
  const results = await Promise.all(trendPromises);
  
  // Process successful results
  const trends = results
    .filter(r => r.success && r.data.interest_over_time)
    .map((result, index) => {
      const timeData = result.data.interest_over_time?.timeline_data || [];
      const latest = timeData[timeData.length - 1];
      const previous = timeData[timeData.length - 2];
      
      const currentValue = latest?.values?.[0]?.value || 0;
      const previousValue = previous?.values?.[0]?.value || 0;
      const growth = previousValue > 0 
        ? Math.round(((currentValue - previousValue) / previousValue) * 100)
        : 0;
      
      return {
        id: index + 1,
        item: formatItemName(result.keyword),
        keyword: result.keyword,
        category: detectCategory(result.keyword),
        trend_score: currentValue,
        growth_rate: growth,
        search_volume: currentValue * 10000,
        price_range: estimatePriceRange(result.keyword),
        demographics: estimateDemographics(result.keyword),
        season: detectSeason(result.keyword),
        style_tags: detectStyle(result.keyword),
        last_updated: latest?.timestamp || new Date().toISOString()
      };
    })
    .sort((a, b) => b.trend_score - a.trend_score);
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    total: trends.length,
    region: geo,
    data: trends,
    metadata: {
      avg_trend_score: Math.round(trends.reduce((sum, t) => sum + t.trend_score, 0) / trends.length) || 0,
      avg_growth: Math.round(trends.reduce((sum, t) => sum + t.growth_rate, 0) / trends.length) || 0,
      hottest_category: getMostTrendingCategory(trends),
      data_source: 'Google Trends via SerpAPI'
    }
  }, null, 2), { headers: corsHeaders });
}

async function handleSearchTrend(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const geo = url.searchParams.get('geo') || 'US';
  
  if (!query) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Query parameter "q" is required'
    }), { status: 400, headers: corsHeaders });
  }
  
  // Fetch trend data and related queries
  const [trendData, relatedData] = await Promise.all([
    fetchGoogleTrends(query, env, geo),
    fetchRelatedQueries(query, env, geo)
  ]);
  
  const timeData = trendData.interest_over_time?.timeline_data || [];
  const latest = timeData[timeData.length - 1];
  const previous = timeData[timeData.length - 2];
  
  const currentValue = latest?.values?.[0]?.value || 0;
  const previousValue = previous?.values?.[0]?.value || 0;
  const growth = previousValue > 0 
    ? Math.round(((currentValue - previousValue) / previousValue) * 100)
    : 0;
  
  return new Response(JSON.stringify({
    success: true,
    query: query,
    trend_data: {
      item: formatItemName(query),
      category: detectCategory(query),
      trend_score: currentValue,
      growth_rate: growth,
      search_volume: currentValue * 10000,
      price_range: estimatePriceRange(query),
      style_tags: detectStyle(query),
      season: detectSeason(query)
    },
    related_queries: {
      top: (relatedData?.related_queries?.top || []).slice(0, 10),
      rising: (relatedData?.related_queries?.rising || []).slice(0, 10)
    },
    timeline: timeData.slice(-30).map(t => ({
      date: t.timestamp,
      value: t.values[0]?.value || 0
    }))
  }, null, 2), { headers: corsHeaders });
}

async function handleItemDetails(request, env, corsHeaders) {
  const url = new URL(request.url);
  const keyword = decodeURIComponent(url.pathname.split('/').pop());
  const geo = url.searchParams.get('geo') || 'US';
  
  // Fetch all data types for the item
  const [trendData, relatedData, regionData] = await Promise.all([
    fetchGoogleTrends(keyword, env, geo),
    fetchRelatedQueries(keyword, env, geo),
    fetchInterestByRegion(keyword, env)
  ]);
  
  const timeData = trendData.interest_over_time?.timeline_data || [];
  const latest = timeData[timeData.length - 1];
  const currentValue = latest?.values?.[0]?.value || 0;
  
  // Get AI insights
  const aiInsights = await analyzeWithGroq(
    `Analyze this fashion trend: "${keyword}" with current Google Trends score of ${currentValue}/100. 
    Provide: 1) Why it's trending 2) Target demographics 3) Best selling strategies 4) Price recommendations. 
    Return JSON: {reason: "", demographics: "", strategies: [], price_tips: ""}`,
    env
  );
  
  return new Response(JSON.stringify({
    success: true,
    item: formatItemName(keyword),
    details: {
      category: detectCategory(keyword),
      style_tags: detectStyle(keyword),
      season: detectSeason(keyword),
      current_trend_score: currentValue,
      price_range: estimatePriceRange(keyword),
      demographics: estimateDemographics(keyword)
    },
    trend_timeline: timeData.slice(-90).map(t => ({
      date: t.timestamp,
      value: t.values[0]?.value || 0
    })),
    top_regions: (regionData?.interest_by_region || []).slice(0, 10),
    related_queries: {
      top: relatedData?.related_queries?.top || [],
      rising: relatedData?.related_queries?.rising || []
    },
    ai_insights: aiInsights
  }, null, 2), { headers: corsHeaders });
}

async function handleSellerRecommendations(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { budget, style_preference, target_market } = body;
  
  // Fetch current trends
  const keywords = FASHION_KEYWORDS.slice(0, 20);
  const trendPromises = keywords.map(k => 
    fetchGoogleTrends(k, env)
      .then(data => ({ keyword: k, data, success: true }))
      .catch(() => ({ keyword: k, success: false }))
  );
  
  const results = await Promise.all(trendPromises);
  
  const trendData = results
    .filter(r => r.success && r.data.interest_over_time)
    .map(r => {
      const timeData = r.data.interest_over_time?.timeline_data || [];
      const latest = timeData[timeData.length - 1];
      return {
        keyword: r.keyword,
        score: latest?.values?.[0]?.value || 0,
        category: detectCategory(r.keyword),
        price_range: estimatePriceRange(r.keyword)
      };
    })
    .sort((a, b) => b.score - a.score);
  
  // Get AI recommendations
  const aiRecommendations = await analyzeWithGroq(
    `Based on these trending items: ${JSON.stringify(trendData.slice(0, 10))}.
    Budget: $${budget || 'unlimited'}
    Style: ${style_preference || 'any'}
    Market: ${target_market || 'general'}
    
    Recommend top 5 products to sell with profit potential, demand level, and why.
    Return JSON: {recommendations: [{product: "", reason: "", profit_potential: 0-100, demand: ""}]}`,
    env,
    trendData.slice(0, 10)
  );
  
  return new Response(JSON.stringify({
    success: true,
    recommendations: aiRecommendations.recommendations || [],
    market_insights: {
      top_trending_categories: [...new Set(trendData.slice(0, 10).map(t => t.category))],
      avg_trend_score: Math.round(trendData.slice(0, 10).reduce((sum, t) => sum + t.score, 0) / 10),
      powered_by: 'Groq AI + Google Trends'
    }
  }, null, 2), { headers: corsHeaders });
}

async function handleBuyerDiscover(request, env, corsHeaders) {
  const url = new URL(request.url);
  const style = url.searchParams.get('style');
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  let keywords = [...FASHION_KEYWORDS];
  
  if (style) {
    keywords = keywords.filter(k => k.includes(style.toLowerCase()));
  }
  
  if (category && CLOTHING_CATEGORIES[category]) {
    keywords = keywords.filter(k => 
      CLOTHING_CATEGORIES[category].some(term => k.includes(term))
    );
  }
  
  keywords = keywords.slice(0, limit);
  
  const trendPromises = keywords.map(k => 
    fetchGoogleTrends(k, env)
      .then(data => ({ keyword: k, data, success: true }))
      .catch(() => ({ keyword: k, success: false }))
  );
  
  const results = await Promise.all(trendPromises);
  
  const feed = results
    .filter(r => r.success && r.data.interest_over_time)
    .map(result => {
      const timeData = result.data.interest_over_time?.timeline_data || [];
      const latest = timeData[timeData.length - 1];
      const currentValue = latest?.values?.[0]?.value || 0;
      
      return {
        item: formatItemName(result.keyword),
        category: detectCategory(result.keyword),
        trend_score: currentValue,
        popularity_badge: currentValue > 80 ? '🔥 Hot' : currentValue > 60 ? '⭐ Trending' : '📈 Rising',
        price_range: estimatePriceRange(result.keyword),
        style_tags: detectStyle(result.keyword),
        why_trending: `${currentValue}/100 Google Trends score`
      };
    })
    .sort((a, b) => b.trend_score - a.trend_score);
  
  return new Response(JSON.stringify({
    success: true,
    total: feed.length,
    feed: feed
  }, null, 2), { headers: corsHeaders });
}

async function handleAnalytics(request, env, corsHeaders) {
  const keywords = FASHION_KEYWORDS.slice(0, 20);
  
  const trendPromises = keywords.map(k => 
    fetchGoogleTrends(k, env)
      .then(data => {
        const timeData = data.interest_over_time?.timeline_data || [];
        const latest = timeData[timeData.length - 1];
        return latest?.values?.[0]?.value || 0;
      })
      .catch(() => 0)
  );
  
  const scores = await Promise.all(trendPromises);
  const validScores = scores.filter(s => s > 0);
  
  const avgScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;
  
  // Category breakdown
  const categoryScores = {};
  keywords.forEach((k, i) => {
    const cat = detectCategory(k);
    if (!categoryScores[cat]) categoryScores[cat] = [];
    categoryScores[cat].push(scores[i]);
  });
  
  const categoryAvg = {};
  Object.keys(categoryScores).forEach(cat => {
    const catScores = categoryScores[cat].filter(s => s > 0);
    categoryAvg[cat] = catScores.length > 0 
      ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length)
      : 0;
  });
  
  return new Response(JSON.stringify({
    success: true,
    overview: {
      total_items_tracked: validScores.length,
      avg_trend_score: avgScore,
      highest_score: Math.max(...validScores),
      lowest_score: Math.min(...validScores.filter(s => s > 0)),
      data_source: 'Google Trends',
      last_updated: new Date().toISOString()
    },
    category_breakdown: categoryAvg,
    top_5_trends: keywords
      .map((k, i) => ({ item: formatItemName(k), score: scores[i] }))
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, null, 2), { headers: corsHeaders });
}

async function handleCompare(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { items } = body;
  
  if (!items || !Array.isArray(items)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Items array is required. Example: {"items": ["cargo pants", "jeans"]}'
    }), { status: 400, headers: corsHeaders });
  }
  
  const comparisons = await Promise.all(
    items.map(async item => {
      try {
        const data = await fetchGoogleTrends(item, env);
        const timeData = data.interest_over_time?.timeline_data || [];
        const latest = timeData[timeData.length - 1];
        const previous = timeData[timeData.length - 2];
        
        const currentValue = latest?.values?.[0]?.value || 0;
        const previousValue = previous?.values?.[0]?.value || 0;
        const growth = previousValue > 0 
          ? Math.round(((currentValue - previousValue) / previousValue) * 100)
          : 0;
        
        return {
          item: item,
          trend_score: currentValue,
          growth_rate: growth,
          category: detectCategory(item),
          status: currentValue > 70 ? 'Hot' : currentValue > 50 ? 'Trending' : 'Stable'
        };
      } catch (error) {
        return {
          item: item,
          trend_score: 0,
          error: 'Data unavailable'
        };
      }
    })
  );
  
  return new Response(JSON.stringify({
    success: true,
    comparison: comparisons.sort((a, b) => b.trend_score - a.trend_score),
    winner: comparisons.reduce((a, b) => a.trend_score > b.trend_score ? a : b).item
  }, null, 2), { headers: corsHeaders });
}

async function handleAIAnalysis(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST method required' }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  const body = await request.json().catch(() => ({}));
  const { query, context } = body;
  
  if (!query) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Query field is required'
    }), { status: 400, headers: corsHeaders });
  }
  
  const analysis = await analyzeWithGroq(query, env, context);
  
  return new Response(JSON.stringify({
    success: true,
    query: query,
    analysis: analysis,
    powered_by: 'Groq AI (Llama 3.3 70B)'
  }, null, 2), { headers: corsHeaders });
}

async function handleRegionalTrends(request, env, corsHeaders) {
  const url = new URL(request.url);
  const geo = url.searchParams.get('geo') || 'US';
  const keyword = url.searchParams.get('q') || 'fashion trends';
  
  const regionData = await fetchInterestByRegion(keyword, env);
  
  return new Response(JSON.stringify({
    success: true,
    keyword: keyword,
    region: geo,
    regional_interest: regionData?.interest_by_region || [],
    note: 'Shows which regions have highest interest in this trend'
  }, null, 2), { headers: corsHeaders });
}

// ==================== HELPER FUNCTIONS ====================

function detectCategory(keyword) {
  const lower = keyword.toLowerCase();
  for (const [category, terms] of Object.entries(CLOTHING_CATEGORIES)) {
    if (terms.some(term => lower.includes(term))) {
      return category;
    }
  }
  return 'general';
}

function detectStyle(keyword) {
  const lower = keyword.toLowerCase();
  const styles = [];
  
  if (lower.includes('y2k')) styles.push('y2k');
  if (lower.includes('cargo') || lower.includes('utility')) styles.push('streetwear');
  if (lower.includes('blazer') || lower.includes('trousers')) styles.push('business');
  if (lower.includes('oversized')) styles.push('streetwear');
  if (lower.includes('vintage') || lower.includes('retro')) styles.push('vintage');
  if (lower.includes('leather') || lower.includes('edgy')) styles.push('edgy');
  if (lower.includes('cottage') || lower.includes('prairie')) styles.push('cottagecore');
  if (lower.includes('minimal') || lower.includes('clean')) styles.push('minimalist');
  
  return styles.length > 0 ? styles : ['casual'];
}

function detectSeason(keyword) {
  const lower = keyword.toLowerCase();
  if (lower.includes('shorts') || lower.includes('tank') || lower.includes('sandal')) return 'summer';
  if (lower.includes('coat') || lower.includes('sweater') || lower.includes('boot')) return 'winter';
  if (lower.includes('jacket') || lower.includes('cardigan')) return 'fall';
  if (lower.includes('light') || lower.includes('floral')) return 'spring';
  return 'all-season';
}

function estimatePriceRange(keyword) {
  const lower = keyword.toLowerCase();
  if (lower.includes('luxury') || lower.includes('leather') || lower.includes('designer')) 
    return [100, 300];
  if (lower.includes('premium') || lower.includes('blazer') || lower.includes('coat')) 
    return [60, 150];
  if (lower.includes('basic') || lower.includes('tee') || lower.includes('tank')) 
    return [15, 40];
  return [30, 80];
}

function estimateDemographics(keyword) {
  const lower = keyword.toLowerCase();
  if (lower.includes('y2k') || lower.includes('baby') || lower.includes('mini')) 
    return '18-25';
  if (lower.includes('blazer') || lower.includes('trousers') || lower.includes('professional')) 
    return '25-40';
  if (lower.includes('classic') || lower.includes('elegant')) 
    return '30-50';
  return '18-35';
}

function formatItemName(keyword) {
  return keyword
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMostTrendingCategory(trends) {
  const counts = {};
  trends.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + item.trend_score;
  });
  return Object.keys(counts).length > 0 
    ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    : 'N/A';
}