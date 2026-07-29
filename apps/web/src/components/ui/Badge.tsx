interface BadgeProps {
  children: React.ReactNode
  variant?: 'bestseller' | 'new' | 'sale' | 'premium'
}

export function Badge({ children, variant = 'new' }: BadgeProps) {
  const variants = {
    bestseller: 'bg-[#FBBF24] text-[#412402]',
    new: 'bg-[#10B981] text-[#022c22]',
    sale: 'bg-red-500 text-white',
    premium: 'bg-purple-500 text-white',
  }

  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded-md text-xs font-medium
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  )
}