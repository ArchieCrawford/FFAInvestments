import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Phone, Search, UserCheck } from 'lucide-react';

const MemberDirectory = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    const searchLower = searchTerm.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading member directory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Users className="mr-4" />
            Member Directory
          </h1>
          <p className="text-blue-200">Connect with fellow FFA Investment club members</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Active Members</p>
                <p className="text-2xl font-bold text-white">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Registered Users</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.account_status === 'registered').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Total Contacts</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.phone || m.email).length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {member.full_name || 'Member'}
                  </h3>
                  {member.first_name && member.last_name && member.full_name !== `${member.first_name} ${member.last_name}` && (
                    <p className="text-blue-200 text-sm mb-2">
                      {member.first_name} {member.last_name}
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.account_status === 'registered' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-200'
                }`}>
                  {member.account_status === 'registered' ? 'Active User' : 'Member'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-blue-300">
                  <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                  <a 
                    href={`mailto:${member.email}`}
                    className="text-sm hover:text-blue-200 transition-colors break-all"
                  >
                    {member.email}
                  </a>
                </div>

                {member.phone && (
                  <div className="flex items-center text-green-300">
                    <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                    <a 
                      href={`tel:${member.phone}`}
                      className="text-sm hover:text-green-200 transition-colors"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>

              {!member.phone && (
                <div className="mt-4 text-gray-400 text-xs">
                  Contact via email
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Members Found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No active members in the directory yet.'}
            </p>
          </div>
        )}

        {/* Contact Info Footer */}
        <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Need Help Connecting?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
            <div>
              <p className="text-sm">
                <strong>Club Email:</strong> Contact the administrators for member connection assistance.
              </p>
            </div>
            <div>
              <p className="text-sm">
                <strong>Privacy:</strong> Only active club members can view this directory. Contact information is provided voluntarily by members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDirectory;