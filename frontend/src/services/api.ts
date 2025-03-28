import axios from 'axios';
import { AnalysisResponse, FetchProcessResponse, ResultsResponse } from '../types';

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
