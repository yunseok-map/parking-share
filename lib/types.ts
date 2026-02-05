export interface Parking {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'free' | 'paid';
  category: 'official' | 'hidden' | 'tip';
  status?: 'approved' | 'pending';
  fee: number | null;
  timeLimit: string | null;
  description: string;
  tip?: string;
  caution?: string;
  bestTime?: string;
  images: string[];
  createdBy: string;
  createdAt: any;
  verifications: number;
  rating: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface UserFavorite {
  id: string;
  userId: string;
  parkingId: string;
  createdAt: any;
}
