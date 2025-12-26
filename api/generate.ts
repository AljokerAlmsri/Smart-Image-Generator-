
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST requests allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { prompt, aspectRatio = '1:1', style = 'None', model = 'gemini-2.5-flash-image', apiKey } = body;

    const finalApiKey = apiKey || process.env.API_KEY;

    if (!finalApiKey) {
      return new Response(JSON.stringify({ error: 'API Key is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const enhancedPrompt = style !== 'None' ? `${prompt}, in ${style} style, high quality` : prompt;

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: enhancedPrompt }] },
      config: {
        imageConfig: { aspectRatio: aspectRatio }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

    if (part?.inlineData) {
      return new Response(JSON.stringify({
        success: true,
        image_url: `data:image/png;base64,${part.inlineData.data}`,
        base64: part.inlineData.data,
        prompt: enhancedPrompt
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
