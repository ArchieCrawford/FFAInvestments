import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'
import { getMembers } from '../lib/ffaApi'
import { Users, Mail, Phone, Search, UserCheck } from 'lucide-react';
import EmailModal from '../components/EmailModal.jsx';
import { Page } from '../components/Page'

const MemberDirectory = () => {
  const { data: members = [], isLoading: loading, error } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [emailRecipient, setEmailRecipient] = useState(null)

  const normalizedMembers = useMemo(() => {
    return members.map((member) => {
      const fallbackName = `${member.first_name || ''} ${member.last_name || ''}`.trim()
      const displayName =
        member.member_name ||
        member.full_name ||
        (fallbackName.length > 0 ? fallbackName : member.email) ||
        'Member'
      return {
        ...member,
        displayName,
        status: (member.status || member.membership_status || 'active').toLowerCase(),
      }
    })
  }, [members])

  const filteredMembers = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase()
    if (!searchLower) return normalizedMembers
    return normalizedMembers.filter((member) => {
      const nameMatch = member.displayName?.toLowerCase().includes(searchLower)
      const emailMatch = member.email?.toLowerCase().includes(searchLower)
      return Boolean(nameMatch || emailMatch)
    })
  }, [normalizedMembers, searchTerm])

  const directoryStats = useMemo(() => {
    const activeCount = normalizedMembers.filter((m) => m.status === 'active').length
    const contactsCount = normalizedMembers.filter((m) => m.phone || m.email).length
    return {
      total: normalizedMembers.length,
      active: activeCount,
      contacts: contactsCount,
    }
  }, [normalizedMembers])

  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (err) {
      console.error('Clipboard copy failed', err)
    }
  }

  const handleOpenEmail = (member) => {
    setEmailRecipient({
      name: member.displayName || 'Member',
      email: member.email
    })
  }

  if (loading) {
    return (
      <Page title="Member Directory">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading members...</p>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page 
      title="Member Directory"
      subtitle="Connect with fellow FFA Investment Club members"
      actions={
        <span className="badge bg-primary-soft text-primary px-3 py-1 flex items-center gap-2">
          <Users size={16} />
          {directoryStats.active} Active
        </span>
      }
    >
      <div className="space-y-6">
        <div className="card p-6">
          <label className="block mb-2 text-sm text-muted">
            Search Members
          </label>
          <div className="relative max-w-md">
            <Search size={16} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              className="input w-full pl-10"
              placeholder="Search name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="card p-6 border-l-4 border-red-500">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'Total Members',
              value: directoryStats.total,
              icon: <Users size={20} />,
            },
            {
              label: 'Active Members',
              value: directoryStats.active,
              icon: <UserCheck size={20} />,
            },
            {
              label: 'Total Contacts',
              value: directoryStats.contacts,
              icon: <Mail size={20} />,
            },
          ].map((stat) => (
            <div className="card p-6" key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-default">{stat.value}</p>
                </div>
                <div className="text-primary">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* List View */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted w-56">Member</th>
                  <th className="px-4 py-3 font-medium text-muted">Email</th>
                  <th className="px-4 py-3 font-medium text-muted w-32">Status</th>
                  <th className="px-4 py-3 font-medium text-muted w-32">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const showAltName = member.member_name && member.member_name !== member.displayName;
                  return (
                    <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-primary-soft/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-default">{member.displayName || 'Member'}</span>
                          {showAltName && (
                            <span className="text-xs text-muted">{member.member_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.email ? (
                          <span className="inline-flex items-center gap-2">
                            <Mail size={14} className="text-muted" />
                            <span className="text-default break-all">{member.email}</span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                        {copiedEmail === member.email && (
                          <span className="ml-2 text-xs text-primary">Copied</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.status === 'active' ? 'bg-green-500/15 text-green-600' : 'bg-primary-soft text-primary'}`}>{member.status === 'active' ? 'Active' : 'Member'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {member.phone ? (
                          <a href={`tel:${member.phone}`} className="text-default hover:text-primary flex items-center gap-2">
                            <Phone size={14} className="text-muted" /> {member.phone}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {member.email && (
                            <>
                              <button
                                className="btn-primary-soft border border-border text-xs px-3 py-1 rounded-full"
                                type="button"
                                onClick={() => handleCopyEmail(member.email)}
                              >
                                Copy
                              </button>
                              <button
                                className="btn-primary text-xs px-3 py-1 rounded-full"
                                type="button"
                                onClick={() => handleOpenEmail(member)}
                              >
                                Email
                              </button>
                            </>
                          )}
                          {!member.email && (
                            <span className="text-xs text-muted">No email</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted">
                      No members match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMembers.length === 0 && !error && (
          <div className="card p-12 text-center">
            <Users size={32} className="mx-auto mb-4 text-muted" />
            <h3 className="text-lg font-semibold text-default mb-2">No Members Found</h3>
            <p className="text-muted">{searchTerm ? 'Try adjusting your search terms.' : 'No active members in the directory yet.'}</p>
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-default mb-3">Need Help Connecting?</h3>
          <p className="text-muted mb-2">Club Email: Contact the administrators for member connection assistance.</p>
          <p className="text-sm text-muted">Privacy: Only active club members can view this directory. Contact information is provided voluntarily by members.</p>
        </div>

        {emailRecipient && (
          <EmailModal recipient={emailRecipient} onClose={() => setEmailRecipient(null)} />
        )}
      </div>
    </Page>
  );
};

export default MemberDirectory;
