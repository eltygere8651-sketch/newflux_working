const { GoogleGenAI } = require("@google/genai");
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
  
  const pcmBuffer = Buffer.from(b64, "base64");
  const sampleRate = 24000;
  const numChannels = 1;
  const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); 
  wavBuffer.writeUInt16LE(1, 20); 
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(sampleRate * numChannels * 2, 28); 
  wavBuffer.writeUInt16LE(numChannels * 2, 32); 
  wavBuffer.writeUInt16LE(16, 34); 
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(pcmBuffer.length, 40);
  pcmBuffer.copy(wavBuffer, 44);
  
  const finalB64 = wavBuffer.toString("base64");
  console.log("FINAL B64 length:", finalB64.length);
}
test().catch(console.error);
