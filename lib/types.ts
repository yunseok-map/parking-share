export interface Parking {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'free' | 'paid';
  fee?: number;
  timeLimit?: string;
  description: string;
  images: string[];
  createdBy: string;
  createdAt: any;
  verifications: number;
  rating: number;
}