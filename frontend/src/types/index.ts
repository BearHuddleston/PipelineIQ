// API Response Types
export interface RawData {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  SourceName: string;
  Content: string;
  FetchedAt: string;
}

export interface ProcessedData {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Content: string;
  ProcessedAt: string;
}

export interface LLMAnalysis {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Content: string;
  GeneratedAt: string;
}

export interface FetchProcessResponse {
  message: string;
  processed_id: number;
  analysis_id: number;
  completed_at: string;
}

export interface ResultsResponse {
  results: ProcessedData[];
  count: number;
}

export interface AnalysisResponse {
  analysis: LLMAnalysis;
  generated_at: string;
}

// Component Props
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export interface ErrorMessageProps {
  message: string;
}

export interface ResultsDisplayProps {
  data: ProcessedData[] | null;
  loading: boolean;
  error: string | null;
}

export interface AnalysisDisplayProps {
  data: LLMAnalysis | null;
  loading: boolean;
  error: string | null;
}

export interface StreamingEventCallbacks {
  onStart?: (message: string) => void;
  onContent?: (content: string) => void;
  onError?: (error: string) => void;
  onComplete?: (data: { id: number; message: string }) => void;
}

export interface StreamingAnalysisProps {
  processedId?: number;
  onComplete?: (analysisId: number) => void;
}
