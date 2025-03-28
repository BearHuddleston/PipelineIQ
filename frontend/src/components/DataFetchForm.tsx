import { useState } from 'react';
import { fetchAndProcessData } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface DataFetchFormProps {
  onSuccess: (processedId: number) => void;
}

const DataFetchForm = ({ onSuccess }: DataFetchFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchAndProcessData();
      setSuccessMessage(`Data pipeline initiated. Processed ID: ${response.processed_id}. Analysis will be generated in the background.`);
      onSuccess(response.processed_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch and process data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <div className="card-header">
        <h2>Data Pipeline Control</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" showText={false} />
                <span className="ml-2">Processing Data...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Fetch & Process Data
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success mt-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFetchForm;
