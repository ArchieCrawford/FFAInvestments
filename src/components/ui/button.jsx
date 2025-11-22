import React from 'react'

export const Button = ({ children, className = "", variant = "default", size = "md", pill = false, ...props }) => {
  // Map component props to design-system classes
  const variantMap = {
    default: 'app-btn',
    primary: 'app-btn app-btn-primary',
    outline: 'app-btn app-btn-outline',
    ghost: 'app-btn',
    success: 'app-btn app-btn-success',
    danger: 'app-btn app-btn-danger'
  }

  const sizeMap = {
    sm: 'app-btn-sm',
    md: ''
  }

  const pillClass = pill ? 'app-btn-pill' : ''

  const classes = [variantMap[variant] || variantMap.default, sizeMap[size] || '', pillClass, className].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}