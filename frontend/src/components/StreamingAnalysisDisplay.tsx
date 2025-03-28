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
      <h2 className="text-xl font-bold mb-4">LLM Analysis (Streaming)</h2>
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          {isStreaming && startTime && (
            <div className="text-sm text-gray-500">
              Streaming for {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}s
            </div>
          )}
        </div>
        <button
          onClick={startStreaming}
          disabled={isStreaming}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isStreaming ? <LoadingSpinner size="small" /> : 'Generate Analysis'}
        </button>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      <div 
        ref={containerRef}
        className="p-4 border rounded bg-white shadow-sm h-[600px] overflow-y-auto"
      >
        {isStreaming && !content && (
          <div className="flex justify-center items-center h-24">
            <LoadingSpinner />
          </div>
        )}
        
        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded font-mono text-sm">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};

export default StreamingAnalysisDisplay;