import { useState } from 'react';

function ActionCard({ title, type, walletID, balance, coins, currentPrice, onAction }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Frontend validation with live price
        if (type === 'buy') {
            const cost = numAmount * currentPrice;
            if (cost > balance) {
                setError(`Insufficient balance! $${numAmount} × $${currentPrice.toFixed(2)} = $${cost.toFixed(2)} (You have $${balance.toFixed(2)})`);
                return;
            }
        }

        if (type === 'sell' && numAmount > coins) {
            setError(`Insufficient coins! You have ${coins.toFixed(2)} coins`);
            return;
        }

        setLoading(true);
        try {
            await onAction(type, numAmount, currentPrice);
            setAmount('');
            setError('');
        } catch (err) {
            // Error is handled by parent, but we catch here to prevent crash
            setError('Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    // Calculate how many coins user can buy at current price
    const maxBuyCoins = balance / currentPrice;
    // Calculate max revenue from selling all coins
    const maxSellRevenue = coins * currentPrice;

    const getConfig = () => {
        switch (type) {
            case 'buy':
                return {
                    icon: '📈',
                    gradient: 'from-green-600 to-emerald-600',
                    hoverGradient: 'hover:from-green-500 hover:to-emerald-500',
                    borderColor: 'border-green-500/30',
                    placeholder: 'Number of coins to buy',
                    maxValue: maxBuyCoins,
                    maxLabel: `Max: ${maxBuyCoins.toFixed(2)} coins`,
                };
            case 'sell':
                return {
                    icon: '📉',
                    gradient: 'from-red-600 to-rose-600',
                    hoverGradient: 'hover:from-red-500 hover:to-rose-500',
                    borderColor: 'border-red-500/30',
                    placeholder: 'Number of coins to sell',
                    maxValue: coins,
                    maxLabel: `Max: ${coins?.toFixed(2) || 0} coins`,
                };
            default:
                return {
                    icon: '💱',
                    gradient: 'from-purple-600 to-pink-600',
                    hoverGradient: 'hover:from-purple-500 hover:to-pink-500',
                    borderColor: 'border-purple-500/30',
                    placeholder: 'Amount',
                    maxValue: 0,
                    maxLabel: '',
                };
        }
    };

    const config = getConfig();

    const handleMaxClick = () => {
        if (config.maxValue > 0) {
            setAmount(Math.floor(config.maxValue).toString());
            setError('');
        }
    };

    // Calculate preview
    const numAmount = Number(amount) || 0;
    const previewCost = type === 'buy' ? (numAmount * currentPrice).toFixed(2) : null;
    const previewRevenue = type === 'sell' ? (numAmount * currentPrice).toFixed(2) : null;

    return (
        <div className={`cyber-card p-6 border ${config.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                    {config.maxLabel}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                    }}
                    placeholder={config.placeholder}
                    min="0.01"
                    step="0.01"
                    className="cyber-input w-full"
                    disabled={loading}
                />

                {/* Live price preview */}
                {numAmount > 0 && (
                    <div className="text-sm text-gray-400 bg-black/30 rounded-lg p-3">
                        {type === 'buy' ? (
                            <span>💰 Cost: <span className="text-green-400 font-semibold">${previewCost}</span> for {numAmount} coins</span>
                        ) : (
                            <span>💵 Revenue: <span className="text-red-400 font-semibold">${previewRevenue}</span> for {numAmount} coins</span>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !amount || Number(amount) <= 0}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${config.gradient} ${config.hoverGradient} rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                    {loading ? (
                        <>
                            <div className="spinner w-5 h-5"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            {type === 'buy' ? 'BUY KUBECOIN' : 'SELL KUBECOIN'}
                        </>
                    )}
                </button>
            </form>

            {/* Live exchange rate */}
            <div className="mt-3 text-xs text-center">
                <span className="text-gray-500">Live Rate: </span>
                <span className="text-purple-400 font-medium">1 KubeCoin = ${currentPrice.toFixed(2)}</span>
            </div>
        </div>
    );
}

export default ActionCard;
