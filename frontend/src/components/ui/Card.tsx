/**
 * v2 Card Component - Dark mode cards
 * Clean, professional cards with dark backgrounds
 */

interface CardProps {
  variant?: 'default' | 'elevated' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}: CardProps) {
  const baseClasses = 'rounded-md transition-colors duration-150'

  const variantClasses = {
    default: 'bg-gray-DARK_200 border border-gray-DARK_300 shadow-sm',
    elevated: 'bg-gray-DARK_200 border border-gray-DARK_300 shadow-md',
    interactive: 'bg-gray-DARK_200 border border-gray-DARK_300 shadow-sm hover:border-indigo-500 hover:shadow-md cursor-pointer',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

// Card sub-components
interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className = '', children }: CardHeaderProps) {
  return <div className={`pb-4 border-b border-gray-DARK_400 mb-4 ${className}`}>{children}</div>
}

interface CardBodyProps {
  className?: string
  children: React.ReactNode
}

export function CardBody({ className = '', children }: CardBodyProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className = '', children }: CardFooterProps) {
  return <div className={`pt-4 border-t border-gray-DARK_400 mt-4 ${className}`}>{children}</div>
}
