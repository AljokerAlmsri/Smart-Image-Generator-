
export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  MOBILE = '9:16',
  WIDESCREEN = '16:9'
}

export enum ImageStyle {
  NONE = 'None',
  CINEMATIC = 'Cinematic',
  CYBERPUNK = 'Cyberpunk',
  ANIME = 'Anime',
  OIL_PAINTING = 'Oil Painting',
  PHOTOREALISTIC = 'Photorealistic',
  PIXEL_ART = 'Pixel Art',
  DREAMY = 'Dreamy',
  VINTAGE = 'Vintage',
  SKETCH = 'Sketch'
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  config: {
    aspectRatio: AspectRatio;
    style: ImageStyle;
    modelType: ModelType;
    imageSize?: ImageSize;
  };
}
