import { GoogleGenAI } from "@google/genai";

async function generateAppImage() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A high-quality, modern UI/UX dashboard design for a 'Smart Farm' management app called 'Fazenda Inteligente'. The interface features a clean, minimalist aesthetic. It includes a category navigation bar with icons for cattle, tractors, and crops. The main section shows a 'GADO DE CORTE' (Beef Cattle) category with a bold, uppercase title in a white glassmorphism container. There are cards for individual animals with photos, health status tags, and quantities. The color palette uses zinc, emerald green, and white. Professional, sleek, and functional design, mobile responsive view.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export { generateAppImage };
