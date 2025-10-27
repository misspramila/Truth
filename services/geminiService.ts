import { GoogleGenAI } from "@google/genai";
// FIX: Enums were imported with `import type`, which prevents their use as values. Changed to a regular import.
import { GroundingChunk, AnalysisResult, Classification, Sentiment, Bias } from '../types';

const getClassificationFromString = (classification?: string): Classification => {
  if (!classification) return Classification.UNCERTAIN;
  const lowerClass = classification.toLowerCase();
  if (lowerClass.includes('real') || lowerClass.includes('true')) return Classification.REAL;
  if (lowerClass.includes('fake') || lowerClass.includes('false')) return Classification.FAKE;
  return Classification.UNCERTAIN;
}

export const checkTruth = async (claim: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // FIX: The `responseSchema` and `responseMimeType` properties are not allowed when using the `googleSearch` tool.
  // The schema is now included in the prompt to instruct the model to return JSON.
  const prompt = `You are a meticulous and unbiased fact-checking AI. Your sole purpose is to analyze the truthfulness of the following claim and provide a detailed, structured analysis in JSON format. Do not include any text, explanations, or markdown formatting like \`\`\`json around the JSON object.

Claim to analyze: "${claim}"

Your response must be a single JSON object that conforms to this schema:
{
  "type": "OBJECT",
  "properties": {
    "classification": { "type": "STRING", "description": "A one-word classification: 'Real', 'Fake', or 'Uncertain'.", "enum": ["Real", "Fake", "Uncertain"] },
    "reasoning": { "type": "STRING", "description": "A concise, neutral, and evidence-based explanation for the classification. Cite facts and avoid opinions." },
    "topic": { "type": "STRING", "description": "The main topic or subject matter of the claim, e.g., 'Politics', 'Health', 'Science'." },
    "keywords": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3-5 relevant keywords from the claim." },
    "confidence": { "type": "INTEGER", "description": "A confidence score from 0 to 100 on the accuracy of the analysis." },
    "sentiment": { "type": "STRING", "description": "The overall sentiment of the claim: 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.", "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"] },
    "bias": { "type": "STRING", "description": "The potential political bias of the claim: 'LEFT', 'RIGHT', 'CENTER', or 'NEUTRAL'.", "enum": ["LEFT", "RIGHT", "CENTER", "NEUTRAL"] }
  },
  "required": ["classification", "reasoning", "confidence", "topic", "keywords", "sentiment", "bias"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();
    }
    
    if (!jsonText) {
      throw new Error("Received an empty response from the AI.");
    }

    const analysisData = JSON.parse(jsonText);
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = (groundingMetadata?.groundingChunks as GroundingChunk[] || []).filter(chunk => chunk.web);

    const result: AnalysisResult = {
      ...analysisData,
      classification: getClassificationFromString(analysisData.classification),
      sources: sources,
    };
    
    if (analysisData.sentiment && !Object.values(Sentiment).includes(analysisData.sentiment)) {
        delete result.sentiment;
    }
    if (analysisData.bias && !Object.values(Bias).includes(analysisData.bias)) {
        delete result.bias;
    }

    return result;

  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    if (error instanceof SyntaxError) {
      return Promise.reject(new Error("The AI returned a malformed analysis. Please try again."));
    }
    if (error instanceof Error) {
        return Promise.reject(new Error(`Failed to get a response from the AI: ${error.message}`));
    }
    return Promise.reject(new Error("An unknown error occurred while contacting the AI."));
  }
};
