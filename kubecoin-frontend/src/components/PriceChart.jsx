import { useMemo } from 'react';

function PriceChart({ currentPrice, priceHistory }) {
    // Calculate chart dimensions
    const chartWidth = 280;
    const chartHeight = 100;
    const padding = 10;

    // Generate SVG path
    const pathData = useMemo(() => {
        if (priceHistory.length < 2) return '';

        const minPrice = Math.min(...priceHistory) - 0.5;
        const maxPrice = Math.max(...priceHistory) + 0.5;
        const priceRange = maxPrice - minPrice || 1;

        const points = priceHistory.map((price, i) => {
            const x = padding + (i / (priceHistory.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((price - minPrice) / priceRange) * (chartHeight - 2 * padding);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    }, [priceHistory]);

    // Calculate price change
    const priceChange = priceHistory.length >= 2
        ? currentPrice - priceHistory[0]
        : 0;
    const priceChangePercent = priceHistory.length >= 2
        ? ((priceChange / priceHistory[0]) * 100).toFixed(2)
        : 0;
    const isPositive = priceChange >= 0;

    return (
        <div className="cyber-card glow-border p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">
                        KubeCoin Price
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-3xl font-bold text-white">
                            ${currentPrice.toFixed(2)}
                        </span>
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent}%)
                        </span>
                    </div>
                </div>
                <span className="text-3xl">📈</span>
            </div>

            {/* Chart */}
            <div className="bg-black/30 rounded-lg p-2 mt-4">
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2}
                        stroke="rgba(147, 51, 234, 0.2)" strokeDasharray="4" />

                    {/* Price line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={isPositive ? '#22c55e' : '#ef4444'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Gradient fill */}
                    <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {pathData && (
                        <path
                            d={`${pathData} L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`}
                            fill="url(#priceGradient)"
                        />
                    )}
                </svg>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 min ago</span>
                <span>Now</span>
            </div>

            <div className="mt-4 text-xs text-purple-400 text-center font-medium">
                🔴 Live Exchange Rate
            </div>
        </div>
    );
}

export default PriceChart;
