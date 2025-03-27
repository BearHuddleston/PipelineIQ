import React, { useState } from "react";
import axios from "axios";

interface ProcessedData {
    id: number;
    mergedData: string;
    createdAt: string;
}

interface AnalysisSummary {
    id: number;
    summary: string;
    createdAt: string;
}

const App: React.FC = () => {
    const [jobMessage, setJobMessage] = useState<string>("");
    const [results, setResults] = useState<ProcessedData[]>([]);
    const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);

    const fetchAndProcess = async () => {
        try {
            const res = await axios.post(
                "http://localhost:8080/fetch_and_process"
            );
            setJobMessage(res.data.message);
        } catch (err) {
            setJobMessage("Error fetching data");
        }
    };

    const getResults = async () => {
        try {
            const res = await axios.get("http://localhost:8080/results");
            setResults(res.data);
        } catch (err) {
            console.error("Error fetching results");
        }
    };

    const getAnalysis = async () => {
        try {
            const res = await axios.get("http://localhost:8080/analysis");
            setAnalysis(res.data);
        } catch (err) {
            console.error("Error fetching analysis");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Data Processing Dashboard</h1>
            <button onClick={fetchAndProcess}>Fetch and Process Data</button>
            <p>{jobMessage}</p>
            <button onClick={getResults}>Get Processed Results</button>
            <ul>
                {results.map((item) => (
                    <li key={item.id}>
                        {item.mergedData} -{" "}
                        {new Date(item.createdAt).toLocaleString()}
                    </li>
                ))}
            </ul>
            <button onClick={getAnalysis}>Get Analysis Summary</button>
            {analysis && (
                <div>
                    <h2>LLM Analysis</h2>
                    <p>{analysis.summary}</p>
                    <small>
                        {new Date(analysis.createdAt).toLocaleString()}
                    </small>
                </div>
            )}
        </div>
    );
};

export default App;
