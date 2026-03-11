import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ErrorBanner from './components/ErrorBanner';
import { fetchData } from './api/api';

function App() {
    // State management
    const [walletID, setWalletID] = useState(() => {
        return localStorage.getItem('kubecoin_walletID') || null;
    });
    const [balance, setBalance] = useState(0);
    const [coins, setCoins] = useState(0);
    const [podId, setPodId] = useState('Connecting...');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    // Persist walletID to localStorage
    useEffect(() => {
        if (walletID) {
            localStorage.setItem('kubecoin_walletID', walletID);
        } else {
            localStorage.removeItem('kubecoin_walletID');
        }
    }, [walletID]);

    // Fetch data from API
    const loadData = useCallback(async () => {
        if (!walletID) return;

        try {
            const data = await fetchData(walletID);
            setBalance(data.balance);
            setCoins(data.coins);
            setPodId(data.pod_id || 'Unknown');
            setError(false);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(true);
        }
    }, [walletID]);

    // Auto-refresh data every 2 seconds
    useEffect(() => {
        if (!walletID) return;

        // Initial load
        loadData();

        // Set up interval
        const interval = setInterval(loadData, 2000);

        return () => clearInterval(interval);
    }, [walletID, loadData]);

    // Handle login
    const handleLogin = (id) => {
        setWalletID(id);
        setLoading(true);
    };

    // Handle logout
    const handleLogout = () => {
        setWalletID(null);
        setBalance(0);
        setCoins(0);
        setPodId('Connecting...');
        setError(false);
    };

    // Update state after transactions - just trigger refresh
    const handleDataUpdate = () => {
        loadData();
    };

    return (
        <div className="min-h-screen cyber-grid">
            {/* Error Banner */}
            {error && <ErrorBanner />}

            {/* Conditional Rendering */}
            {!walletID ? (
                <Login onLogin={handleLogin} />
            ) : (
                <Dashboard
                    walletID={walletID}
                    balance={balance}
                    coins={coins}
                    podId={podId}
                    onLogout={handleLogout}
                    onDataUpdate={handleDataUpdate}
                />
            )}
        </div>
    );
}

export default App;
