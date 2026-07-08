import type { Book } from './types';

// TEMPORARY — replace with a Supabase/NestJS fetch once the API is ready.
// Swap point is the `getBooks` / `getBookBySlug` functions below, not the callers.
export const mockBooks: Book[] = [
  {
    id: '1',
    slug: 'the-quiet-algorithm',
    title: 'The Quiet Algorithm',
    author: 'Naledi Osei',
    description:
      'A field guide to building calm, deliberate software teams — drawn from a decade of postmortems, one-on-ones, and the occasional well-timed silence.',
    price: 49900,
    currency: 'INR',
    coverUrl: 'https://placehold.co/400x600/1E2A45/FAF7F1?text=The+Quiet+Algorithm',
    status: 'available',
  },
  {
    id: '2',
    slug: 'letters-from-the-margins',
    title: 'Letters from the Margins',
    author: 'Priya Ramaswamy',
    description:
      'Essays written in the white space of other people\u2019s books — on reading as an act of resistance and repair.',
    price: 39900,
    currency: 'INR',
    coverUrl: 'https://placehold.co/400x600/3F6659/FAF7F1?text=Letters',
    status: 'available',
  },
  {
    id: '3',
    slug: 'the-second-draft',
    title: 'The Second Draft',
    author: 'Wren Castellano',
    description:
      'A craft book on revision for writers who finish first drafts easily and everything after that badly.',
    price: 44900,
    currency: 'INR',
    coverUrl: 'https://placehold.co/400x600/8A8578/FAF7F1?text=Second+Draft',
    status: 'coming_soon',
  },
];

export async function getBooks(): Promise<Book[]> {
  return mockBooks;
}

export async function getBookBySlug(slug: string): Promise<Book | undefined> {
  return mockBooks.find((b) => b.slug === slug);
}