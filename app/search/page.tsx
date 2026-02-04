'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [results, setResults] = useState<Parking[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

    const filtered = parkings.filter(
      (p) =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.location.address.toLowerCase().includes(term.toLowerCase()) ||
        p.description?.toLowerCase().includes(term.toLowerCase()) ||
        p.tip?.toLowerCase().includes(term.toLowerCase())
    );

    setResults(filtered);

    // 최근 검색어 저장
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* 검색바 */}
        <div className="bg-white p-4 shadow sticky top-0 z-10">
          <div className="flex gap-2">
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
            <div className="space-y-3">
              {results.map((parking) => (
                <div
                  key={parking.id}
                  onClick={() => router.push(`/detail/${parking.id}`)}
                  className="bg-white p-4 rounded-lg shadow cursor-pointer"
                >
                  <h3 className="font-bold mb-1">{parking.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {parking.location.address}
                  </p>
                  {parking.tip && (
                    <p className="text-xs text-purple-600">💡 {parking.tip}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}