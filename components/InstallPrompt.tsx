'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">📱 앱으로 설치하기</p>
          <p className="text-xs">홈 화면에 추가하고 편하게 사용하세요!</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInstall} className="bg-white text-blue-500 px-4 py-2 rounded font-bold text-sm">
            설치
          </button>
          <button onClick={() => setShowPrompt(false)} className="text-white px-2">✕</button>
        </div>
      </div>
    </div>
  );
}
