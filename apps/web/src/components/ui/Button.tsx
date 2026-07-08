interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center font-medium
    transition-all duration-250 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-[#10B981] text-white border-none
      hover:bg-[#34D399] hover:shadow-[0_12px_35px_rgba(16,185,129,0.45)]
    `,
    secondary: `
      bg-transparent text-[#CBD5E1] border border-[#334155]
      hover:bg-[#1E293B]
    `,
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-5 py-2 text-sm rounded-lg',
    lg: 'px-7 py-3 text-base rounded-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {children}
    </button>
  )
}