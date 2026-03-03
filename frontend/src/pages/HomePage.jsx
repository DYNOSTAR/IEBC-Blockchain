import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getElections } from '../services/api';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState('checking...');
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/health`)
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.database === 'connected' ? 'online' : 'degraded');
      })
      .catch(() => setApiStatus('offline'));

    getElections()
      .then((response) => {
        if (response.data.success) {
          setElections(response.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="bg-kenya-green text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🇰🇪 Kenya Blockchain Voting System</h1>
          <p className="text-green-100 mt-2">Secure • Transparent • Verifiable</p>
        </div>
      </header>

      <div className="bg-kenya-black text-white py-2">
        <div className="container mx-auto px-4 flex justify-between">
          <span>System Status</span>
          <span
            className={
              apiStatus === 'online'
                ? 'text-green-400'
                : apiStatus === 'degraded'
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }
          >
            Database: {apiStatus}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome to the Future of Kenyan Elections</h2>
          <p className="text-gray-600 mb-6">
            Experience secure, transparent, and verifiable voting powered by blockchain technology. Your
            vote is your voice - make it count.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/voter"
              className="bg-kenya-green text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              🗳️ Voter Portal
            </Link>
            <Link
              to="/results"
              className="bg-kenya-red text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              📊 View Results
            </Link>
            <Link to="/chat" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              🤖 AI Assistant
            </Link>
          </div>
        </div>

        {!loading && elections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Available Elections</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {elections.map((election) => (
                <div key={election.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                  <h4 className="font-bold text-lg">{election.name}</h4>
                  <p className="text-gray-600 mb-2">{election.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      📅 {new Date(election.start_date).toLocaleDateString()}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{election.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">🔒 Blockchain Secure</h3>
            <p className="text-gray-600">Every vote is encrypted and stored on the blockchain.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">👁️ Transparent</h3>
            <p className="text-gray-600">Verify your vote without revealing your choice.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">🗄️ PostgreSQL</h3>
            <p className="text-gray-600">Secure and reliable data storage with PostgreSQL.</p>
          </div>
        </div>

        <div className="mt-8 h-2 flex rounded overflow-hidden">
          <div className="bg-kenya-black flex-1"></div>
          <div className="bg-kenya-red flex-1"></div>
          <div className="bg-kenya-green flex-1"></div>
        </div>
      </div>
    </div>
  );
}
