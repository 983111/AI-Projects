import { OutfitSuggestion, TrendReport } from "../types";

/**
 * Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://styfi-backend.vishwajeetadkine705.workers.dev';

/**
 * Utility function to convert File to base64 string
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Fallback data for when API calls fail
 */
const FALLBACK_TRENDS: TrendReport[] = [
  { 
    trendName: "Eco-Minimalism", 
    description: "Sustainable fabrics in neutral tones with clean lines.", 
    popularityScore: 88, 
    keyKeywords: ["Linen", "Beige", "Organic", "Sustainable"] 
  },
  { 
    trendName: "Retro Sport", 
    description: "90s athletic wear revival with bold colors.", 
    popularityScore: 75, 
    keyKeywords: ["Windbreaker", "Neon", "Chunky Sneakers", "Vintage"] 
  },
  { 
    trendName: "Modern Tailoring", 
    description: "Structured pieces with contemporary silhouettes.", 
    popularityScore: 82, 
    keyKeywords: ["Blazer", "Wide-leg", "Minimal", "Structured"] 
  }
];

const FALLBACK_OUTFIT_SUGGESTIONS: OutfitSuggestion[] = [
  {
    name: "Classic Denim Jeans",
    reason: "A timeless piece that pairs well with most tops, creating a balanced casual look.",
    estimatedPrice: "$60-$90",
    color: "Dark Blue"
  },
  {
    name: "White Canvas Sneakers",
    reason: "Versatile footwear that complements the outfit while keeping it comfortable and stylish.",
    estimatedPrice: "$50-$80",
    color: "White"
  },
  {
    name: "Leather Crossbody Bag",
    reason: "Adds a sophisticated touch and practical functionality to complete the ensemble.",
    estimatedPrice: "$70-$120",
    color: "Tan"
  }
];

/**
 * Fetch trend analysis for a given category
 */
export const getTrends = async (category: string): Promise<TrendReport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trends`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trends API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : FALLBACK_TRENDS;
    
  } catch (error) {
    console.error("Error fetching trends:", error);
    return FALLBACK_TRENDS;
  }
};

/**
 * Get outfit composition suggestions for a product
 */
export const composeOutfit = async (
  productName: string, 
  productCategory: string
): Promise<OutfitSuggestion[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compose-outfit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName, productCategory })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Compose outfit API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : FALLBACK_OUTFIT_SUGGESTIONS;
    
  } catch (error) {
    console.error("Error composing outfit:", error);
    return FALLBACK_OUTFIT_SUGGESTIONS;
  }
};

/**
 * Enhance product image using AI
 */
export const enhanceProductImage = async (
  imageFile: File, 
  description: string
): Promise<{type: 'image' | 'guide', data: string} | null> => {
  try {
    const base64Data = await fileToGenerativePart(imageFile);
    
    const response = await fetch(`${API_BASE_URL}/api/enhance-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64Data,
        mimeType: imageFile.type,
        description
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Enhance image API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle image response
    if (data.method === 'imagen' && data.imageData) {
      return {
        type: 'image',
        data: `data:${data.mimeType};base64,${data.imageData}`
      };
    } 
    
    // Handle guide response
    if (data.method === 'guide' && data.enhancementGuide) {
      return {
        type: 'guide',
        data: data.enhancementGuide
      };
    }
    
    throw new Error('Unexpected response format from API');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error enhancing image:", error);
    alert(`Enhancement failed: ${errorMessage}. Please try again later.`);
    return null;
  }
};

/**
 * Generate virtual try-on preview
 */
export const tryOnVirtual = async (
  userImage: File, 
  productImage: string
): Promise<{type: 'image' | 'guide', data: string} | null> => {
  try {
    // Convert user image to base64
    const userBase64 = await fileToGenerativePart(userImage);
    
    // Fetch and convert product image to base64
    const productBase64 = await fetchImageAsBase64(productImage);
    
    if (!productBase64) {
      throw new Error("Failed to process product image");
    }

    const response = await fetch(`${API_BASE_URL}/api/virtual-tryon`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userImageData: userBase64,
        userMimeType: userImage.type,
        productImageData: productBase64,
        productMimeType: "image/jpeg"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Virtual try-on API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle image response
    if (data.method === 'imagen' && data.imageData) {
      return {
        type: 'image',
        data: `data:${data.mimeType};base64,${data.imageData}`
      };
    }
    
    // Handle guide response
    if (data.method === 'guide' && data.visualizationGuide) {
      return {
        type: 'guide',
        data: data.visualizationGuide
      };
    }
    
    throw new Error('Unexpected response format from API');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in virtual try-on:", error);
    alert(`Virtual try-on failed: ${errorMessage}. Please try again later.`);
    return null;
  }
};

/**
 * Helper function to fetch an image URL and convert to base64
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], "product.jpg", { type: blob.type });
    return await fileToGenerativePart(file);
    
  } catch (error) {
    console.error("Error fetching product image:", error);
    return null;
  }
}
