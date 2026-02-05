import KakaoMap from '@/components/Map';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';

export default function Home() {
return (
  <div className="relative w-full h-screen">
    <div id="map" className="w-full h-full bg-gray-100" />

    {/* 로그인 버튼 (우측 상단) */}
    <div className="absolute top-4 right-4 z-30">
      <LoginButton />
    </div>
      <KakaoMap />
      <BottomNav />
    </main>
  );
}
