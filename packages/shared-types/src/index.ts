// Shared types across web + api
export interface User {
    id: string;
    email: string;
    firebaseUid: string;
    createdAt: string;
}

export interface Book {
    id: string;
    title: string;
    price: number;
    fileUrl: string;
}

export interface Purchase {
    id: string;
    userId: string;
    bookId: string;
    status: 'pending' | 'completed' | 'failed';
    razorpayOrderId: string;
}

export interface WaitlistEntry {
    id: string;
    email: string;
    createdAt: string;
}