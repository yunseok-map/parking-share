'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { toggleFavorite, isFavorited } from '@/lib/favorites';

interface FavoriteButtonProps {
  parkingId: string;
  className?: string;
}

export default function FavoriteButton({ parkingId, className = '' }: FavoriteButtonProps) {
  const [user] = useAuthState(auth);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // 초기 즐겨찾기 상태 확인
  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, parkingId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const status = await isFavorited(user.uid, parkingId);
      setFavorited(status);
    } catch (error) {
      console.error('즐겨찾기 상태 확인 실패:', error);
    }
  };

  const handleToggle = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      const newStatus = await toggleFavorite(user.uid, parkingId);
      setFavorited(newStatus);
      
      if (newStatus) {
        alert('즐겨찾기에 추가되었습니다! ⭐');
      } else {
        alert('즐겨찾기에서 제거되었습니다.');
      }
    } catch (error: any) {
      alert(error.message || '즐겨찾기 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // 로그인 안 되어있으면 버튼 숨김
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        flex items-center justify-center
        px-4 py-2 rounded-lg
        transition-all duration-200
        ${favorited 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <span className="text-xl mr-2">
        {favorited ? '❤️' : '🤍'}
      </span>
      <span className="font-medium">
        {loading ? '처리중...' : favorited ? '즐겨찾기' : '즐겨찾기 추가'}
      </span>
    </button>
  );
}
