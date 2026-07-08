const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: "¡Ey! Soy Sofía." }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
        }
      }
    });
    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (rawBase64) {
      console.log("Success with Aoede!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
