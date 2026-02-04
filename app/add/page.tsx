'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function AddParking() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    type: 'free' as 'free' | 'paid',
    fee: '',
    timeLimit: '',
    description: '',
  });
  const [images, setImages] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!formData.lat || !formData.lng) {
      alert('위도와 경도를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const imageUrls: string[] = [];
      if (images) {
        for (let i = 0; i < images.length; i++) {
          const imageRef = ref(storage, `parkings/${Date.now()}_${i}`);
          await uploadBytes(imageRef, images[i]);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        }
      }

      await addDoc(collection(db, 'parkings'), {
        name: formData.name,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address,
        },
        type: formData.type,
        fee: formData.type === 'paid' ? parseFloat(formData.fee) : null,
        timeLimit: formData.timeLimit || null,
        description: formData.description,
        images: imageUrls,
        createdBy: user.uid,
        createdAt: new Date(),
        verifications: 0,
        rating: 0,
      });

      alert('등록 완료!');
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('등록 실패: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
          alert('현재 위치를 불러왔습니다!');
        },
        () => {
          alert('위치 정보를 가져올 수 없습니다');
        }
      );
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm sm:text-base"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">주차장 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow">
          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">주차장 이름 *</label>
            <input
              type="text"
              required
              placeholder="예: 강남역 공영주차장"
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">주소 *</label>
            <input
              type="text"
              required
              placeholder="예: 서울시 강남구 역삼동 123-45"
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">위치 정보 *</label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="mb-2 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-lg w-full text-sm sm:text-base font-medium"
            >
              📍 현재 위치 가져오기
            </button>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <input
                type="number"
                step="any"
                required
                placeholder="위도"
                className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              />
              <input
                type="number"
                step="any"
                required
                placeholder="경도"
                className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">유형 *</label>
            <div className="flex gap-3 sm:gap-4">
              <label className="flex items-center text-sm sm:text-base">
                <input
                  type="radio"
                  value="free"
                  checked={formData.type === 'free'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'free' | 'paid' })}
                  className="mr-2 w-4 h-4"
                />
                무료
              </label>
              <label className="flex items-center text-sm sm:text-base">
                <input
                  type="radio"
                  value="paid"
                  checked={formData.type === 'paid'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'free' | 'paid' })}
                  className="mr-2 w-4 h-4"
                />
                유료
              </label>
            </div>
          </div>

          {formData.type === 'paid' && (
            <div>
              <label className="block mb-2 font-semibold text-sm sm:text-base">요금 (원/시간)</label>
              <input
                type="number"
                placeholder="예: 2000"
                className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">시간 제한</label>
            <input
              type="text"
              placeholder="예: 2시간, 없음"
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">설명</label>
            <textarea
              rows={3}
              placeholder="예: 대형마트 뒤편 주차장. 야간에는 무료로 이용 가능합니다."
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">사진 (최대 5장)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm"
              onChange={(e) => setImages(e.target.files)}
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">주차장 입구나 주변 사진을 추가해주세요</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg disabled:bg-gray-400"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
