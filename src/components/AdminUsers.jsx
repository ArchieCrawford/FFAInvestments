import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CSVImporter from './CSVImporter.jsx';
import MemberEditModal from './MemberEditModal.jsx';
import DeleteMemberModal from './DeleteMemberModal.jsx';

export default function AdminUsers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          member_accounts (
            current_units,
            current_value,
            total_contributions
          )
        `)
        .order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      const mapped = (data || []).map((row) => ({
        id: row.id,
        name: row.full_name || row.member_name || 'Unknown',
        email: row.email || null,
        role: row.role || 'member',
        status: row.membership_status || 'active',
        currentBalance: row.member_accounts?.[0]?.current_value ?? 0,
        totalUnits: row.member_accounts?.[0]?.current_units ?? 0,
        joinDate: row.join_date || row.created_at || new Date().toISOString(),
      }));

      setMembers(mapped);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceLoadDefaultMembers = async () => {
    alert(
      'Default FFA members are now managed via the database/seed scripts. Use CSV import or database seeding to load them.'
    );
  };

  const handleImportComplete = () => {
    loadMembers();
  };

  const handleInviteMember = async (memberId, providedEmail) => {
    const email =
      providedEmail ||
      prompt('Enter email address for invitation:');
    if (!email) return;

    try {
      const inviteToken =
        'inv_' + Math.random().toString(36).slice(2, 11);

      const { data, error } = await supabase
        .from('members')
        .update({
          email,
          invite_token: inviteToken,
          membership_status: 'invited',
          invited_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select('id, full_name, email, invite_token')
        .single();

      if (error) {
        throw error;
      }

      await loadMembers();

      const inviteLink = `${window.location.origin}/invite/${inviteToken}`;

      const copyLink = confirm(
        `Invitation prepared successfully!\n\nInvite link: ${inviteLink}\n\nWould you like to copy the link to clipboard?`
      );

      if (copyLink) {
        await navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
      }
    } catch (error) {
      alert('Failed to send invitation: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member) => {
    setDeletingMember(member);
    setShowDeleteModal(true);
  };

  const handleRoleChange = async (member, newRole) => {
    if (!member?.id) return;

    if (window.confirm(`Change ${member.name}'s role to ${newRole}?`)) {
      try {
        const { error } = await supabase
          .from('members')
          .update({ role: newRole })
          .eq('id', member.id);

        if (error) throw error;
        await loadMembers();
      } catch (error) {
        alert('Failed to update role: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="app-pill">Active</span>;
      case 'invited':
        return <span className="app-pill">Invited</span>;
      case 'pending_invite':
        return <span className="app-pill">Pending Invite</span>;
      default:
        return <span className="app-pill">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <div className="spinner-page" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Members</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="app-btn app-btn-outline"
            onClick={() => setShowAddModal(true)}
          >
            + Add Member
          </button>
          <button
            className="app-btn app-btn-primary"
            onClick={() => setShowCsvImport(!showCsvImport)}
          >
            <i className="fas fa-upload" style={{ marginRight: 8 }}></i>
            {showCsvImport ? 'Hide' : 'Show'} CSV Import
          </button>
          <button
            className="app-btn app-btn-success"
            onClick={forceLoadDefaultMembers}
          >
            <i className="fas fa-database" style={{ marginRight: 8 }}></i>
            Load FFA Members
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="app-btn app-btn-outline"
              onClick={() => setTopMenuOpen(!topMenuOpen)}
            >
              •••
            </button>
            {topMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  zIndex: 30,
                }}
              >
                <div className="app-card">
                  <div className="app-card-content">
                    <button
                      className="app-btn app-btn-plain"
                      onClick={async () => {
                        setTopMenuOpen(false);
                        if (
                          window.confirm(
                            'Send invitations to all members without email addresses and in pending_invite status?'
                          )
                        ) {
                          for (const m of members.filter(
                            (x) =>
                              !x.email &&
                              x.status === 'pending_invite'
                          )) {
                            const email = prompt(
                              `Enter email for ${m.name}:`
                            );
                            if (email) {
                              await handleInviteMember(m.id, email);
                            }
                          }
                        }
                      }}
                    >
                      <i
                        className="fas fa-envelope-bulk"
                        style={{ marginRight: 8 }}
                      ></i>
                      Bulk Send Invites
                    </button>
                    <hr />
                    <button
                      className="app-btn app-btn-plain app-text-warning"
                      onClick={() => {
                        setTopMenuOpen(false);
                        if (
                          window.confirm(
                            'Export all member data to CSV?'
                          )
                        ) {
                          const csvData = members.map((m) => ({
                            Name: m.name,
                            Email: m.email || '',
                            Role: m.role,
                            Status: m.status,
                            'Portfolio Value':
                              m.currentBalance || 0,
                            'Total Units': m.totalUnits || 0,
                          }));
                          console.log('Export data:', csvData);
                          alert(
                            'Export functionality would be implemented here'
                          );
                        }
                      }}
                    >
                      <i
                        className="fas fa-download"
                        style={{ marginRight: 8 }}
                      ></i>
                      Export Member Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCsvImport && (
        <div className="mb-4">
          <CSVImporter onImportComplete={handleImportComplete} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Total Members</div>
            <div className="app-heading-lg">{members.length}</div>
          </div>
          <i className="fas fa-users fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Active Members</div>
            <div className="app-heading-lg">
              {members.filter((m) => m.status === 'active').length}
            </div>
          </div>
          <i className="fas fa-user-check fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Pending Invites</div>
            <div className="app-heading-lg">
              {
                members.filter(
                  (m) => m.status === 'pending_invite'
                ).length
              }
            </div>
          </div>
          <i className="fas fa-user-clock fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Total AUM</div>
            <div className="app-heading-lg">
              {formatCurrency(
                members.reduce(
                  (sum, m) => sum + (m.currentBalance || 0),
                  0
                )
              )}
            </div>
          </div>
          <i className="fas fa-dollar-sign fa-2x" />
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h5 className="app-card-title">Member Directory</h5>
        </div>
        <div className="app-card-content">
          <div className="app-table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Balance</th>
                  <th>Total Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center app-text-muted"
                    >
                      No members found. Import CSV data or add members
                      manually.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="app-user-avatar"
                            style={{
                              width: '32px',
                              height: '32px',
                              fontSize: '12px',
                            }}
                          >
                            {member.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || '?'}
                          </div>
                          <div>
                            <div className="app-heading-md">
                              {member.name}
                            </div>
                            <small className="app-text-muted">
                              Joined{' '}
                              {new Date(
                                member.joinDate
                              ).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-decoration-none"
                          >
                            {member.email}
                          </a>
                        ) : (
                          <span className="app-text-muted">
                            Not provided
                          </span>
                        )}
                      </td>
                      <td>
                        {formatCurrency(
                          member.currentBalance || 0
                        )}
                      </td>
                      <td>
                        {member.totalUnits != null
                          ? member.totalUnits.toFixed(2)
                          : '0.00'}
                      </td>
                      <td>{getStatusBadge(member.status)}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                          }}
                        >
                          {member.status ===
                            'pending_invite' && (
                            <button
                              className="app-btn app-btn-sm app-btn-outline"
                              onClick={() =>
                                handleInviteMember(member.id)
                              }
                              title="Send Invitation"
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                          )}
                          <button
                            className="app-btn app-btn-sm app-btn-outline app-btn-primary"
                            onClick={() =>
                              handleEditMember(member)
                            }
                            title="Edit Member Profile"
                          >
                            <i className="fas fa-edit"></i>
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              className="app-btn app-btn-sm app-btn-outline app-btn-warning"
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === member.id
                                    ? null
                                    : member.id
                                )
                              }
                              title="Change Role"
                            >
                              <i className="fas fa-user-cog"></i>
                            </button>
                            {openDropdownId === member.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: 8,
                                  zIndex: 30,
                                }}
                              >
                                <div className="app-card">
                                  <div className="app-card-content">
                                    <button
                                      className="app-btn app-btn-plain"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleRoleChange(
                                          member,
                                          member.role === 'admin'
                                            ? 'member'
                                            : 'admin'
                                        );
                                      }}
                                    >
                                      <i
                                        className={`fas ${
                                          member.role ===
                                          'admin'
                                            ? 'fa-user'
                                            : 'fa-crown'
                                        }`}
                                        style={{
                                          marginRight: 8,
                                        }}
                                      ></i>
                                      Make{' '}
                                      {member.role === 'admin'
                                        ? 'Member'
                                        : 'Admin'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <a
                            href={`/member/${member.id}/dashboard`}
                            className="app-btn app-btn-sm app-btn-outline app-btn-info"
                            title="View Member Dashboard"
                          >
                            <i className="fas fa-chart-line"></i>
                          </a>
                          <button
                            className="app-btn app-btn-sm app-btn-outline app-btn-danger"
                            onClick={() =>
                              handleDeleteMember(member)
                            }
                            title="Delete Member"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MemberEditModal
        member={editingMember}
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        onSaved={loadMembers}
      />

      <DeleteMemberModal
        member={deletingMember}
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingMember(null);
        }}
        onDeleted={loadMembers}
      />
    </>
  );
}
