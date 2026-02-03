import KakaoMap from '@/components/Map';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <main>
      <LoginButton />
      <KakaoMap />
      <BottomNav />
    </main>
  );
}