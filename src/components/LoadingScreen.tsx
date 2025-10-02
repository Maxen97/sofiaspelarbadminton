'use client';

interface LoadingScreenProps {
  isVisible: boolean;
}

export default function LoadingScreen({ isVisible }: LoadingScreenProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-black/95 flex items-center justify-center z-[9999] text-white text-center">
      <div className="p-8 max-w-[350px]">
        <div className="w-[60px] h-[60px] mx-auto mb-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold mb-2">Laddar...</h2>
      </div>
    </div>
  );
}
