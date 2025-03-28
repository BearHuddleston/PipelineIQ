import { useState, useEffect } from 'react';
import './App.css';
import DataFetchForm from './components/DataFetchForm';
import { ResultsContainer } from './components/ResultsDisplay';
import { AnalysisContainer } from './components/AnalysisDisplay';
import { checkHealth } from './services/api';

function App() {
  const [serverStatus, setServerStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check server health on component mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        await checkHealth();
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
        // Retry after 5 seconds
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 5000);
      }
    };

    checkServer();
  }, [refreshTrigger]);

  const handleDataProcessSuccess = () => {
    // Force refresh of both results and analysis containers
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">PipelineIQ Dashboard</h1>
        <div className="mt-2 text-gray-600">
          Server Status: 
          {serverStatus === 'connecting' && <span className="ml-2 text-yellow-500">Connecting...</span>}
          {serverStatus === 'online' && <span className="ml-2 text-green-500">Online</span>}
          {serverStatus === 'offline' && <span className="ml-2 text-red-500">Offline - Retrying...</span>}
        </div>
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
            <div className="mt-8 grid grid-cols-1 gap-8">
              <ResultsContainer key={`results-${refreshTrigger}`} />
              <AnalysisContainer key={`analysis-${refreshTrigger}`} />
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
