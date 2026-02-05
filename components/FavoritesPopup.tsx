'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { getUserFavorites } from '@/lib/favorites';
import { Parking } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface FavoritesPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoritesPopup({ isOpen, onClose }: FavoritesPopupProps) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [favoriteParkings, setFavoriteParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadFavorites();
    }
  }, [isOpen, user]);

  const loadFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const favorites = await getUserFavorites(user.uid);
      const favoriteParkingIds = favorites.map(f => f.parkingId);
      
      if (favoriteParkingIds.length > 0) {
        // Firestore 'in' 쿼리는 최대 10개까지만 가능
        const chunks = [];
        for (let i = 0; i < favoriteParkingIds.length; i += 10) {
          chunks.push(favoriteParkingIds.slice(i, i + 10));
        }

        const allParkings: Parking[] = [];
        for (const chunk of chunks) {
          const parkingsQuery = query(
            collection(db, 'parkings'),
            where('__name__', 'in', chunk)
          );
          const parkingsSnapshot = await getDocs(parkingsQuery);
          const chunkParkings = parkingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Parking[];
          allParkings.push(...chunkParkings);
        }
        
        setFavoriteParkings(allParkings);
      } else {
        setFavoriteParkings([]);
      }
    } catch (error) {
      console.error('즐겨찾기 로드 실패:', error);
      setFavoriteParkings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleParkingClick = (parkingId: string) => {
    onClose();
    router.push(`/detail/${parkingId}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 (배경 어둡게) */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* 팝업 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden animate-slide-up">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            즐겨찾기 ({favoriteParkings.length})
          </h2>
          <button 
            onClick={onClose}
            className="text-3xl text-gray-400 hover:text-gray-600 leading-none"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto max-h-[calc(70vh-80px)] px-6 py-4">
          {!user ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/');
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
              >
                로그인하러 가기
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : favoriteParkings.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🤍</span>
              <p className="text-gray-500 mb-2">아직 즐겨찾기한 주차장이 없습니다</p>
              <p className="text-sm text-gray-400">주차장 상세 페이지에서 ❤️ 버튼을 눌러보세요!</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {favoriteParkings.map((parking) => (
                <div
                  key={parking.id}
                  onClick={() => handleParkingClick(parking.id)}
                  className="border border-gray-200 p-4 rounded-xl hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{parking.name}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        parking.type === 'free'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {parking.type === 'free' ? '무료' : '유료'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{parking.location.address}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>✅ {parking.verifications}명 검증</span>
                    <span className="text-blue-500 font-medium">상세보기 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
