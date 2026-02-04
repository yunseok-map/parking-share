'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Parking } from '@/lib/types';

const ADMIN_EMAILS = ['your-email@gmail.com']; // 여기에 본인 이메일 추가

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const [parkings, setParkings] = useState<Parking[]>([]);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      alert('관리자 권한이 없습니다');
      return;
    }

    const fetchParkings = async () => {
      const querySnapshot = await getDocs(collection(db, 'parkings'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Parking[];
      setParkings(data.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
    };

    fetchParkings();
  }, [user]);

  const changeCategory = async (parkingId: string, newCategory: string) => {
    if (!confirm('카테고리를 변경하시겠습니까?')) return;

    await updateDoc(doc(db, 'parkings', parkingId), {
      category: newCategory,
    });

    setParkings(parkings.map(p => 
      p.id === parkingId ? { ...p, category: newCategory as any } : p
    ));

    alert('변경 완료!');
  };

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return <div className="p-4">권한 없음</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">관리자 페이지</h1>
      
      <div className="space-y-4">
        {parkings.map((parking) => (
          <div key={parking.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{parking.name}</h3>
            <p className="text-sm text-gray-600">{parking.location.address}</p>
            
            <div className="mt-2 flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                parking.category === 'hidden' ? 'bg-purple-100' :
                parking.category === 'tip' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {parking.category === 'hidden' ? '💎 숨은꿀팁' :
                 parking.category === 'tip' ? '💡 조건부' : '🅿️ 공식'}
              </span>
              <span className="text-xs text-gray-500">
                검증: {parking.verifications}명
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => changeCategory(parking.id, 'hidden')}
                className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
              >
                💎 숨은꿀팁으로
              </button>
              <button
                onClick={() => changeCategory(parking.id, 'tip')}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
              >
                💡 조건부로
              </button>
              <button
                onClick={() => changeCategory(parking.id, 'official')}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
              >
                🅿️ 공식으로
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}