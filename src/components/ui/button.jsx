import React from 'react'

// Semantic button component using the new theme system.
// Variants intentionally map ONLY to semantic classes + neutral structural Tailwind utilities.
// (legacy app-btn* classes removed)
export const Button = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  pill = false,
  ...props
}) => {
  const variantMap = {
    default: 'btn-primary-soft border border-border text-default',
    primary: 'btn-primary',
    outline: 'btn-primary-soft border border-border text-default',
    ghost: 'btn-primary-soft text-default',
    // Success / danger fall back to primary styling until extended semantics are defined
    success: 'btn-primary',
    danger: 'btn-primary'
  }

  const sizeMap = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2'
  }

  const shapeClass = pill ? 'rounded-full' : 'rounded-md'

  const classes = [
    'inline-flex items-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-border transition-colors',
    variantMap[variant] || variantMap.default,
    sizeMap[size] || sizeMap.md,
    shapeClass,
    className
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}