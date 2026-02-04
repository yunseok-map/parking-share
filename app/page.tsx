import KakaoMap from '@/components/Map';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <main className="relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <LoginButton />
      </div>
      <KakaoMap />
      <BottomNav />
    </main>
  );
}
