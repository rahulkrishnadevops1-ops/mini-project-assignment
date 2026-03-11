import { useState } from 'react';

function MinerCard({ walletID, onMine }) {
    const [mining, setMining] = useState(false);

    const handleMine = async () => {
        setMining(true);
        try {
            await onMine();
        } catch (error) {
            console.error('Mining failed:', error);
        } finally {
            setMining(false);
        }
    };

    return (
        <div className="cyber-card p-6 border border-red-500/30 bg-gradient-to-br from-red-950/20 to-transparent">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⛏️</span>
                <h3 className="text-lg font-semibold">CPU Miner</h3>
            </div>

            <p className="text-gray-400 text-sm mb-4">
                Start a high-CPU mining operation. This simulates a compute-intensive workload for stress testing.
            </p>

            <div className="bg-red-900/20 rounded-lg p-3 mb-4 border border-red-500/20">
                <p className="text-red-400 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    Warning: High latency request
                </p>
            </div>

            <button
                onClick={handleMine}
                disabled={mining}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
                {mining ? (
                    <>
                        <div className="spinner w-5 h-5"></div>
                        MINING IN PROGRESS...
                    </>
                ) : (
                    <>
                        <span>🔥</span>
                        START MINING (HIGH CPU)
                    </>
                )}
            </button>

            {mining && (
                <div className="mt-4 text-center">
                    <div className="text-xs text-gray-400 animate-pulse">
                        Processing hash algorithms...
                    </div>
                    <div className="flex justify-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-4 bg-red-500 rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MinerCard;
