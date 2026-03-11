import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error'
        ? 'from-red-600 to-rose-600'
        : type === 'success'
            ? 'from-green-600 to-emerald-600'
            : 'from-purple-600 to-pink-600';

    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';

    return (
        <div className={`fixed bottom-4 right-4 z-50 animate-slide-up`}>
            <div className={`bg-gradient-to-r ${bgColor} px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md`}>
                <span className="text-xl">{icon}</span>
                <p className="text-white font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-4 text-white/70 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default Toast;
