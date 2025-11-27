import React, { useState, useEffect, useMemo } from 'react';
import { getMembers } from '../lib/ffaApi'
import { Users, Mail, Phone, Search, UserCheck } from 'lucide-react';
import EmailModal from '../components/EmailModal.jsx';

const MemberDirectory = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [emailRecipient, setEmailRecipient] = useState(null)

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMembers()
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.message || 'Unable to load members')
    } finally {
      setLoading(false);
    }
  };

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
      <div className="fullscreen-center">
        <div className="spinner-page" />
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="text-lg font-semibold text-default">Member Directory</p>
            <p className="text-sm text-muted">Connect with fellow FFA Investment Club members</p>
          </div>
          <div className="app-pill">
            <Users size={16} />
            {directoryStats.active} Active
          </div>
        </div>
        <div className="card-content">
          <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Search Members
          </label>
          <div style={{ position: 'relative', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', left: '0.9rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="app-form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="card">
          <div className="card-content text-red-300">{error}</div>
        </div>
      )}

      <div className="app-grid cols-3">
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
          <div className="card-stat" key={stat.label}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{stat.label}</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stat.value}</p>
            </div>
            <div className="app-pill">{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="app-grid cols-2">
        {filteredMembers.map((member) => (
          <div className="card" key={member.id}>
            <div className="card-header">
              <div>
                <p className="text-lg font-semibold text-default">{member.displayName || 'Member'}</p>
                {member.member_name && member.member_name !== member.displayName && (
                  <p className="text-sm text-muted">{member.member_name}</p>
                )}
              </div>
              <div className="app-pill" style={{ background: member.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)', color: '#fff' }}>
                {member.status === 'active' ? 'Active' : 'Member'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                {member.email ? (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={16} />
                      <span style={{ color: 'var(--text-primary)' }}>{member.email}</span>
                    </span>
                    <button
                      className="btn btn-outline btn-sm btn-pill"
                      type="button"
                      onClick={() => handleCopyEmail(member.email)}
                    >
                      Copy
                    </button>
                    <button
                      className="btn btn-primary btn-sm btn-pill"
                      type="button"
                      onClick={() => handleOpenEmail(member)}
                    >
                      Email
                    </button>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>Email unavailable</span>
                )}
              </div>
              {copiedEmail === member.email && (
                <p style={{ fontSize: '0.75rem', color: '#c084fc' }}>Email copied to clipboard</p>
              )}
              {member.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <Phone size={16} />
                  <a href={`tel:${member.phone}`} style={{ color: 'var(--text-primary)' }}>
                    {member.phone}
                  </a>
                </div>
              )}
            </div>
            {!member.phone && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Contact via email
              </p>
            )}
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && !error && (
        <div className="card text-center">
          <Users size={32} style={{ marginBottom: '0.8rem' }} />
          <h3>No Members Found</h3>
          <p>{searchTerm ? 'Try adjusting your search terms.' : 'No active members in the directory yet.'}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem' }}>Need Help Connecting?</h3>
        <p>Club Email: Contact the administrators for member connection assistance.</p>
        <p style={{ marginTop: '0.5rem' }}>Privacy: Only active club members can view this directory. Contact information is provided voluntarily by members.</p>
      </div>

      {emailRecipient && (
        <EmailModal recipient={emailRecipient} onClose={() => setEmailRecipient(null)} />
      )}
    </div>
  );
};

export default MemberDirectory;
