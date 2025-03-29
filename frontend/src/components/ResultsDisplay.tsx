import { useEffect, useState } from 'react';
import { getResults } from '../services/api';
import { ProcessedData, ResultsDisplayProps } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const ResultsDisplay = ({ data, loading, error }: ResultsDisplayProps) => {
  // Track which items are expanded
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  // Toggle expansion state of an item
  const toggleExpand = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Function to syntax highlight JSON
  const JsonDisplay = ({ json }: { json: any }) => {
    const formattedJson = JSON.stringify(json, null, 2);
    
    // Basic syntax highlighting for JSON
    const highlightedJson = formattedJson.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-purple-600'; // default: numbers
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-600'; // keys
          } else {
            cls = 'text-green-600'; // strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-orange-600'; // booleans
        } else if (/null/.test(match)) {
          cls = 'text-red-600'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
    
    return (
      <pre className="text-sm whitespace-pre-wrap overflow-auto bg-gray-50 p-3 rounded">
        <div dangerouslySetInnerHTML={{ __html: highlightedJson }} />
      </pre>
    );
  };

  // Function to render metadata fields
  const renderMetaData = (item: ProcessedData) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2 mb-3 border-t border-b border-gray-100 py-2">
        <div><span className="font-semibold">ID:</span> {item.ID}</div>
        <div><span className="font-semibold">Created:</span> {new Date(item.CreatedAt).toLocaleString()}</div>
        <div><span className="font-semibold">Updated:</span> {new Date(item.UpdatedAt).toLocaleString()}</div>
        <div><span className="font-semibold">Processed:</span> {new Date(item.ProcessedAt).toLocaleString()}</div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="card">
        <div className="card-header">
          <h2>Processed Results</h2>
          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              {data.length} {data.length === 1 ? 'result' : 'results'} available
            </div>
          </div>
        </div>
        <div className="data-panel border-0 rounded-t-none">
          {data.map((item) => {
            // Parse the JSON content for display
            let parsedContent;
            try {
              parsedContent = JSON.parse(item.Content);
            } catch (e) {
              parsedContent = { error: 'Invalid JSON', raw: item.Content };
            }

            const isExpanded = !!expandedItems[item.ID];

            return (
              <div key={item.ID} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 bg-white">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleExpand(item.ID)}
                  >
                    <div className="font-medium flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 mr-1 text-blue-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M6 6L14 10L6 14V6Z" />
                      </svg>
                      Result #{item.ID}
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs text-gray-500 mr-2">
                        {new Date(item.ProcessedAt).toLocaleString()}
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {isExpanded ? 'Hide' : 'Show'}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="json-viewer mt-3 max-h-[600px] transition-all duration-300 ease-in-out overflow-auto">
                      {renderMetaData(item)}
                      <JsonDisplay json={parsedContent} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-medium">No results available yet.</p>
              <p className="text-sm">Use "Fetch & Process Data" to generate results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface ResultsContainerProps {
  dateFilter?: string;
}

export const ResultsContainer = ({ dateFilter }: ResultsContainerProps) => {
  const [data, setData] = useState<ProcessedData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (date?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getResults(date);
      setData(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchResults();
  }, []);

  // Fetch when date filter changes
  useEffect(() => {
    fetchResults(dateFilter);
  }, [dateFilter]);

  return (
    <div className="mt-4">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <ResultsDisplay data={data} loading={loading} error={error} />
      )}
    </div>
  );
};

export default ResultsDisplay;
