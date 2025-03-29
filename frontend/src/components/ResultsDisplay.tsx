import { useEffect, useState } from 'react';
import { getResults } from '../services/api';
import { ProcessedData, ResultsDisplayProps } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const ResultsDisplay = ({ data, loading, error }: ResultsDisplayProps) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-6">
      <div className="card">
        <div className="card-header">
          <h2>Processed Results</h2>
          <div className="text-sm text-gray-500">
            {data.length} {data.length === 1 ? 'result' : 'results'} available
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

            return (
              <div key={item.ID} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Result #{item.ID}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.ProcessedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="code-block mt-2 max-h-[400px]">
                    {JSON.stringify(parsedContent, null, 2)}
                  </div>
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
