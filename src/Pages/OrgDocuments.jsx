import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const BUCKET = 'org-docs'

const fetchOrgDocs = async () => {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 200,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error

  const files = data || []
  return files.map((f) => {
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name)
    return {
      name: f.name,
      updated_at: f.updated_at,
      id: `${BUCKET}/${f.name}`,
      public_url: publicUrlData?.publicUrl || null,
      size: f.metadata?.size || null,
    }
  })
}

const OrgDocuments = () => {
  const queryClient = useQueryClient()
  const [filesToUpload, setFilesToUpload] = useState([])
  const [uploadError, setUploadError] = useState(null)

  const {
    data: docs = [],
    isLoading,
    isError,
    error,
  } = useQuery(['org_docs'], fetchOrgDocs)

  const uploadMutation = useMutation(
    async (files) => {
      const uploaded = []
      for (const file of files) {
        const path = `${Date.now()}-${file.name}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (upErr) throw upErr
        uploaded.push(path)
      }
      return uploaded
    },
    {
      onSuccess: () => {
        setFilesToUpload([])
        setUploadError(null)
        queryClient.invalidateQueries(['org_docs'])
      },
      onError: (err) => {
        setUploadError(err.message || String(err))
      },
    }
  )

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setFilesToUpload(files)
    setUploadError(null)
  }

  const handleUpload = (e) => {
    e.preventDefault()
    if (!filesToUpload.length || uploadMutation.isLoading) return
    uploadMutation.mutate(filesToUpload)
  }

  const totalOwnership = docs.length

  return (
    <Page
      title="Organization Documents"
      subtitle="Upload and manage club documents like bylaws, agreements, and reports."
    >
      <div className="space-y-6">
        <div className="card p-4 space-y-3">
          <div className="text-sm font-semibold text-default">Upload new documents</div>
          <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              multiple
              className="input text-xs"
              onChange={handleFileChange}
            />
            <button
              type="submit"
              className="btn-primary btn-sm"
              disabled={!filesToUpload.length || uploadMutation.isLoading}
            >
              {uploadMutation.isLoading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
          {filesToUpload.length > 0 && (
            <div className="text-xs text-muted">
              Ready to upload: {filesToUpload.map((f) => f.name).join(', ')}
            </div>
          )}
          {uploadError && (
            <div className="text-xs text-default bg-primary-soft border border-border px-3 py-2 rounded-md">
              {uploadError}
            </div>
          )}
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-default">Document library</div>
              <div className="text-xs text-muted">
                {docs.length} file{docs.length === 1 ? '' : 's'} stored in org-docs.
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="px-4 py-6 text-sm text-muted">Loading documents…</div>
          )}

          {isError && (
            <div className="px-4 py-6 text-sm text-default bg-primary-soft border-t border-border">
              Error loading documents: {error?.message || 'Unknown error'}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="divide-y divide-border/60">
              {docs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted">
                  No documents uploaded yet. Use the uploader above to get started.
                </div>
              ) : (
                docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-default truncate">
                        {doc.name}
                      </div>
                      <div className="text-xs text-muted">
                        {doc.updated_at
                          ? new Date(doc.updated_at).toLocaleString()
                          : 'Unknown modified date'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.public_url ? (
                        <a
                          href={doc.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary-soft btn-sm border border-border text-xs"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-muted">No public URL</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}

export default OrgDocuments
