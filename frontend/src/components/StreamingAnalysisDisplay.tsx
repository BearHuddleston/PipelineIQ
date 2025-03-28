import { useState, useEffect, useRef } from 'react';
import { streamAnalysisOpenAI } from '../services/api';
import { StreamingAnalysisProps } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StreamingAnalysisDisplay = ({ processedId, onComplete }: StreamingAnalysisProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [hasAttemptedAnalysis, setHasAttemptedAnalysis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastProcessedIdRef = useRef<number | undefined>(undefined);

  const startStreaming = () => {
    // Reset state
    setContent('');
    setError(null);
    setIsStreaming(true);
    setStartTime(new Date());
    setHasAttemptedAnalysis(true);
    
    const callbacks = {
      onStart: (message: string) => {
        console.log('Streaming started:', message);
      },
      onContent: (chunk: string) => {
        setContent((prev) => prev + chunk);
        
        // Auto-scroll to the bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setIsStreaming(false);
      },
      onComplete: (data: { id: number; message: string }) => {
        console.log('Streaming completed:', data);
        setIsStreaming(false);
        if (onComplete) {
          onComplete(data.id);
        }
      }
    };
    
    // Always use OpenAI format
    const cleanup = streamAnalysisOpenAI(processedId, callbacks);
    
    // Store the cleanup function
    cleanupRef.current = cleanup;
  };

  // Auto-start streaming when processedId changes
  useEffect(() => {
    if (processedId && processedId !== lastProcessedIdRef.current && !isStreaming) {
      lastProcessedIdRef.current = processedId;
      setHasAttemptedAnalysis(true);
      // Start streaming with a slight delay to ensure backend processing has begun
      setTimeout(() => {
        startStreaming();
      }, 500);
    }
  }, [processedId, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Calculate elapsed time for streaming timer
  const getElapsedTime = () => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
  };

  return (
    <div className="mt-6">
      <div className="card">
        <div className="card-header">
          <h2>LLM Analysis</h2>
          <div className="flex items-center">
            {isStreaming && startTime && (
              <div className="text-sm text-gray-500 mr-4">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></span>
                Streaming for {getElapsedTime()}s
              </div>
            )}
            <button
              onClick={startStreaming}
              disabled={isStreaming}
              className="btn btn-primary btn-sm"
            >
              {isStreaming ? (
                <>
                  <LoadingSpinner size="small" showText={false} />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Analysis
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-4 border-t border-gray-100">
            <ErrorMessage message={error} />
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="data-panel border-0 rounded-t-none"
        >
          {isStreaming && !content && (
            <div className="flex justify-center items-center h-24">
              <LoadingSpinner size="medium" />
            </div>
          )}
          
          <div className="markdown-content h-full p-4 overflow-auto">
            {content ? (
              <div className="prose prose-slate max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              // Empty div when streaming but no content yet
              <div></div>
            ) : hasAttemptedAnalysis || processedId ? (
              // Show empty space or pending message when waiting for analysis but no content yet
              <div className="flex justify-center items-center h-24 text-gray-400 italic">
                Waiting for data...
              </div>
            ) : (
              // Show instructions only when nothing has happened yet
              <div className="text-gray-400 italic">
                Click "Generate Analysis" to create an analysis of the processed data, or "Fetch & Process Data" to trigger automatic analysis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingAnalysisDisplay;