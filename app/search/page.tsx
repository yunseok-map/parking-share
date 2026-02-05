'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

type FilterType = 'all' | 'free' | 'paid';
type CategoryType = 'all' | 'official' | 'hidden' | 'tip';
type SortType = 'relevance' | 'rating' | 'verifications' | 'name';

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [results, setResults] = useState<Parking[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // 필터 & 정렬
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [sortType, setSortType] = useState<SortType>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchParkings = async () => {
      const querySnapshot = await getDocs(collection(db, 'parkings'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Parking[];
      setParkings(data);
    };

    fetchParkings();

    // 최근 검색어 불러오기
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    // 1. 텍스트 검색
    let filtered = parkings.filter(
      (p) =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.location.address.toLowerCase().includes(term.toLowerCase()) ||
        p.description?.toLowerCase().includes(term.toLowerCase()) ||
        p.tip?.toLowerCase().includes(term.toLowerCase())
    );

    // 2. 무료/유료 필터
    if (filterType !== 'all') {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // 3. 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // 4. 정렬
    filtered = sortResults(filtered);

    setResults(filtered);

    // 최근 검색어 저장
    if (term.trim()) {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const sortResults = (data: Parking[]): Parking[] => {
    const sorted = [...data];
    
    switch (sortType) {
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
      case 'verifications':
        return sorted.sort((a, b) => b.verifications - a.verifications);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'relevance':
      default:
        return sorted;
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // 필터/정렬 변경 시 재검색
  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [filterType, categoryFilter, sortType]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* 검색바 */}
        <div className="bg-white p-4 shadow sticky top-0 z-10">
          <div className="flex gap-2 mb-3">
            <button onClick={() => router.back()} className="text-2xl">
              ←
            </button>
            <input
              type="text"
              placeholder="🔍 주차장 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* 필터 토글 버튼 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-2 bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            🎯 필터 {showFilters ? '▲' : '▼'}
          </button>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-3 space-y-3">
              {/* 무료/유료 필터 */}
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">유형</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filterType === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilterType('free')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filterType === 'free'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    💙 무료만
                  </button>
                  <button
                    onClick={() => setFilterType('paid')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filterType === 'paid'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    💰 유료
                  </button>
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">카테고리</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      categoryFilter === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setCategoryFilter('official')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      categoryFilter === 'official'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    🏢 공식
                  </button>
                  <button
                    onClick={() => setCategoryFilter('hidden')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      categoryFilter === 'hidden'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    🔍 숨은곳
                  </button>
                  <button
                    onClick={() => setCategoryFilter('tip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      categoryFilter === 'tip'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    💡 꿀팁
                  </button>
                </div>
              </div>

              {/* 정렬 */}
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">정렬</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSortType('relevance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      sortType === 'relevance'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    관련도순
                  </button>
                  <button
                    onClick={() => setSortType('verifications')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      sortType === 'verifications'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    ✅ 검증순
                  </button>
                  <button
                    onClick={() => setSortType('rating')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      sortType === 'rating'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    ⭐ 평점순
                  </button>
                  <button
                    onClick={() => setSortType('name')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      sortType === 'name'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    가나다순
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 최근 검색어 */}
        {!searchTerm && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">최근 검색어</h3>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-gray-500"
              >
                전체 삭제
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchTerm(term);
                    handleSearch(term);
                  }}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {searchTerm && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              {results.length}개의 검색 결과
            </p>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-gray-500 mb-2">검색 결과가 없습니다</p>
                <p className="text-sm text-gray-400">다른 검색어를 입력해보세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((parking) => (
                  <div
                    key={parking.id}
                    onClick={() => router.push(`/detail/${parking.id}`)}
                    className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{parking.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          parking.type === 'free'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {parking.type === 'free' ? '무료' : '유료'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {parking.location.address}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>✅ {parking.verifications}명 검증</span>
                      {parking.averageRating && (
                        <span>⭐ {parking.averageRating.toFixed(1)}</span>
                      )}
                    </div>
                    {parking.tip && (
                      <p className="text-xs text-purple-600 mt-2">💡 {parking.tip}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
