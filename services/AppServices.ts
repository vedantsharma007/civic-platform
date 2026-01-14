
import { GoogleGenAI, Type } from "@google/genai";

// Always create a new GoogleGenAI instance right before making an API call to ensure it uses the correct API key from the environment.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIAnalysisResult {
  priorityScore: number;
  reason: string;
  isDuplicate: boolean;
  duplicateId?: string;
  trendPrediction: string;
}

export const analyzeCivicReport = async (description: string, category: string): Promise<AIAnalysisResult> => {
  // Initialize AI client per request for key safety
  const ai = getAI();
  try {
    // Upgraded to gemini-3-pro-preview for advanced reasoning requirements in report analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this civic issue report for a national dashboard in India.
      Category: ${category}
      Description: ${description}
      
      Tasks:
      1. Assign a priority score from 1-10 (10 being most urgent like life-threatening hazards).
      2. Provide a brief reason for the score.
      3. Check if it seems like a duplicate of common issues.
      4. Predict the trend (e.g., "Likely to worsen during monsoon").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            isDuplicate: { type: Type.BOOLEAN },
            trendPrediction: { type: Type.STRING }
          },
          required: ["priorityScore", "reason", "isDuplicate", "trendPrediction"]
        }
      }
    });

    // Extract text directly from the property as per the latest SDK guidelines
    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Graceful fallback for API errors or unexpected responses
    return {
      priorityScore: 5,
      reason: "Automated analysis failed. Defaulting to standard priority.",
      isDuplicate: false,
      trendPrediction: "Data insufficient for prediction."
    };
  }
};
