'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = ['yunseok1312@gmail.com'];

export default function AdminAddParking() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    type: 'free' as 'free' | 'paid',
    category: 'official' as 'official' | 'hidden' | 'tip',
    fee: '',
    timeLimit: '',
    description: '',
    tip: '',
    caution: '',
    bestTime: '',
  });
  const [images, setImages] = useState<FileList | null>(null);

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
  }, [user, router]);

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

    if (!images || images.length === 0) {
      alert('주차장 사진을 최소 1장 이상 추가해주세요');
      return;
    }

    setLoading(true);

    try {
      const imageUrls: string[] = [];
      const uploadPromises = [];
      
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const imageRef = ref(storage, `parkings/${Date.now()}_${i}`);
        uploadPromises.push(
          uploadBytes(imageRef, images[i]).then(() => getDownloadURL(imageRef))
        );
      }
      
      const urls = await Promise.all(uploadPromises);
      imageUrls.push(...urls);

      await addDoc(collection(db, 'parkings'), {
        name: formData.name,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address,
        },
        type: formData.type,
        category: formData.category,
        fee: formData.type === 'paid' ? parseFloat(formData.fee) : null,
        timeLimit: formData.timeLimit || null,
        description: formData.description,
        tip: formData.tip || null,
        caution: formData.caution || null,
        bestTime: formData.bestTime || null,
        images: imageUrls,
        createdBy: user.uid,
        createdAt: new Date(),
        verifications: 0,
        rating: 0,
        averageRating: 0,
        reviewCount: 0,
        status: 'approved', // 관리자는 바로 승인
      });

      alert('등록 완료! (자동 승인됨)');
      router.push('/admin');
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

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">🛠️ 관리자 주차장 등록</h1>
          <button
            onClick={() => router.push('/admin')}
            className="text-sm bg-gray-500 text-white px-4 py-2 rounded"
          >
            관리자 페이지
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded">
          ⚡ 관리자 등록은 자동 승인됩니다!
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow">
          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">
              카테고리 *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'hidden' })}
                className={`p-3 rounded-lg border-2 text-sm ${
                  formData.category === 'hidden'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">💎</div>
                <div className="font-bold">숨은꿀팁</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'tip' })}
                className={`p-3 rounded-lg border-2 text-sm ${
                  formData.category === 'tip'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">💡</div>
                <div className="font-bold">조건부무료</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'official' })}
                className={`p-3 rounded-lg border-2 text-sm ${
                  formData.category === 'official'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🅿️</div>
                <div className="font-bold">공식주차장</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">주차장 이름 *</label>
            <input
              type="text"
              required
              placeholder="예: 송도 센트럴파크 무료주차장"
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
              placeholder="예: 인천광역시 연수구 센트럴로 160"
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

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-bold text-sm mb-3">💡 꿀팁 정보</p>
            
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-xs font-medium">꿀팁</label>
                <input
                  type="text"
                  placeholder="예: 주말 오전 11시 이전만 무료"
                  className="w-full border border-gray-300 p-2 rounded text-sm"
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium">주의사항</label>
                <input
                  type="text"
                  placeholder="예: 야간 단속 있음"
                  className="w-full border border-gray-300 p-2 rounded text-sm"
                  value={formData.caution}
                  onChange={(e) => setFormData({ ...formData, caution: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium">최적 시간</label>
                <input
                  type="text"
                  placeholder="예: 평일 오후 2-5시"
                  className="w-full border border-gray-300 p-2 rounded text-sm"
                  value={formData.bestTime}
                  onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">설명</label>
            <textarea
              rows={3}
              placeholder="예: 센트럴파크 인근 무료 주차장. 평일 오전에는 비어있음."
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">
              사진 * (최소 1장, 최대 5장)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              required
              className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm"
              onChange={(e) => setImages(e.target.files)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg disabled:bg-gray-400"
          >
            {loading ? '등록 중...' : '등록하기 (자동 승인)'}
          </button>
        </form>
      </div>
    </div>
  );
}