'use client';

import KakaoMap from '@/components/Map';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';
import InstallPrompt from '@/components/InstallPrompt';

export default function Home() {
  return (
    <div className="relative">
      <KakaoMap />
      <div className="absolute top-4 right-4 z-30">
        <LoginButton />
      </div>
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
