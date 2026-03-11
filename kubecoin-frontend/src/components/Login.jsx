import { useState } from 'react';

function Login({ onLogin }) {
    const [walletId, setWalletId] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (walletId.trim()) {
            setIsConnecting(true);
            // Simulate connection delay for effect
            setTimeout(() => {
                onLogin(walletId.trim());
            }, 500);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="cyber-card glow-border p-8 w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🪙</div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                        KubeCoin
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        Crypto Exchange Simulator
                    </p>
                </div>

                {/* Arcade style border */}
                <div className="border-t border-purple-500/30 my-6"></div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            WALLET ID
                        </label>
                        <input
                            type="text"
                            value={walletId}
                            onChange={(e) => setWalletId(e.target.value)}
                            placeholder="Enter Wallet ID (e.g., Student1)"
                            className="cyber-input w-full"
                            disabled={isConnecting}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!walletId.trim() || isConnecting}
                        className="cyber-btn w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? (
                            <>
                                <div className="spinner"></div>
                                CONNECTING...
                            </>
                        ) : (
                            <>
                                <span>⚡</span>
                                CONNECT TO EXCHANGE
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        A Kubernetes Learning Tool
                    </p>
                    <div className="flex justify-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-gray-500">Network Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
