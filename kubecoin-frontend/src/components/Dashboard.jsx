import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import ActionCard from './ActionCard';
import MinerCard from './MinerCard';
import PriceChart from './PriceChart';
import Toast from './Toast';
import { buy, sell, mine, reset } from '../api/api';

function Dashboard({ walletID, balance, coins, podId, onLogout, onDataUpdate }) {
    const [toast, setToast] = useState(null);

    // Price state - managed here so all components share the same price
    const [currentPrice, setCurrentPrice] = useState(10);
    const [priceHistory, setPriceHistory] = useState([]);

    // Initialize and update price
    // EDUCATIONAL NOTE: In a real app, this would come from the backend via WebSocket or polling.
    // For this demo, we simulate a "live" market client-side to keep the backend simple.
    useEffect(() => {
        // Initialize with some history
        const initialHistory = [];
        let price = 10;
        for (let i = 0; i < 20; i++) {
            price = price + (Math.random() - 0.5) * 0.8;
            price = Math.max(5, Math.min(20, price));
            initialHistory.push(price);
        }
        setPriceHistory(initialHistory);
        setCurrentPrice(initialHistory[initialHistory.length - 1]);

        // Update price every 3 seconds
        const interval = setInterval(() => {
            setPriceHistory(prev => {
                const lastPrice = prev[prev.length - 1] || 10;
                const change = (Math.random() - 0.5) * 0.8;
                const newPrice = Math.max(5, Math.min(20, lastPrice + change));
                setCurrentPrice(newPrice);
                return [...prev.slice(-19), newPrice];
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    // Handle buy/sell actions with LIVE price
    const handleAction = async (type, amount, price) => {
        // Frontend validation using live price
        if (type === 'buy') {
            const cost = amount * price;
            if (cost > balance) {
                showToast(`Insufficient balance! Cost: $${cost.toFixed(2)}, You have: $${balance.toFixed(2)}`, 'error');
                return;
            }
        }

        if (type === 'sell' && amount > coins) {
            showToast(`Insufficient coins! You have ${coins.toFixed(2)} coins`, 'error');
            return;
        }

        try {
            if (type === 'buy') {
                await buy(walletID, amount, price);
                const cost = (amount * price).toFixed(2);
                showToast(`Bought ${amount} KubeCoins for $${cost} @ $${price.toFixed(2)}/coin!`, 'success');
            } else if (type === 'sell') {
                await sell(walletID, amount, price);
                const revenue = (amount * price).toFixed(2);
                showToast(`Sold ${amount} KubeCoins for $${revenue} @ $${price.toFixed(2)}/coin!`, 'success');
            }
            onDataUpdate();
        } catch (error) {
            console.error('Transaction failed:', error);
            const errorMessage = error.response?.data?.message || 'Transaction failed. Please try again.';
            showToast(errorMessage, 'error');
        }
    };

    // Handle mining
    const handleMine = async () => {
        try {
            showToast('Mining in progress... This may take a moment.', 'info');
            await mine(walletID);
            showToast('Mining complete! Earned 1 KubeCoin 🎉', 'success');
            onDataUpdate();
        } catch (error) {
            console.error('Mining failed:', error);
            const errorMessage = error.response?.data?.message || 'Mining failed. Please try again.';
            showToast(errorMessage, 'error');
        }
    };

    // Handle bailout
    const handleBailout = async () => {
        try {
            await reset(walletID);
            showToast('Account reset successfully! Balance restored to $1000.', 'success');
            onDataUpdate();
        } catch (error) {
            console.error('Bailout failed:', error);
            showToast('Bailout failed. Please try again.', 'error');
        }
    };

    // Calculate portfolio value
    const portfolioValue = balance + (coins * currentPrice);

    return (
        <div className="min-h-screen">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            {/* Header */}
            <header className="border-b border-purple-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🪙</span>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                KubeCoin Exchange
                            </h1>
                        </div>

                        {/* Right: User info & Pod ID */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Pod ID Badge - CRITICAL for K8s demo */}
                            <div className="pod-badge flex items-center gap-2">
                                <span className="text-cyan-400">☸</span>
                                <span className="text-cyan-300 text-xs">
                                    Backend Pod: <span className="font-bold">{podId}</span>
                                </span>
                            </div>

                            {/* Wallet ID */}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Wallet:</span>
                                <span className="font-semibold text-purple-400">{walletID}</span>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="text-sm px-4 py-2 rounded-lg border border-gray-600 hover:border-red-500 hover:text-red-400 transition-all"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Stats */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                            <span>📊</span> Portfolio Stats
                        </h2>

                        {/* Price Chart - receives price from Dashboard */}
                        <PriceChart
                            currentPrice={currentPrice}
                            priceHistory={priceHistory}
                        />

                        <StatsCard
                            title="USD Balance"
                            value={balance}
                            type="balance"
                            showBailout={balance < 100}
                            onBailout={handleBailout}
                        />

                        <StatsCard
                            title="KubeCoin Holdings"
                            value={coins}
                            type="coins"
                        />

                        {/* Portfolio Summary */}
                        <div className="cyber-card p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Total Portfolio Value</div>
                            <div className="text-2xl font-bold text-purple-400 mt-1">
                                ${portfolioValue.toFixed(2)}
                            </div>
                        </div>

                        {/* Real-time indicator */}
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live data • Refreshes every 2 seconds
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                            <span>⚡</span> Trading Actions
                        </h2>

                        <ActionCard
                            title="Buy KubeCoin"
                            type="buy"
                            walletID={walletID}
                            balance={balance}
                            coins={coins}
                            currentPrice={currentPrice}
                            onAction={handleAction}
                        />

                        <ActionCard
                            title="Sell KubeCoin"
                            type="sell"
                            walletID={walletID}
                            balance={balance}
                            coins={coins}
                            currentPrice={currentPrice}
                            onAction={handleAction}
                        />

                        <MinerCard
                            walletID={walletID}
                            onMine={handleMine}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-purple-500/10 mt-8 py-6">
                <div className="container mx-auto px-4 text-center text-xs text-gray-500">
                    <p>KubeCoin Exchange • A Kubernetes Learning Tool</p>
                    <p className="mt-1">Demonstrating Load Balancing, Pod Scaling & Service Discovery</p>
                </div>
            </footer>
        </div>
    );
}

export default Dashboard;
