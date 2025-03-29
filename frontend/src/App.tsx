import { useState, useEffect } from 'react';
import './App.css';
import DataFetchForm from './components/DataFetchForm';
import { ResultsContainer } from './components/ResultsDisplay';
// import { AnalysisContainer } from './components/AnalysisDisplay';
import StreamingAnalysisDisplay from './components/StreamingAnalysisDisplay';
import DateFilterForm from './components/DateFilterForm';
import InfoCard from './components/InfoCard';
import { checkHealth } from './services/api';

function App() {
  const [serverStatus, setServerStatus] = useState<'connecting' | 'online' | 'offline' | 'checking'>('connecting');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastProcessedId, setLastProcessedId] = useState<number | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState<string>('');

  // Check server health periodically
  useEffect(() => {
    const checkServer = async () => {
      // Only show checking status if we're not in the initial connecting state
      if (serverStatus !== 'connecting') {
        setServerStatus('checking');
      }
      
      try {
        await checkHealth();
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    // Check immediately on mount
    checkServer();
    
    // Set up interval for periodic checks (every 10 seconds)
    const intervalId = setInterval(checkServer, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleDataProcessSuccess = (processedId: number) => {
    // Force refresh of both results and analysis containers
    setRefreshTrigger(prev => prev + 1);
    // Store the processed ID for streaming
    setLastProcessedId(processedId);
  };

  // No toggle needed as OpenAI format is now the default

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="flex justify-between items-center">
          <div className="app-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="app-logo">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            <h1 className="text-3xl font-bold">PipelineIQ</h1>
          </div>
          <div className="flex items-center">
            <div className={`status-indicator status-${serverStatus}`}>
              <div className="status-dot"></div>
              <span className="capitalize">{serverStatus}</span>
            </div>
          </div>
        </div>
        {serverStatus === 'offline' && (
          <div className="mt-1 text-sm text-gray-500">
            Server connection lost. Attempting to reconnect every 10 seconds.
          </div>
        )}
      </header>

      <main>
        {serverStatus === 'offline' ? (
          <div className="alert alert-danger" role="alert">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Server Unavailable</strong>
                <p className="text-sm">Cannot connect to the backend server. Please check if it's running.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:gap-4">
              <div className="flex-1">
                <DataFetchForm onSuccess={handleDataProcessSuccess} />
                <DateFilterForm 
                  onFilterChange={(date) => setDateFilter(date)}
                  loading={false}
                />
              </div>
              <div className="flex-1 mt-4 md:mt-0">
                <InfoCard />
              </div>
            </div>
            <div className="grid-container">
              <div>
                <ResultsContainer 
                  key={`results-${refreshTrigger}`} 
                  dateFilter={dateFilter}
                />
              </div>
              <div>
                <StreamingAnalysisDisplay 
                  processedId={lastProcessedId}
                  onComplete={() => {/* Don't trigger refresh here to avoid infinite loops */}} 
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        &copy; {new Date().getFullYear()} PipelineIQ - A Data Processing Platform
      </footer>
    </div>
  );
}

export default App;
