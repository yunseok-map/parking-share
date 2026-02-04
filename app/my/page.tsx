'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { Parking } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function MyPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [myParkings, setMyParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyParkings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'parkings'), where('createdBy', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Parking[];
        setMyParkings(data);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyParkings();
  }, [user]);

  const handleDelete = async (parkingId: string) => {
    const confirmDelete = confirm('정말로 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'parkings', parkingId));

      // 목록에서 제거
      setMyParkings(myParkings.filter((p) => p.id !== parkingId));

      alert('삭제 완료!');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-6">
        {/* 프로필 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || ''}
              alt={user.displayName || '사용자'}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-bold text-lg mb-4">나의 활동</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{myParkings.length}</p>
              <p className="text-sm text-gray-600">등록한 주차장</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">
                {myParkings.reduce((sum, p) => sum + p.verifications, 0)}
              </p>
              <p className="text-sm text-gray-600">받은 검증</p>
            </div>
          </div>
        </div>

        {/* 내가 등록한 주차장 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">내가 등록한 주차장</h3>

          {loading ? (
            <p className="text-gray-500">로딩 중...</p>
          ) : myParkings.length === 0 ? (
            <p className="text-gray-500">아직 등록한 주차장이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {myParkings.map((parking) => (
                <div
                  key={parking.id}
                  className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50"
                >
                  <div
                    onClick={() => router.push(`/detail/${parking.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{parking.name}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          parking.type === 'free'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {parking.type === 'free' ? '무료' : '유료'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{parking.location.address}</p>
                    <p className="text-xs text-gray-500">
                      ✅ {parking.verifications}명이 확인했어요
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(parking.id);
                    }}
                    className="mt-2 w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600"
                  >
                    삭제하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
