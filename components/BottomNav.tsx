'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 ${
            pathname === '/' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl mb-1">🗺️</span>
          <span className="text-xs font-medium">지도</span>
        </Link>

        <Link
          href="/add"
          className={`flex flex-col items-center justify-center flex-1 ${
            pathname === '/add' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl mb-1">➕</span>
          <span className="text-xs font-medium">등록</span>
        </Link>

        <Link
          href="/my"
          className={`flex flex-col items-center justify-center flex-1 ${
            pathname === '/my' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl mb-1">👤</span>
          <span className="text-xs font-medium">내 정보</span>
        </Link>
      </div>
    </nav>
  );
}