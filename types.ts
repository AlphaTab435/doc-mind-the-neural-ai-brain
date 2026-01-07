
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DocumentData {
  name: string;
  size: string;
  type: string;
  base64: string;
  summary?: string;
}

export enum AnalysisStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  READY = 'ready',
  ERROR = 'error'
}
