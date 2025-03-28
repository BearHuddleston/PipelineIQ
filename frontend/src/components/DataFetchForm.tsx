import { useState } from 'react';
import { fetchAndProcessData } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface DataFetchFormProps {
  onSuccess: () => void;
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
      setSuccessMessage(`Data pipeline completed. Processed ID: ${response.processed_id}, Analysis ID: ${response.analysis_id}`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch and process data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded shadow-sm">
      <h2 className="text-xl font-bold mb-4">Data Pipeline Control</h2>
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="small" /> : 'Fetch & Process Data'}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-red-500 text-sm">
          Error: {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 text-green-500 text-sm">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default DataFetchForm;
