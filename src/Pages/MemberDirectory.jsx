import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Phone, Search, UserCheck } from 'lucide-react';
import EmailModal from '../components/EmailModal.jsx';

const MemberDirectory = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [emailRecipient, setEmailRecipient] = useState(null)

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('complete_member_profiles')
        .select('member_id, email, full_name, first_name, last_name, phone, membership_status, account_status')
        .eq('membership_status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase()
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower)
    )
  })

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
      name: member.full_name || `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || 'Member',
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
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-card-title">Member Directory</p>
            <p className="app-card-subtitle">Connect with fellow FFA Investment Club members</p>
          </div>
          <div className="app-pill">
            <Users size={16} />
            {members.length} Active
          </div>
        </div>
        <div className="app-card-content">
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

      <div className="app-grid cols-3">
        {[
          {
            label: 'Active Members',
            value: members.length,
            icon: <Users size={20} />,
          },
          {
            label: 'Registered Users',
            value: members.filter(m => m.account_status === 'registered').length,
            icon: <UserCheck size={20} />,
          },
          {
            label: 'Total Contacts',
            value: members.filter(m => m.phone || m.email).length,
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
          <div className="app-card" key={member.id}>
            <div className="app-card-header">
              <div>
                <p className="app-card-title">{member.full_name || 'Member'}</p>
                {member.first_name && member.last_name && member.full_name !== `${member.first_name} ${member.last_name}` && (
                  <p className="app-card-subtitle">{member.first_name} {member.last_name}</p>
                )}
              </div>
              <div className="app-pill" style={{ background: member.account_status === 'registered' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)', color: '#fff' }}>
                {member.account_status === 'registered' ? 'Active User' : 'Member'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
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

      {filteredMembers.length === 0 && (
        <div className="app-card app-empty-state">
          <Users size={32} style={{ marginBottom: '0.8rem' }} />
          <h3>No Members Found</h3>
          <p>{searchTerm ? 'Try adjusting your search terms.' : 'No active members in the directory yet.'}</p>
        </div>
      )}

      <div className="app-card">
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
