'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { Parking } from '@/lib/types';

// 🔑 관리자 이메일 (여러 명 추가 가능)
const ADMIN_EMAILS = [
  'yunseok1312@gmail.com',  // 본인
  'admin2@gmail.com',       // 추가 관리자 1
  'admin3@gmail.com',       // 추가 관리자 2
];

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    if (!ADMIN_EMAILS.includes(user.email || '')) {
      alert('관리자 권한이 없습니다');
      router.push('/');
      return;
    }

    const fetchParkings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'parkings'));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Parking[];
        
        // 최신순 정렬
        const sorted = data.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setParkings(sorted);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParkings();
  }, [user, router]);

  const changeCategory = async (parkingId: string, newCategory: 'official' | 'hidden' | 'tip') => {
    if (!confirm('카테고리를 변경하시겠습니까?')) return;

    try {
      await updateDoc(doc(db, 'parkings', parkingId), {
        category: newCategory,
      });

      setParkings(parkings.map(p => 
        p.id === parkingId ? { ...p, category: newCategory } : p
      ));

      alert('변경 완료!');
    } catch (error) {
      console.error('변경 실패:', error);
      alert('변경에 실패했습니다');
    }
  };

  const changeStatus = async (parkingId: string, newStatus: 'approved' | 'pending') => {
    if (!confirm(`${newStatus === 'approved' ? '승인' : '대기'}하시겠습니까?`)) return;

    try {
      await updateDoc(doc(db, 'parkings', parkingId), {
        status: newStatus,
      });

      setParkings(parkings.map(p => 
        p.id === parkingId ? { ...p, status: newStatus } : p
      ));

      alert('변경 완료!');
    } catch (error) {
      console.error('변경 실패:', error);
      alert('변경에 실패했습니다');
    }
  };

  const deleteParkingAdmin = async (parkingId: string) => {
    if (!confirm('정말로 삭제하시겠습니까? 복구할 수 없습니다.')) return;

    try {
      await deleteDoc(doc(db, 'parkings', parkingId));
      setParkings(parkings.filter(p => p.id !== parkingId));
      alert('삭제 완료!');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const filteredParkings = parkings.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
  <h1 className="text-3xl font-bold">🛠️ 관리자 페이지</h1>
  <div className="flex gap-2">
    <button
      onClick={() => router.push('/admin/add')}
      className="text-sm bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      ➕ 주차장 등록
    </button>
    <button
      onClick={() => router.push('/')}
      className="text-sm bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
    >
      홈으로
    </button>
  </div>
</div>
          
          {/* 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              전체 ({parkings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'
              }`}
            >
              대기 ({parkings.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded ${
                filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
            >
              승인 ({parkings.filter(p => p.status === 'approved').length})
            </button>
          </div>
        </div>

        {/* 주차장 목록 */}
        <div className="space-y-4">
          {filteredParkings.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              해당하는 주차장이 없습니다
            </div>
          ) : (
            filteredParkings.map((parking) => (
              <div key={parking.id} className="bg-white p-6 rounded-lg shadow">
                {/* 기본 정보 */}
                <div className="flex gap-4 mb-4">
                  {/* 이미지 */}
                  {parking.images.length > 0 && (
                    <img
                      src={parking.images[0]}
                      alt={parking.name}
                      className="w-32 h-32 object-cover rounded"
                    />
                  )}

                  {/* 상세 */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{parking.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">📍 {parking.location.address}</p>
                    {parking.tip && (
                      <p className="text-sm text-purple-600 mb-1">💡 {parking.tip}</p>
                    )}
                    {parking.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{parking.description}</p>
                    )}
                  </div>
                </div>

                {/* 상태 표시 */}
                <div className="flex gap-2 mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    parking.category === 'hidden' ? 'bg-purple-100 text-purple-700' :
                    parking.category === 'tip' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {parking.category === 'hidden' ? '💎 숨은꿀팁' :
                     parking.category === 'tip' ? '💡 조건부' : '🅿️ 공식'}
                  </span>

                  <span className={`text-xs px-3 py-1 rounded-full ${
                    parking.type === 'free' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {parking.type === 'free' ? '무료' : '유료'}
                  </span>

                  <span className={`text-xs px-3 py-1 rounded-full ${
                    parking.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {parking.status === 'approved' ? '✅ 승인됨' : '⏳ 대기중'}
                  </span>

                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                    검증: {parking.verifications}명
                  </span>

                  <span className="text-xs text-gray-500">
                    {parking.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                  </span>
                </div>

                {/* 관리 버튼들 */}
                <div className="space-y-2">
                  {/* 카테고리 변경 */}
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold w-24">카테고리:</span>
                    <button
                      onClick={() => changeCategory(parking.id, 'hidden')}
                      className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                      disabled={parking.category === 'hidden'}
                    >
                      💎 숨은꿀팁
                    </button>
                    <button
                      onClick={() => changeCategory(parking.id, 'tip')}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      disabled={parking.category === 'tip'}
                    >
                      💡 조건부
                    </button>
                    <button
                      onClick={() => changeCategory(parking.id, 'official')}
                      className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                      disabled={parking.category === 'official'}
                    >
                      🅿️ 공식
                    </button>
                  </div>

                  {/* 상태 변경 */}
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold w-24">상태:</span>
                    <button
                      onClick={() => changeStatus(parking.id, 'approved')}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      disabled={parking.status === 'approved'}
                    >
                      ✅ 승인
                    </button>
                    <button
                      onClick={() => changeStatus(parking.id, 'pending')}
                      className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      disabled={parking.status === 'pending'}
                    >
                      ⏳ 대기
                    </button>
                  </div>

                  {/* 기타 */}
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold w-24">기타:</span>
                    <button
                      onClick={() => router.push(`/detail/${parking.id}`)}
                      className="text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                    >
                      👁️ 상세보기
                    </button>
                    <button
                      onClick={() => deleteParkingAdmin(parking.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

