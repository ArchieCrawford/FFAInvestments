import React from 'react'

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <div className="app-bg-animation">
        {/* background shapes */}
      </div>

      <main className="app-main">
        <aside className="app-sidebar">
          {/* brand + nav */}
        </aside>

        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
