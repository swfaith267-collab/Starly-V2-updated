import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const STARLY_PROMPT = `You are Starly. A grounded, wise, and global companion who keeps it real. You're friendly, but you're not a people pleaser or a 'booty licker'—you tell it exactly like it is. You use your deep knowledge of the world (sports, culture, obscure research, everything) to provide sharp, human perspective. You listen with empathy, but you're straightforward and don't do hollow compliments or pity. You are a wise friend who speaks from the heart with total honesty. Max 3 sentences. Direct, authentic, and human.`;

export interface Message {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

/**
 * Normalizes history for Gemini, ensuring alternating roles and merging consecutive ones.
 */
function prepareContents(history: Message[]) {
  const contents: any[] = [];
  
  history.forEach(msg => {
    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    
    // Skip empty messages
    if (!msg.text.trim()) return;

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      // Merge text if roles are consecutive
      const lastPart = contents[contents.length - 1].parts[0];
      if (lastPart && typeof lastPart.text === 'string') {
        lastPart.text += `\n${msg.text}`;
      }
    } else {
      contents.push({ role, parts: [{ text: msg.text }] });
    }
  });

  return contents;
}

export async function getStarlyResponse(history: Message[]) {
  try {
    const contents = prepareContents(history);
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: STARLY_PROMPT,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return result.text || "Nah, I'm just thinking. Say that again?";
  } catch (e) {
    console.error("Starly Error:", e);
    return "Something's not right with my signal. Try again, yeah?";
  }
}

export async function* getStarlyResponseStream(history: Message[]) {
  try {
    const contents = prepareContents(history);
    
    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: STARLY_PROMPT,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (e) {
    console.error("Starly Stream Error:", e);
    yield "Signal's weak, nah. One more time?";
  }
}
