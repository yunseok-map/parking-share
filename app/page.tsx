'use client';

import { useState } from 'react';
import KakaoMap from '@/components/Map';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';
import InstallPrompt from '@/components/InstallPrompt';
import FavoritesPopup from '@/components/FavoritesPopup';

export default function Home() {
  const [showFavorites, setShowFavorites] = useState(false);

  return (
    <div className="relative">
      <KakaoMap />
      <div className="absolute top-4 right-4 z-30">
        <LoginButton />
      </div>
      
      {/* 즐겨찾기 FAB - 우측 하단 */}
      <button
        onClick={() => setShowFavorites(true)}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 bg-yellow-400 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl hover:bg-yellow-500 hover:scale-110 active:scale-95 transition-all z-[60] flex items-center justify-center text-2xl sm:text-3xl"
        aria-label="즐겨찾기 보기"
      >
        ⭐
      </button>

      {/* 즐겨찾기 팝업 */}
      <FavoritesPopup 
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
      />

      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
