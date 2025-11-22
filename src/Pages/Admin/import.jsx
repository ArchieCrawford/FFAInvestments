import React from 'react'
import { AdminGuard } from '@/components/AdminGuard'

const AdminImport = () => {
  return (
    <AdminGuard>
      <div className="app-page">
        <div className="card">
          <div className="card-header">
            <p className="heading-lg">Import Tools</p>
            <p className="text-muted">CSV import and data migration tools coming soon</p>
          </div>
          <div className="card-content">
            <p className="text-muted">This area will host server-side CSV importers and validation helpers. For now, it's a placeholder.</p>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminImport
