
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageStyle, ModelType, ImageSize } from "../types";

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  style: ImageStyle,
  modelType: ModelType,
  imageSize: ImageSize = ImageSize.K1
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  let enhancedPrompt = prompt;
  if (style !== ImageStyle.NONE) {
    enhancedPrompt = `${prompt}, in ${style} style, high resolution, detailed.`;
  }

  const config: any = {
    imageConfig: {
      aspectRatio: aspectRatio
    }
  };

  if (modelType === ModelType.PRO) {
    config.imageConfig.imageSize = imageSize;
    config.tools = [{ googleSearch: {} }]; // استخدام التسمية الصحيحة المعتمدة
  }

  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: config
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("لم يتم توليد صورة. جرب وصفاً مختلفاً.");
    }

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("لم يتم العثور على بيانات الصورة.");
  } catch (error: any) {
    console.error("API Error:", error);
    const msg = error.message || JSON.stringify(error);
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Requested entity was not found")) {
      throw new Error("KEY_REQUIRED");
    }
    throw new Error(msg);
  }
};
