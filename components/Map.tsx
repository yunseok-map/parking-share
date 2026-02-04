'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Parking } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function KakaoMap() {
  const router = useRouter();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // 주차장 데이터 로드
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
      }
    };

    loadParkings();
  }, []);

  useEffect(() => {
    if (!mapReady || parkings.length === 0) return;

    const initMap = () => {
      const container = document.getElementById('map');
      if (!container || !window.kakao || !window.kakao.maps) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 현재 위치
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          map.setCenter(locPosition);

          // 현재 위치 마커
          const myMarker = new window.kakao.maps.Marker({
            position: locPosition,
          });
          myMarker.setMap(map);
        });
      }

      // 주차장 마커
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

        // 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          router.push(`/detail/${parking.id}`);
        });

        // 인포윈도우
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
    };

    initMap();
  }, [mapReady, parkings, router]);

  const handleMapLoad = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setMapReady(true);
      });
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
        
        {!mapReady && (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div className="text-lg font-semibold">지도 불러오는 중...</div>
      <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</div>
    </div>
  </div>
)}

        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm font-bold">총 {parkings.length}개</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10 hover:bg-blue-600"
        >
          🔄 새로고침
        </button>
      </div>
    </>
  );
}

declare global {
  interface Window {
    kakao: any;
  }
}
