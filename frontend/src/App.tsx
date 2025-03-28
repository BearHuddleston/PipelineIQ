import { useState, useEffect } from 'react';
import './App.css';
import DataFetchForm from './components/DataFetchForm';
import { ResultsContainer } from './components/ResultsDisplay';
// import { AnalysisContainer } from './components/AnalysisDisplay';
import StreamingAnalysisDisplay from './components/StreamingAnalysisDisplay';
import { checkHealth } from './services/api';

function App() {
  const [serverStatus, setServerStatus] = useState<'connecting' | 'online' | 'offline' | 'checking'>('connecting');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastProcessedId, setLastProcessedId] = useState<number | undefined>(undefined);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">PipelineIQ Dashboard</h1>
        <div className="mt-2 text-gray-600">
          Server Status: 
          {serverStatus === 'connecting' && <span className="ml-2 text-yellow-500">Connecting...</span>}
          {serverStatus === 'checking' && <span className="ml-2 text-blue-500">Checking...</span>}
          {serverStatus === 'online' && <span className="ml-2 text-green-500">Online</span>}
          {serverStatus === 'offline' && <span className="ml-2 text-red-500">Offline</span>}
        </div>
        {serverStatus === 'offline' && (
          <div className="mt-1 text-sm text-gray-500">
            Server connection lost. Attempting to reconnect every 10 seconds.
          </div>
        )}
      </header>

      <main>
        {serverStatus === 'offline' ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Server Unavailable: </strong>
            <span className="block sm:inline">Cannot connect to the backend server. Please check if it's running.</span>
          </div>
        ) : (
          <>
            <DataFetchForm onSuccess={handleDataProcessSuccess} />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-1">
                <ResultsContainer key={`results-${refreshTrigger}`} />
              </div>
              <div className="col-span-1">
                <StreamingAnalysisDisplay 
                  // Pass the most recent processedId when available
                  processedId={lastProcessedId}
                  onComplete={() => {/* Don't trigger refresh here to avoid infinite loops */}} 
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} PipelineIQ - A Data Processing Platform
      </footer>
    </div>
  );
}

export default App;
