function StatsCard({ title, value, type, showBailout, onBailout }) {
    const getColorClasses = () => {
        switch (type) {
            case 'balance':
                return 'from-green-400 to-emerald-500';
            case 'coins':
                return 'from-cyan-400 to-blue-500';
            default:
                return 'from-purple-400 to-pink-500';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'balance':
                return '💵';
            case 'coins':
                return '🪙';
            default:
                return '📊';
        }
    };

    return (
        <div className="cyber-card glow-border p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm uppercase tracking-wider">
                    {title}
                </span>
                <span className="text-2xl">{getIcon()}</span>
            </div>

            <div className={`text-4xl font-bold bg-gradient-to-r ${getColorClasses()} bg-clip-text text-transparent`}>
                {type === 'balance'
                    ? `$${(value ?? 0).toLocaleString()}`
                    : (value ?? 0).toLocaleString()}
            </div>

            <div className="text-xs text-gray-500 mt-2">
                {type === 'balance' ? 'US Dollars' : 'KubeCoins'}
            </div>

            {/* Bailout Button */}
            {showBailout && type === 'balance' && (
                <button
                    onClick={onBailout}
                    className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-sm font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
                >
                    <span>🆘</span>
                    Emergency Bailout
                </button>
            )}
        </div>
    );
}

export default StatsCard;
