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

  if (!data || data.length === 0) {
    return <div className="text-gray-500">No results available. Try fetching data first.</div>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Processed Results</h2>
      <div className="overflow-auto">
        {data.map((item) => {
          // Parse the JSON content for display
          let parsedContent;
          try {
            parsedContent = JSON.parse(item.Content);
          } catch (e) {
            parsedContent = { error: 'Invalid JSON', raw: item.Content };
          }

          return (
            <div key={item.ID} className="mb-4 p-4 border rounded">
              <div className="mb-2">
                <span className="font-semibold">ID:</span> {item.ID}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Processed At:</span> {new Date(item.ProcessedAt).toLocaleString()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Content:</span>
                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-left">
                  {JSON.stringify(parsedContent, null, 2)}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ResultsContainer = () => {
  const [data, setData] = useState<ProcessedData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');

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

  useEffect(() => {
    fetchResults();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(dateFilter);
  };

  return (
    <div className="mt-8">
      <div className="mb-4">
        <form onSubmit={handleFilterSubmit} className="flex items-end space-x-2">
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date (YYYY-MM-DD)
            </label>
            <input
              type="text"
              id="date-filter"
              placeholder="e.g., 2023-01-15"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
              pattern="\d{4}-\d{2}-\d{2}"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={() => {
              setDateFilter('');
              fetchResults();
            }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Clear
          </button>
        </form>
      </div>

      <ResultsDisplay data={data} loading={loading} error={error} />
    </div>
  );
};

export default ResultsDisplay;
