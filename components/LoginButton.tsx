'use client';

import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function LoginButton() {
  const [user, loading] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {user ? (
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
          <img
            src={user.photoURL || ''}
            alt={user.displayName || '사용자'}
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
        >
          Google 로그인
        </button>
      )}
    </div>
  );
}