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
    category: 'official' as 'official' | 'hidden' | 'tip',
    fee: '',
    timeLimit: '',
    description: '',
    tip: '',
    caution: '',
    bestTime: '',
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

  if (!images || images.length === 0) {
    alert('주차장 사진을 최소 1장 이상 추가해주세요');
    return;
  }

  // ===== 새로 추가: 카테고리별 검증 =====
  if (formData.category === 'hidden') {
    if (!formData.tip || formData.tip.trim().length < 10) {
      alert('숨은꿀팁은 "꿀팁" 정보를 10자 이상 입력해주세요!\n예: "주말 오전 11시 이전만 무료, 단속 없음"');
      return;
    }
    if (images.length < 2) {
      alert('숨은꿀팁은 사진을 최소 2장 이상 추가해주세요!');
      return;
    }
    if (!formData.description || formData.description.trim().length < 20) {
      alert('숨은꿀팁은 상세 설명을 20자 이상 입력해주세요!');
      return;
    }
  }

  if (formData.category === 'tip') {
    if (!formData.tip || formData.tip.trim().length < 10) {
      alert('조건부무료는 "꿀팁"에 무료 조건을 명확히 입력해주세요!\n예: "영수증 제시 시 2시간 무료"');
      return;
    }
  }
  // ===== 여기까지 추가 =====

  setLoading(true);

  try {
    const imageUrls: string[] = [];
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const imageRef = ref(storage, `parkings/${Date.now()}_${i}`);
      await uploadBytes(imageRef, images[i]);
      const url = await getDownloadURL(imageRef);
      imageUrls.push(url);
    }

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
      status: 'approved', // 일단 바로 승인 (나중에 'pending'으로 변경 가능)
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
    setLoading(true);

    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const imageRef = ref(storage, `parkings/${Date.now()}_${i}`);
        await uploadBytes(imageRef, images[i]);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

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
      });

      alert('등록 완료! 검증 3회 이상 시 공개됩니다.');
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">주차장 등록</h1>
        <p className="text-sm text-gray-600 mb-4">
          💡 숨은 꿀팁 주차장일수록 더 가치있어요!
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow">
          {/* 카테고리 */}
          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base">
              카테고리 * <span className="text-xs text-gray-500">(어떤 종류의 주차장인가요?)</span>
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
                <div className="text-xs text-gray-500">동네 주민만 아는</div>
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
                <div className="text-xs text-gray-500">조건 충족 시</div>
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
                <div className="text-xs text-gray-500">일반 주차장</div>
              </button>
            </div>
          </div>

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

          {/* 꿀팁 정보 */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-bold text-sm mb-3">💡 꿀팁 정보 (선택)</p>
            
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
              placeholder="예: 대형마트 뒤편 주차장. 야간에는 무료로 이용 가능합니다."
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
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              📸 주차장 입구, 내부, 주변 환경 사진을 추가해주세요
            </p>
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
