import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface DateFilterFormProps {
  onFilterChange: (date: string) => void;
  loading?: boolean;
}

const DateFilterForm = ({ onFilterChange, loading = false }: DateFilterFormProps) => {
  const [dateFilter, setDateFilter] = useState('');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(dateFilter);
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h2>Data Filter</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleFilterSubmit} className="flex items-end space-x-2">
          <div className="form-group">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <div className="flex">
              <input
                type="text"
                id="date-filter"
                placeholder="YYYY-MM-DD"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="form-control"
                pattern="\d{4}-\d{2}-\d{2}"
              />
              <button
                type="submit"
                className="btn btn-primary ml-2"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="small" showText={false} /> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              </button>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('');
                    onFilterChange('');
                  }}
                  className="btn btn-secondary ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DateFilterForm;