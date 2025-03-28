import { useEffect, useState } from 'react';
import { getAnalysis } from '../services/api';
import { AnalysisDisplayProps, LLMAnalysis } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const AnalysisDisplay = ({ data, loading, error }: AnalysisDisplayProps) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <div className="text-gray-500">No analysis available. Try fetching data first.</div>;
  }

  // Format the analysis content with Markdown-like rendering
  const formatContent = (content: string) => {
    // Split by new lines
    const lines = content.split('\n');
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
      <h2 className="text-xl font-bold mb-4">LLM Analysis</h2>
      <div className="p-4 border rounded bg-white shadow-sm">
        <div className="mb-2">
          <span className="font-semibold">ID:</span> {data.ID}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Generated At:</span> {new Date(data.GeneratedAt).toLocaleString()}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Analysis:</span>
          <div className="mt-2 prose max-w-none">
            {formatContent(data.Content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalysisContainer = () => {
  const [data, setData] = useState<LLMAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAnalysis();
      setData(response.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">LLM Analysis</h2>
        <button
          onClick={fetchAnalysis}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="small" /> : 'Refresh Analysis'}
        </button>
      </div>

      <AnalysisDisplay data={data} loading={loading} error={error} />
    </div>
  );
};

export default AnalysisDisplay;
