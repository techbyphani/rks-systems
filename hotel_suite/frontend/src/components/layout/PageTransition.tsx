import { ReactNode } from 'react'
import './PageTransition.css'

interface PageTransitionProps {
  children: ReactNode
  /**
   * Optional: Enable premium scale animation (slightly slower but more polished)
   * Default: false (standard fade + slide)
   */
  premium?: boolean
}

/**
 * Professional page transition component
 * 
 * Features:
 * - Material Design standard timing (250ms)
 * - Accessibility: Respects prefers-reduced-motion
 * - Performance optimized with will-change
 * - Subtle 8px slide for spatial context
 * - Industry-standard easing curve
 * 
 * Usage:
 * <PageTransition key={location.pathname}>
 *   {children}
 * </PageTransition>
 */
export default function PageTransition({ children, premium = false }: PageTransitionProps) {
  return (
    <div className={`page-transition-wrapper ${premium ? 'premium' : ''}`}>
      {children}
    </div>
  )
}
