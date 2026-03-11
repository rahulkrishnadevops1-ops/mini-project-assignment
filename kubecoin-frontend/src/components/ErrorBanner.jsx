function ErrorBanner() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 error-pulse">
            <div className="bg-gradient-to-r from-red-900/90 via-red-800/90 to-red-900/90 border-b border-red-500/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-100 font-medium">
                        Connection Lost. Retrying...
                    </span>
                    <div className="spinner border-red-300 border-t-red-100"></div>
                </div>
            </div>
        </div>
    );
}

export default ErrorBanner;
