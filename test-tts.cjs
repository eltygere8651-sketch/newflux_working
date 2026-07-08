const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: "Hola mundo",
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
    }
  });
  const b64 = response.candidates[0].content.parts[0].inlineData.data;
  const mime = response.candidates[0].content.parts[0].inlineData.mimeType;
  console.log("MIME: ", mime);
  console.log("B64 START: ", b64.substring(0, 50));
}
test().catch(console.error);
