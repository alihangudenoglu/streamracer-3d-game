import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePreRaceHype = async (playerNames: string[]): Promise<string> => {
  if (!process.env.API_KEY) return "Yarışçılar başlangıç çizgisinde! Heyecan dorukta!";

  try {
    const namesList = playerNames.slice(0, 5).join(", ");
    const count = playerNames.length;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Sen enerjik bir Türk Espor spikerisin. Birazdan ${count} yarışçının katılacağı büyük bir bilye yarışı başlayacak. Öne çıkan isimler arasında şunlar var: ${namesList}. 
      Yarışı başlatmak için çok kısa, 2 cümlelik, gaz verici ve heyecanlı bir giriş konuşması yap. Tamamen Türkçe konuş.`,
    });

    return response.text || "Yarışçılar yerlerini aldı! Nefesler tutuldu, büyük yarış başlıyor!";
  } catch (error) {
    console.error("Gemini Hatası:", error);
    return "Yarışçılar hazır! 3... 2... 1... BAŞLA!";
  }
};

export const generateWinnerCommentary = async (winnerName: string, runnerUp: string): Promise<string> => {
  if (!process.env.API_KEY) return `${winnerName} şampiyon oldu! İnanılmaz bir yarıştı!`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Sen enerjik bir Türk Espor spikerisin. Bilye yarışı az önce bitti.
      Kazanan: ${winnerName}.
      İkinci: ${runnerUp}.
      Kazananı tebrik eden ve ikinciye kısaca değinen çok kısa, 2 cümlelik coşkulu bir kapanış konuşması yap. Tamamen Türkçe konuş.`,
    });

    return response.text || `${winnerName} kazandı! ${runnerUp} hemen arkasındaydı, harika bir mücadele!`;
  } catch (error) {
    console.error("Gemini Hatası:", error);
    return `${winnerName} bitiş çizgisini ilk geçen isim oldu! Muazzam bir performans!`;
  }
};