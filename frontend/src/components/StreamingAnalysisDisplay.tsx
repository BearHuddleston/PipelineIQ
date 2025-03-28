import { useState, useEffect, useRef } from 'react';
import { streamAnalysis } from '../services/api';
import { StreamingAnalysisProps } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const StreamingAnalysisDisplay = ({ processedId, onComplete }: StreamingAnalysisProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastProcessedIdRef = useRef<number | undefined>(undefined);

  const startStreaming = () => {
    // Reset state
    setContent('');
    setError(null);
    setIsStreaming(true);
    setStartTime(new Date());
    
    // Start streaming
    const cleanup = streamAnalysis({
      onStart: (message) => {
        console.log('Streaming started:', message);
      },
      onContent: (chunk) => {
        setContent((prev) => prev + chunk);
        
        // Auto-scroll to the bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        setIsStreaming(false);
      },
      onComplete: (data) => {
        console.log('Streaming completed:', data);
        setIsStreaming(false);
        if (onComplete) {
          onComplete(data.id);
        }
      }
    }, processedId);
    
    // Store the cleanup function
    cleanupRef.current = cleanup;
  };

  // Auto-start streaming when processedId changes
  useEffect(() => {
    if (processedId && processedId !== lastProcessedIdRef.current && !isStreaming) {
      lastProcessedIdRef.current = processedId;
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

  // Format the content with Markdown-like rendering
  const formatContent = (text: string) => {
    if (!text) return null;
    
    // Split by new lines
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Handle lists
      if (line.match(/^\d+\./)) {
        return (
          <li key={index} className="ml-5 list-decimal">
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        );
      }
      // Handle bullet points
      if (line.match(/^\*\s/)) {
        return (
          <li key={index} className="ml-5 list-disc">
            {line.replace(/^\*\s*/, '')}
          </li>
        );
      }
      // Handle headers
      if (line.match(/^#+\s/)) {
        const level = line.match(/^(#+)\s/)?.[1].length || 1;
        const headerText = line.replace(/^#+\s*/, '');
        const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base'];
        const sizeClass = sizes[Math.min(level - 1, sizes.length - 1)];
        return (
          <div key={index} className={`${sizeClass} font-bold mt-2 mb-1`}>
            {headerText}
          </div>
        );
      }
      // Handle paragraphs with spacing
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
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
                Streaming for {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}s
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
          
          <div className="code-block h-full" style={{ whiteSpace: 'pre-wrap' }}>
            {formatContent(content) || (
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