'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import BottomNav from '@/components/BottomNav';

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParking = async () => {
      try {
        const docRef = doc(db, 'parkings', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setParking({ id: docSnap.id, ...docSnap.data() } as Parking);
        } else {
          alert('주차장을 찾을 수 없습니다');
          router.push('/');
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParking();
  }, [params.id, router]);

  const handleVerify = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!parking) return;

    try {
      const docRef = doc(db, 'parkings', parking.id);
      await updateDoc(docRef, {
        verifications: parking.verifications + 1,
      });
      
      setParking({
        ...parking,
        verifications: parking.verifications + 1,
      });
      
      alert('확인되었습니다!');
    } catch (error) {
      console.error('확인 실패:', error);
      alert('확인 처리에 실패했습니다');
    }
  };

  const openInKakaoMap = () => {
    if (!parking) return;
    const url = `https://map.kakao.com/link/map/${parking.name},${parking.location.lat},${parking.location.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!parking) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white p-4 shadow sticky top-0 z-10 flex items-center">
          <button onClick={() => router.back()} className="mr-4 text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold">주차장 상세</h1>
        </div>

        {/* 이미지 */}
        {parking.images.length > 0 && (
          <div className="bg-gray-200 h-64">
            <img
              src={parking.images[0]}
              alt={parking.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 정보 */}
        <div className="bg-white p-6 space-y-4">
          <h2 className="text-2xl font-bold">{parking.name}</h2>

          <div className="space-y-2">
            <div className="flex items-start">
              <span className="font-semibold min-w-24">주소:</span>
              <span className="text-gray-700">{parking.location.address}</span>
            </div>

            <div className="flex items-center">
              <span className="font-semibold min-w-24">유형:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  parking.type === 'free'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {parking.type === 'free' ? '무료' : '유료'}
              </span>
            </div>

            {parking.fee && (
              <div className="flex items-center">
                <span className="font-semibold min-w-24">요금:</span>
                <span className="text-gray-700">{parking.fee.toLocaleString()}원/시간</span>
              </div>
            )}

            {parking.timeLimit && (
              <div className="flex items-center">
                <span className="font-semibold min-w-24">시간제한:</span>
                <span className="text-gray-700">{parking.timeLimit}</span>
              </div>
            )}

            <div className="flex items-center">
              <span className="font-semibold min-w-24">검증:</span>
              <span className="text-gray-700">
                ✅ {parking.verifications}명이 확인했어요
              </span>
            </div>
          </div>

          {parking.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">설명</p>
              <p className="text-gray-700 whitespace-pre-line">{parking.description}</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="p-6 space-y-3">
          <button
            onClick={handleVerify}
            className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg shadow-lg active:bg-green-600"
          >
            ✅ 여기 주차했어요 ({parking.verifications})
          </button>

          <button
            onClick={openInKakaoMap}
            className="w-full bg-yellow-400 text-gray-800 py-4 rounded-lg font-bold text-lg shadow-lg active:bg-yellow-500"
          >
            🗺️ 카카오맵에서 보기
          </button>
        </div>

        {/* 추가 이미지 */}
        {parking.images.length > 1 && (
          <div className="p-6">
            <p className="font-semibold mb-3">추가 사진</p>
            <div className="grid grid-cols-2 gap-3">
              {parking.images.slice(1).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${parking.name} ${idx + 2}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}