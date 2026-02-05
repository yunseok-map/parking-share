'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import BottomNav from '@/components/BottomNav';
import FavoriteButton from '@/components/FavoriteButton';

interface Review {
  id: string;
  parkingId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

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

  useEffect(() => {
    const checkVerification = async () => {
      if (!user || !parking) return;

      try {
        const verificationRef = doc(db, 'verifications', `${user.uid}_${parking.id}`);
        const verificationSnap = await getDoc(verificationRef);

        if (verificationSnap.exists()) {
          setHasVerified(true);
        }
      } catch (error) {
        console.error('검증 확인 실패:', error);
      }
    };

    checkVerification();
  }, [user, parking]);

  useEffect(() => {
    const checkReport = async () => {
      if (!user || !parking) return;

      try {
        const reportRef = doc(db, 'reports', `${user.uid}_${parking.id}`);
        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          setHasReported(true);
        }
      } catch (error) {
        console.error('신고 확인 실패:', error);
      }
    };

    checkReport();
  }, [user, parking]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!parking) return;

      try {
        const q = query(
          collection(db, 'reviews'),
          where('parkingId', '==', parking.id),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(data);
      } catch (error) {
        console.error('리뷰 로드 실패:', error);
      }
    };

    fetchReviews();
  }, [parking]);

  const handleVerify = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!parking) return;

    if (hasVerified) {
      alert('이미 검증하셨습니다!');
      return;
    }

    setVerifying(true);

    try {
      const verificationRef = doc(db, 'verifications', `${user.uid}_${parking.id}`);
      await setDoc(verificationRef, {
        userId: user.uid,
        parkingId: parking.id,
        timestamp: new Date(),
      });

      const docRef = doc(db, 'parkings', parking.id);
      await updateDoc(docRef, {
        verifications: parking.verifications + 1,
      });

      setParking({
        ...parking,
        verifications: parking.verifications + 1,
      });

      setHasVerified(true);
      alert('검증 완료! 감사합니다 😊');
    } catch (error) {
      console.error('검증 실패:', error);
      alert('검증 처리에 실패했습니다');
    } finally {
      setVerifying(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!parking) return;

    if (hasReported) {
      alert('이미 신고하셨습니다!');
      return;
    }

    const confirmReport = confirm(
      '이 주차장이 허위 정보인가요?\n신고하시겠습니까?'
    );

    if (!confirmReport) return;

    setReporting(true);

    try {
      const reportRef = doc(db, 'reports', `${user.uid}_${parking.id}`);
      await setDoc(reportRef, {
        userId: user.uid,
        parkingId: parking.id,
        timestamp: new Date(),
      });

      const reportCountRef = doc(db, 'reportCounts', parking.id);
      const reportCountSnap = await getDoc(reportCountRef);

      if (reportCountSnap.exists()) {
        await updateDoc(reportCountRef, {
          count: reportCountSnap.data().count + 1,
        });
      } else {
        await setDoc(reportCountRef, {
          parkingId: parking.id,
          count: 1,
        });
      }

      setHasReported(true);
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    } catch (error) {
      console.error('신고 실패:', error);
      alert('신고 처리에 실패했습니다');
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !parking) return;

    if (parking.createdBy !== user.uid) {
      alert('본인이 등록한 주차장만 삭제할 수 있습니다');
      return;
    }

    const confirmDelete = confirm(
      '정말로 이 주차장을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.'
    );

    if (!confirmDelete) return;

    setDeleting(true);

    try {
      await deleteDoc(doc(db, 'parkings', parking.id));
      alert('삭제 완료!');
      router.push('/my');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!parking || !newReview.comment.trim()) {
      alert('리뷰 내용을 입력해주세요');
      return;
    }

    setSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        parkingId: parking.id,
        userId: user.uid,
        userName: user.displayName || '익명',
        userPhoto: user.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment,
        timestamp: new Date(),
      });

      const q = query(
        collection(db, 'reviews'),
        where('parkingId', '==', parking.id),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(data);

      setNewReview({ rating: 5, comment: '' });
      alert('리뷰가 등록되었습니다!');
    } catch (error) {
      console.error('리뷰 등록 실패:', error);
      alert('리뷰 등록에 실패했습니다');
    } finally {
      setSubmittingReview(false);
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
        <div className="bg-white p-4 shadow sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-4 text-2xl">
              ←
            </button>
            <h1 className="text-xl font-bold">주차장 상세</h1>
          </div>

          {user && parking.createdBy === user.uid && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 disabled:bg-gray-400"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
        </div>

        {parking.images.length > 0 && (
          <div className="bg-gray-200 h-64">
            <img
              src={parking.images[0]}
              alt={parking.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

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

        <div className="p-4 sm:p-6 space-y-3">
          <button
            onClick={handleVerify}
            disabled={verifying || hasVerified}
            className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg ${
              hasVerified
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-500 text-white active:bg-green-600'
            }`}
          >
            {hasVerified
              ? '✅ 검증 완료 (이미 검증하셨어요)'
              : verifying
              ? '처리 중...'
              : `✅ 여기 주차했어요 (${parking.verifications})`}
          </button>

          <div className="flex gap-3">
            <button
              onClick={openInKakaoMap}
              className="flex-1 bg-yellow-400 text-gray-800 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg active:bg-yellow-500"
            >
              🗺️ 카카오맵
            </button>
            
            <FavoriteButton 
              parkingId={parking.id}
              className="flex-1"
            />
          </div>

          <button
            onClick={handleReport}
            disabled={reporting || hasReported}
            className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg ${
              hasReported
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-red-500 text-white active:bg-red-600'
            }`}
          >
            {hasReported
              ? '🚫 신고 완료 (이미 신고하셨어요)'
              : reporting
              ? '처리 중...'
              : '🚫 허위 정보 신고하기'}
          </button>
        </div>

        {parking.images.length > 1 && (
          <div className="p-4 sm:p-6">
            <p className="font-semibold mb-3">추가 사진</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {parking.images.slice(1).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={parking.name + ' ' + (idx + 2)}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 bg-white mt-2">
          <h3 className="font-bold text-lg mb-4">리뷰 ({reviews.length})</h3>

          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold">별점:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="text-2xl"
                  >
                    {star <= newReview.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="이 주차장에 대한 리뷰를 남겨주세요..."
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-lg mb-2"
              />
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400"
              >
                {submittingReview ? '등록 중...' : '리뷰 등록'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 리뷰가 없습니다</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={review.userPhoto || 'https://via.placeholder.com/40'}
                      alt={review.userName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{review.userName}</p>
                      <div className="flex items-center gap-1">
                        {'⭐'.repeat(review.rating)}
                        <span className="text-xs text-gray-500 ml-2">
                          {review.timestamp?.toDate?.()?.toLocaleDateString() || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
