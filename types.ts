
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export enum Classification {
  REAL = 'REAL',
  FAKE = 'FAKE',
  UNCERTAIN = 'UNCERTAIN',
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
}

export enum Bias {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CENTER = 'CENTER',
  NEUTRAL = 'NEUTRAL',
}

export interface AnalysisResult {
  classification: Classification;
  reasoning: string;
  topic?: string;
  keywords?: string[];
  confidence?: number;
  sentiment?: Sentiment;
  bias?: Bias;
  sources?: GroundingChunk[];
}