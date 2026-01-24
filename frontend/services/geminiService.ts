import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateTravelAdvice = async (
  prompt: string,
  context?: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    console.warn("Gemini API Key missing");
    return "I am currently offline (API Key missing). Please check your configuration.";
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
      model: 'gemini-1.5-flash',
      contents: fullPrompt,
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("API Error:", error);
    return "Service is currently experiencing issues. Please try again later.";
  }
};

export const parseTravelIntent = async (text: string): Promise<any> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const prompt = `
       Extract travel details from this text into JSON: "${text}".
       Return ONLY JSON. Keys: origin (city name), destination (city name), date (YYYY-MM-DD if mentioned, else today's date formatted), passengers (number).
       If a field is missing, use null.
     `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Intent parsing error", e);
    return null;
  }
};