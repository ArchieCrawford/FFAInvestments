import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const memberList = await base44.entities.User.list();
      setMembers(memberList);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceLoadDefaultMembers = async () => {
    try {
      setLoading(true);
      // Clear existing data and force load defaults
      localStorage.removeItem('members');
      const defaultMembers = await base44.entities.User.loadDefaultMembers();
      setMembers(defaultMembers);
      alert(`Loaded ${defaultMembers.length} default FFA members successfully!`);
    } catch (error) {
      console.error('Error loading default members:', error);
      alert('Failed to load default members: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = () => {
    loadMembers();
  };

  const handleInviteMember = async (memberId) => {
    const email = prompt('Enter email address for invitation:');
    if (!email) return;

    try {
      const result = await base44.entities.User.sendInvite(memberId, email);
      loadMembers();
      
      // Show the invite link to the admin
      const copyLink = confirm(
        `Invitation sent successfully!\n\nInvite link: ${result.inviteLink}\n\nWould you like to copy the link to clipboard?`
      );
      
      if (copyLink) {
        navigator.clipboard.writeText(result.inviteLink);
        alert('Invite link copied to clipboard!');
      }
    } catch (error) {
      alert('Failed to send invitation: ' + error.message);
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
    if (window.confirm(`Change ${member.name}'s role to ${newRole}?`)) {
      try {
        await base44.entities.User.update(member.id, { role: newRole });
        loadMembers();
      } catch (error) {
        alert('Failed to update role: ' + error.message);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    // Use design-system pill for status; keep semantics only
    switch (status) {
      case 'active': return <span className="app-pill">Active</span>;
      case 'invited': return <span className="app-pill">Invited</span>;
      case 'pending_invite': return <span className="app-pill">Pending Invite</span>;
      default: return <span className="app-pill">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-page" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Members</h2>
        <div>
          <button className="app-btn app-btn-outline me-2" onClick={() => setShowAddModal(true)}>
            + Add Member
          </button>
          <div className="btn-group">
            <button 
              className="app-btn app-btn-primary" 
              onClick={() => setShowCsvImport(!showCsvImport)}
            >
              <i className="fas fa-upload me-1"></i>
              {showCsvImport ? 'Hide' : 'Show'} CSV Import
            </button>
            <button 
              className="app-btn app-btn-success me-2" 
              onClick={forceLoadDefaultMembers}
            >
              <i className="fas fa-database me-1"></i>
              Load FFA Members
            </button>
            <button 
              className="app-btn app-btn-primary dropdown-toggle dropdown-toggle-split"
              data-bs-toggle="dropdown"
            >
              <span className="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu">
              <li>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    if (window.confirm('Send invitations to all members without email addresses?')) {
                      // Bulk invite functionality
                      members.filter(m => !m.email && m.status === 'pending_invite').forEach(member => {
                        const email = prompt(`Enter email for ${member.name}:`);
                        if (email) {
                          handleInviteMember(member.id);
                        }
                      });
                    }
                  }}
                >
                  <i className="fas fa-envelope-bulk me-2"></i>
                  Bulk Send Invites
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item text-warning"
                  onClick={() => {
                    if (window.confirm('Export all member data to CSV?')) {
                      // Export functionality
                      const csvData = members.map(m => ({
                        Name: m.name,
                        Email: m.email || '',
                        Role: m.role,
                        Status: m.status,
                        'Portfolio Value': m.currentBalance || 0,
                        'Total Units': m.totalUnits || 0
                      }));
                      console.log('Export data:', csvData);
                      alert('Export functionality would be implemented here');
                    }
                  }}
                >
                  <i className="fas fa-download me-2"></i>
                  Export Member Data
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSV Import Section */}
      {showCsvImport && (
        <div className="mb-4">
          <CSVImporter onImportComplete={handleImportComplete} />
        </div>
      )}

      {/* Members Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="app-card app-card-stat">
            <div>
              <div className="app-heading-md">Total Members</div>
              <div className="app-heading-lg">{members.length}</div>
            </div>
            <i className="fas fa-users fa-2x" />
          </div>
        </div>
        <div className="col-md-3">
          <div className="app-card app-card-stat">
            <div>
              <div className="app-heading-md">Active Members</div>
              <div className="app-heading-lg">{members.filter(m => m.status === 'active').length}</div>
            </div>
            <i className="fas fa-user-check fa-2x" />
          </div>
        </div>
        <div className="col-md-3">
          <div className="app-card app-card-stat">
            <div>
              <div className="app-heading-md">Pending Invites</div>
              <div className="app-heading-lg">{members.filter(m => m.status === 'pending_invite').length}</div>
            </div>
            <i className="fas fa-user-clock fa-2x" />
          </div>
        </div>
        <div className="col-md-3">
          <div className="app-card app-card-stat">
            <div>
              <div className="app-heading-md">Total AUM</div>
              <div className="app-heading-lg">
                {formatCurrency(members.reduce((sum, m) => sum + (m.currentBalance || 0), 0))}
              </div>
            </div>
            <i className="fas fa-dollar-sign fa-2x" />
          </div>
        </div>
      </div>
      
      {/* Members Table */}
      <div className="app-card">
        <div className="app-card-header">
          <h5 className="app-card-title">Member Directory</h5>
        </div>
        <div className="app-card-content">
          <div className="table-responsive">
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
                  <td colSpan="6" className="text-center text-muted">
                    No members found. Import CSV data or add members manually.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="app-user-avatar me-2" style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                          {member.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <div className="app-heading-md">{member.name}</div>
                          <small className="app-text-muted">
                            Joined {new Date(member.joinDate).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {member.email ? (
                        <a href={`mailto:${member.email}`} className="text-decoration-none">
                          {member.email}
                        </a>
                      ) : (
                        <span className="app-text-muted">Not provided</span>
                      )}
                    </td>
                    <td>{formatCurrency(member.currentBalance || 0)}</td>
                    <td>{member.totalUnits?.toFixed(2) || '0.00'}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        {member.status === 'pending_invite' && (
                          <button 
                            className="app-btn app-btn-sm app-btn-outline"
                            onClick={() => handleInviteMember(member.id)}
                            title="Send Invitation"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                        )}
                        <button 
                          className="app-btn app-btn-sm app-btn-outline app-btn-primary"
                          onClick={() => handleEditMember(member)}
                          title="Edit Member Profile"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <div className="btn-group" role="group">
                          <button 
                            className="app-btn app-btn-sm app-btn-outline app-btn-warning dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            title="Change Role"
                          >
                            <i className="fas fa-user-cog"></i>
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => handleRoleChange(member, member.role === 'admin' ? 'member' : 'admin')}
                              >
                                <i className={`fas ${member.role === 'admin' ? 'fa-user' : 'fa-crown'} me-2`}></i>
                                Make {member.role === 'admin' ? 'Member' : 'Admin'}
                              </button>
                            </li>
                          </ul>
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
                          onClick={() => handleDeleteMember(member)}
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

      {/* Edit Member Modal */}
      <MemberEditModal
        member={editingMember}
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        onSaved={loadMembers}
      />

      {/* Delete Member Modal */}
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