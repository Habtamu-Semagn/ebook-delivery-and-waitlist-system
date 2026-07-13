import { createFileRoute, Link } from '@tanstack/react-router'
import { Hero } from '../components/sections/Hero'
import { Categories } from '../components/sections/Categories'
import { FeaturedBooks } from '../components/sections/FeaturedBooks'
import { WhyChooseUs } from '../components/sections/WhyChooseUs'
import { Testimonials } from '../components/sections/Testimonials'
import { Newsletter } from '../components/sections/NewsLetter'
import * as Sentry from '@sentry/tanstackstart-react'

export const Route = createFileRoute('/')({
  component: HomePage,
  errorComponent: ({ error }) => {
    // Manually notify Sentry if caught by route boundary
    Sentry.captureException(error)

    return (
      <div className="p-8 text-center border border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
        <p className="text-sm text-red-500 mt-2">{(error as Error).message}</p>
        <Link to="/">Back to Homepage</Link>
      </div>
    )
  },
})

function HomePage() {
  return (
    <main>
      <Hero />
      <Categories />
      <FeaturedBooks />
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </main>
  )
}