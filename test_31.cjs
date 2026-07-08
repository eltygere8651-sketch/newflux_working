const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts",
      contents: [{ parts: [{ text: "¡Ey! Soy Sofía." }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
        }
      }
    });
    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (rawBase64) {
      console.log("Success with Puck!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
