'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import BottomNav from '@/components/BottomNav';
import LoginButton from '@/components/LoginButton';
import LoadingSkeleton from '@/components/LoadingSkeleton';

type FilterType = 'all' | 'free' | 'paid';
type CategoryType = 'all' | 'official' | 'hidden' | 'tip';
type SortType = 'distance' | 'price' | 'rating' | 'recent';

export default function ListPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [filteredParkings, setFilteredParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');
  const [sort, setSort] = useState<SortType>('distance');
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('위치 정보 가져오기 실패:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'parkings'));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Parking[];
        setParkings(data);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParkings();
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let result = [...parkings];
    result = result.filter(p => (p.status || 'approved') === 'approved');

    if (searchTerm.trim()) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'free') {
      result = result.filter((p) => p.type === 'free');
    } else if (filter === 'paid') {
      result = result.filter((p) => p.type === 'paid');
    }

    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    if (sort === 'distance' && userLocation) {
      result.sort((a, b) => {
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.location.lat,
          a.location.lng
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.location.lat,
          b.location.lng
        );
        return distA - distB;
      });
    } else if (sort === 'price') {
      result.sort((a, b) => {
        const priceA = a.type === 'free' ? 0 : a.fee || 999999;
        const priceB = b.type === 'free' ? 0 : b.fee || 999999;
        return priceA - priceB;
      });
    } else if (sort === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sort === 'recent') {
      result.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    setFilteredParkings(result);
  }, [parkings, filter, category, sort, searchTerm, userLocation]);

  const getDistance = (parking: Parking) => {
    if (!userLocation) return '거리 계산 중...';
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      parking.location.lat,
      parking.location.lng
    );
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getCategoryLabel = (cat: string) => {
    const labels = {
      official: '🅿️ 공식',
      hidden: '💎 숨은꿀팁',
      tip: '💡 조건부무료',
    };
    return labels[cat as keyof typeof labels] || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 shadow sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">주차장 목록</h1>
            <LoginButton />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 이름, 주소, 설명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto mb-3 pb-2">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                category === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setCategory('hidden')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                category === 'hidden'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              💎 숨은꿀팁
            </button>
            <button
              onClick={() => setCategory('tip')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                category === 'tip'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              💡 조건부무료
            </button>
            <button
              onClick={() => setCategory('official')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                category === 'official'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              🅿️ 공식
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === 'free'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              무료만
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === 'paid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              유료만
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            <button
              onClick={() => setSort('distance')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                sort === 'distance'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              거리순
            </button>
            <button
              onClick={() => setSort('price')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                sort === 'price'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              가격순
            </button>
            <button
              onClick={() => setSort('rating')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                sort === 'rating'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              평점순
            </button>
            <button
              onClick={() => setSort('recent')}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                sort === 'recent'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              최신순
            </button>
          </div>

          {!loading && (
            <p className="text-sm text-gray-600 mt-3">
              총 {filteredParkings.length}개의 주차장
            </p>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="p-4 space-y-3">
            {filteredParkings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-gray-500 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '해당하는 주차장이 없습니다'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    검색 초기화
                  </button>
                )}
              </div>
            ) : (
              filteredParkings.map((parking) => (
                <div
                  key={parking.id}
                  onClick={() => router.push(`/detail/${parking.id}`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-200 relative">
                      {parking.images.length > 0 ? (
                        <img
                          src={parking.images[0]}
                          alt={parking.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-4xl">🅿️</span>
                        </div>
                      )}
                      {parking.category && parking.category !== 'official' && (
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {getCategoryLabel(parking.category)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-base sm:text-lg line-clamp-1">
                            {parking.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                              parking.type === 'free'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {parking.type === 'free' ? '무료' : '유료'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 mb-2">
                          📍 {parking.location.address}
                        </p>

                        {parking.tip && (
                          <p className="text-xs text-purple-600 mb-1 line-clamp-1">
                            💡 {parking.tip}
                          </p>
                        )}

                        {parking.type === 'paid' && parking.fee && (
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            💰 {parking.fee.toLocaleString()}원/시간
                          </p>
                        )}

                        {parking.timeLimit && (
                          <p className="text-xs text-gray-500 mb-1">
                            ⏱️ {parking.timeLimit}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>✅ {parking.verifications}명</span>
                          {parking.averageRating && (
                            <span>⭐ {parking.averageRating.toFixed(1)}</span>
                          )}
                          <span>📍 {getDistance(parking)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
