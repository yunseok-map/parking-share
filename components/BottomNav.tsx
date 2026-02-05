'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAILS = ['yunseok1312@gmail.com'];

export default function BottomNav() {
  const pathname = usePathname();
  const [user] = useAuthState(auth);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-14 sm:h-16 max-w-2xl mx-auto">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            pathname === '/' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl sm:text-2xl mb-0.5">🗺️</span>
          <span className="text-[10px] sm:text-xs font-medium">지도</span>
        </Link>

        <Link
          href="/list"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            pathname === '/list' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl sm:text-2xl mb-0.5">📋</span>
          <span className="text-[10px] sm:text-xs font-medium">목록</span>
        </Link>

        <Link
          href="/add"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            pathname === '/add' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl sm:text-2xl mb-0.5">➕</span>
          <span className="text-[10px] sm:text-xs font-medium">등록</span>
        </Link>

        <Link
          href="/my"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            pathname === '/my' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl sm:text-2xl mb-0.5">👤</span>
          <span className="text-[10px] sm:text-xs font-medium">내 정보</span>
        </Link>

        {/* 관리자만 보이는 탭 */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname.startsWith('/admin') ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <span className="text-xl sm:text-2xl mb-0.5">🛠️</span>
            <span className="text-[10px] sm:text-xs font-medium">관리</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
