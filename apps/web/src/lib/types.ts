export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  price: number; // in smallest currency unit (paise) for Razorpay
  currency: 'INR' | 'USD';
  coverUrl: string;
  image_url?: string; // Optional cover image from database
  status: 'available' | 'coming_soon';
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count?: number;
}