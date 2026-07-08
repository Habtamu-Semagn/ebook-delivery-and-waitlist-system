export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  price: number; // in smallest currency unit (paise) for Razorpay
  currency: 'INR' | 'USD';
  coverUrl: string;
  status: 'available' | 'coming_soon';
}