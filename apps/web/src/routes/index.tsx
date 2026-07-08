import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '../components/sections/Hero'
import { Categories } from '../components/sections/Categories'
import { FeaturedBooks } from '../components/sections/FeaturedBooks'
import { WhyChooseUs } from '../components/sections/WhyChooseUs'
import { Testimonials } from '../components/sections/Testimonials'
import { Newsletter } from '../components/sections/NewsLetter'

export const Route = createFileRoute('/')({
  component: HomePage,
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