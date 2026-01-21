import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTravelAdvice = async (
  prompt: string,
  context?: string
): Promise<string> => {
  if (!apiKey) {
    return "Service unavailable. Please check configuration.";
  }

  try {
    const fullPrompt = `
      You are RailRover's helpful Travel Assistant.
      User Context: ${context || 'None provided.'}
      User Question: ${prompt}

      Keep your answer concise (under 100 words), helpful, and focused on train travel, destinations, or packing tips.
      Be friendly and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("API Error:", error);
    return "Service is currently experiencing issues. Please try again later.";
  }
};

export const parseTravelIntent = async (text: string): Promise<any> => {
   if (!apiKey) return null;

   try {
     const prompt = `
       Extract travel details from this text into JSON: "${text}".
       Return ONLY JSON. Keys: origin (city name), destination (city name), date (YYYY-MM-DD if mentioned, else today's date formatted), passengers (number).
       If a field is missing, use null.
     `;

     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: prompt,
       config: { responseMimeType: 'application/json' }
     });

     return JSON.parse(response.text || '{}');
   } catch (e) {
     console.error("Intent parsing error", e);
     return null;
   }
};