import axios from 'axios';
import { AnalysisResponse, FetchProcessResponse, ResultsResponse, StreamingEventCallbacks } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAndProcessData = async (): Promise<FetchProcessResponse> => {
  const response = await api.post<FetchProcessResponse>('/fetch_and_process');
  return response.data;
};

export const getResults = async (date?: string): Promise<ResultsResponse> => {
  const params = date ? { date } : {};
  const response = await api.get<ResultsResponse>('/results', { params });
  return response.data;
};

export const getAnalysis = async (id?: number): Promise<AnalysisResponse> => {
  const params = id ? { id } : {};
  const response = await api.get<AnalysisResponse>('/analysis', { params });
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get<{ status: string; message: string }>('/ping');
  return response.data;
};

// Legacy EventSource based streaming implementation
export const streamAnalysis = (
  callbacks: StreamingEventCallbacks,
  processedId?: number
): () => void => {
  // Create the EventSource URL
  const url = new URL(`${API_BASE_URL}/stream_analysis`, window.location.origin);
  
  // Add processed_id query parameter if provided
  if (processedId) {
    url.searchParams.append('processed_id', processedId.toString());
  }
  
  // Create the EventSource
  const eventSource = new EventSource(url.toString());
  
  // Set up event listeners
  eventSource.addEventListener('start', (event: Event) => {
    const messageEvent = event as MessageEvent;
    if (callbacks.onStart) callbacks.onStart(messageEvent.data);
  });
  
  eventSource.addEventListener('content', (event: Event) => {
    const messageEvent = event as MessageEvent;
    if (callbacks.onContent) callbacks.onContent(messageEvent.data);
  });
  
  eventSource.addEventListener('error', (event: Event) => {
    const messageEvent = event as MessageEvent;
    if (callbacks.onError) callbacks.onError(messageEvent.data || 'Unknown error occurred');
  });
  
  eventSource.addEventListener('complete', (event: Event) => {
    const messageEvent = event as MessageEvent;
    try {
      const data = JSON.parse(messageEvent.data);
      if (callbacks.onComplete) callbacks.onComplete(data);
    } catch (error) {
      console.error('Failed to parse completion data:', error);
      if (callbacks.onError) callbacks.onError('Failed to parse completion data');
    }
    
    // Close the connection when complete
    eventSource.close();
  });
  
  // Return a function to close the connection
  return () => {
    eventSource.close();
  };
};

// New OpenAI-style streaming implementation
export const streamAnalysisOpenAI = (
  processedId?: number,
  callbacks?: StreamingEventCallbacks
): () => void => {
  // Create the fetch URL
  const url = new URL(`${API_BASE_URL}/stream_analysis_openai`, window.location.origin);
  
  // Add processed_id query parameter if provided
  if (processedId) {
    url.searchParams.append('processed_id', processedId.toString());
  }
  
  // Notify start if callback provided
  if (callbacks?.onStart) {
    callbacks.onStart('Starting analysis stream');
  }
  
  // Create the EventSource for simplicity
  const eventSource = new EventSource(url.toString());
  
  let content = '';
  
  // Set up event listeners
  eventSource.onmessage = (event: MessageEvent) => {
    try {
      // Handle [DONE] message
      if (event.data === '[DONE]') {
        if (callbacks?.onComplete) {
          callbacks.onComplete({ 
            id: processedId || 0, 
            message: 'Stream completed' 
          });
        }
        eventSource.close();
        return;
      }
      
      // Try to parse the JSON data
      const parsedData = JSON.parse(event.data);
      
      // Handle error message
      if (parsedData.error) {
        if (callbacks?.onError) {
          callbacks.onError(parsedData.error.message || 'An error occurred');
        }
        eventSource.close();
        return;
      }
      
      // Handle content delta
      if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
        const delta = parsedData.choices[0].delta.content;
        content += delta;
        
        if (callbacks?.onContent) {
          callbacks.onContent(delta);
        }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error, event.data);
    }
  };
  
  eventSource.onerror = () => {
    if (callbacks?.onError) {
      callbacks.onError('Connection error occurred');
    }
    eventSource.close();
  };
  
  // Return a function to close the connection
  return () => {
    eventSource.close();
  };
};
