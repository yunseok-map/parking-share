export interface Parking {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'free' | 'paid';
  category: 'official' | 'hidden' | 'tip'; // 새로 추가
  fee: number | null;
  timeLimit: string | null;
  description: string;
  tip?: string; // 꿀팁
  caution?: string; // 주의사항
  bestTime?: string; // 최적 시간
  images: string[];
  createdBy: string;
  createdAt: any;
  verifications: number;
  rating: number;
  averageRating?: number; // 평균 평점
  reviewCount?: number; // 리뷰 수
}

export interface UserFavorite {
  id: string;
  userId: string;
  parkingId: string;
  createdAt: any;
}
