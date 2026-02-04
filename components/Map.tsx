'use client';

import { useEffect, useState, Suspense } from 'react';
import Script from 'next/script';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 주차장 데이터 로드
  useEffect(() => {
    const loadParkings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'parkings'));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Parking[];
        setParkings(data);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setDataLoaded(true);
      }
    };

    loadParkings();
  }, []);

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!mapReady) return;

    const initMap = () => {
      const container = document.getElementById('map');
      if (!container || !window.kakao || !window.kakao.maps) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
        draggable: true,
        scrollwheel: true,
        disableDoubleClick: false,
        disableDoubleClickZoom: false,
      };

      const map = new window.kakao.maps.Map(container, options);

      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      
      if (lat && lng) {
        const moveLatLon = new window.kakao.maps.LatLng(parseFloat(lat), parseFloat(lng));
        map.setCenter(moveLatLon);
        map.setLevel(3);

        const myMarker = new window.kakao.maps.Marker({
          position: moveLatLon,
        });
        myMarker.setMap(map);
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const locPosition = new window.kakao.maps.LatLng(lat, lng);
            map.setCenter(locPosition);

            const myMarker = new window.kakao.maps.Marker({
              position: locPosition,
            });
            myMarker.setMap(map);
          });
        }
      }

      // 주차장 마커 추가
      if (parkings.length > 0) {
        parkings.forEach((parking) => {
          const position = new window.kakao.maps.LatLng(
            parking.location.lat,
            parking.location.lng
          );

          const marker = new window.kakao.maps.Marker({
            position: position,
            title: parking.name,
          });

          marker.setMap(map);

          window.kakao.maps.event.addListener(marker, 'click', () => {
            router.push(`/detail/${parking.id}`);
          });

          const content = `
            <div style="padding:10px;background:white;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
              <strong>${parking.name}</strong><br/>
              <span style="color:${parking.type === 'free' ? 'blue' : 'red'}">
                ${parking.type === 'free' ? '무료' : '유료'}
              </span>
            </div>
          `;

          const infowindow = new window.kakao.maps.InfoWindow({
            content: content,
          });

          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            infowindow.open(map, marker);
          });

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            infowindow.close();
          });
        });
      }
    };

    initMap();
  }, [mapReady, parkings, router, searchParams]);

  const handleMapLoad = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setMapReady(true);
      });
    }
  };

  const goToMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          window.location.href = `/?lat=${lat}&lng=${lng}`;
        },
        () => {
          alert('위치 정보를 가져올 수 없습니다');
        }
      );
    } else {
      alert('위치 정보를 사용할 수 없습니다');
    }
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleMapLoad}
      />

      <div className="relative w-full h-screen">
        <div id="map" className="w-full h-full bg-gray-100" />

        {/* 로딩 오버레이 (지도 위에 표시) */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-lg font-semibold">지도 불러오는 중...</div>
              <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</div>
            </div>
          </div>
        )}

        {/* 주차장 개수 - 항상 표시 */}
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-30">
          <p className="text-sm font-bold">
            총 {dataLoaded ? parkings.length : 0}개
          </p>
        </div>

        {/* 버튼 그룹 - 항상 표시 */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 text-xs sm:text-sm font-medium"
          >
            🔄 새로고침
          </button>
          <button
            onClick={goToMyLocation}
            className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 text-xs sm:text-sm font-medium"
          >
            📍 내 위치
          </button>
        </div>
      </div>
    </>
  );
}

export default function KakaoMap() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}

declare global {
  interface Window {
    kakao: any;
  }
}
