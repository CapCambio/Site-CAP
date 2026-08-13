import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NetworkError() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-500/10 p-4 rounded-full">
              <WifiOff className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            {t('network.title')}
          </h2>
          
          <p className="text-gray-400 mb-6">
            {t('network.message')}
          </p>
          
          <button
            onClick={handleRetry}
            className="w-full bg-[#f3b234] hover:bg-[#e0a02e] text-[#1a1a1a] font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {t('network.retry')}
          </button>
        </div>
      </div>
    </div>
  );
}
