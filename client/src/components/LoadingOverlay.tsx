interface LoadingOverlayProps {
  isVisible: boolean;
}

export function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#f3b234] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-[#1a1a1a] font-medium">Carregando...</p>
      </div>
    </div>
  );
}
