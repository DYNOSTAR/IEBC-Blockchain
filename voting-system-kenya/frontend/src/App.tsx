import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function HomePage() {
  const [apiStatus, setApiStatus] = useState('checking...');

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/health`)
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-kenya-green text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Kenya Blockchain Voting System</h1>
          <p className="mt-2 text-green-100">Secure • Transparent • Verifiable</p>
        </div>
      </header>

      <div className="bg-kenya-black py-2 text-white">
        <div className="container mx-auto flex justify-between px-4">
          <span>System Status</span>
          <span className={apiStatus === 'online' ? 'text-green-400' : 'text-red-400'}>
            Backend: {apiStatus}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
          <h2 className="mb-4 text-2xl font-semibold">Welcome to the Future of Kenyan Elections</h2>
          <p className="mb-6 text-gray-600">
            Experience secure, transparent, and verifiable voting powered by blockchain technology.
            This prototype demonstrates how we can restore trust in our electoral process.
          </p>
          <div className="flex gap-4">
            <Link to="/voter" className="rounded-lg bg-kenya-green px-6 py-3 text-white transition hover:bg-green-700">
              Voter Portal
            </Link>
            <Link to="/results" className="rounded-lg bg-kenya-red px-6 py-3 text-white transition hover:bg-red-700">
              View Results
            </Link>
            <Link to="/chat" className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700">
              AI Assistant
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">🔒 Immutable Records</h3>
            <p className="text-gray-600">Once votes are cast, they cannot be altered or deleted.</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">👁️ Transparent Process</h3>
            <p className="text-gray-600">Verify your vote without revealing your choice.</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">🤖 AI Assistant</h3>
            <p className="text-gray-600">Get help understanding the voting process in English or Swahili.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/voter" element={<div>Voter Portal (Coming Soon)</div>} />
        <Route path="/results" element={<div>Results (Coming Soon)</div>} />
        <Route path="/chat" element={<div>AI Assistant (Coming Soon)</div>} />
      </Routes>
    </Router>
  );
}

export default App;
