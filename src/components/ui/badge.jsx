import React from 'react'

export const Badge = ({ children, className = "", variant = "default", ...props }) => {
  const baseClasses = "badge"
  const variants = {
    default: "bg-primary-soft",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  }
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}