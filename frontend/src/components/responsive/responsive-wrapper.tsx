import React from 'react'
import { useResponsive } from '../../hooks/use-responsive'
import { useTextDirection } from '../../hooks/use-theme'
import { cn } from '../../lib/utils'

type ElementType = keyof JSX.IntrinsicElements

interface ResponsiveWrapperProps<E extends ElementType = 'div'> {
 as?: E
 className?: string
 children?: React.ReactNode
 /**
 * Enable CSS container queries on this wrapper. Default: true
 */
 enableContainer?: boolean
}

export function ResponsiveWrapper<E extends ElementType = 'div'>(props: ResponsiveWrapperProps<E> & Omit<React.ComponentPropsWithoutRef<E>, keyof ResponsiveWrapperProps<E>>) {
 const { as, className, children, enableContainer = true, ...rest } = props as ResponsiveWrapperProps & Record<string, unknown>
 const Component = (as || 'div') as ElementType
 const { alias, deviceType } = useResponsive()
 const { direction } = useTextDirection()

 return (
 <Component
 data-breakpoint={alias}
 data-device={deviceType}
 dir={direction}
 className={cn(className)}
 style={enableContainer ? ({ containerType: 'inline-size', containerName: 'responsive' } as React.CSSProperties) : undefined}
 {...(rest as any)}
 >
 {children}
 </Component>
 )
}

/**
 * Higher-order component that injects responsive data attributes and container query support.
 */
export function withResponsive<P extends object, E extends ElementType = 'div'>(
 Component: React.ComponentType<P>
) {
 const Wrapped: React.FC<P & ResponsiveWrapperProps<E>> = ({ className, enableContainer = false, ...props }) => {
 return (
 <ResponsiveWrapper className={className} enableContainer={enableContainer}>
 <Component {...(props as P)} />
 </ResponsiveWrapper>
 )
 }
 Wrapped.displayName = `withResponsive(${Component.displayName || Component.name || 'Component'})`
 return Wrapped
}
