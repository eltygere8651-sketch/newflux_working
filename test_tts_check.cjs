const { GoogleGenAI } = require("@google/genai");

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: "Hola, esto es una prueba." }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    });
    console.log("Success! Audio data length:", response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.length);
  } catch (err) {
    console.error("Error calling Gemini TTS:", err);
  }
}

run();
