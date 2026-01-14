
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIAnalysisResult {
  priorityScore: number;
  reason: string;
  isDuplicate: boolean;
  duplicateId?: string;
  trendPrediction: string;
}

export const analyzeCivicReport = async (description: string, category: string): Promise<AIAnalysisResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this civic issue report for a national dashboard in India.
      Category: ${category}
      Description: ${description}
      
      Tasks:
      1. Assign a priority score from 1-10 (10 being most urgent).
      2. Provide a brief reason for the score.
      3. Check if it seems like a duplicate.
      4. Predict the trend.`,
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

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      priorityScore: 5,
      reason: "Automated analysis failed. Defaulting to standard priority.",
      isDuplicate: false,
      trendPrediction: "Data insufficient for prediction."
    };
  }
};
