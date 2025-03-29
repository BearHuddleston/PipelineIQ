import React from 'react';

interface APIInfo {
  name: string;
  description: string;
  url: string;
  purpose: string;
}

const InfoCard: React.FC = () => {
  const apis: APIInfo[] = [
    {
      name: "CryptoAPI",
      description: "Cryptocurrency data provided by CoinCap API",
      url: "https://api.coincap.io/v2/assets/bitcoin",
      purpose: "Fetches real-time Bitcoin price and market data including market cap, volume, and price change percentages."
    },
    {
      name: "WeatherAPI",
      description: "Weather data provided by WeatherAPI.com",
      url: "https://api.weatherapi.com/v1/current.json",
      purpose: "Retrieves current weather conditions for Austin, TX including temperature, humidity, and condition information."
    }
  ];

  return (
    <div className="card h-full">
      <div className="card-header">
        <h2>Data Sources</h2>
        <div className="text-sm text-gray-500">
          APIs used by PipelineIQ
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {apis.map((api, index) => (
            <div key={index} className="border rounded-md p-3 bg-gray-50">
              <div className="flex items-center mb-1">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-md font-medium text-blue-600">{api.name}</h3>
              </div>
              
              <p className="text-xs text-gray-600 mb-1">{api.description}</p>
              
              <div className="bg-white p-2 rounded border text-xs font-mono overflow-x-auto text-gray-700">
                {api.url}
              </div>
              
              <div className="mt-2">
                <h4 className="text-xs font-semibold text-gray-700">Purpose:</h4>
                <p className="text-xs text-gray-600">{api.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;