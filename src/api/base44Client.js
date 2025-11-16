// Base44 API Client - placeholder implementation
export const base44 = {
  auth: {
    me: async () => {
      // Check if user is logged in
      const user = localStorage.getItem('user');
      if (!user) {
        throw new Error('Not authenticated');
      }
      return JSON.parse(user);
    },
    logout: async () => {
      localStorage.removeItem('user');
      window.location.href = '/login';
    },
    login: async (email, password) => {
      // Check if user exists in members
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      const member = members.find(m => m.email === email && m.status === 'active');
      
      if (member && member.password === password) {
        const user = {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role || 'member'
        };
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      
      // Special admin accounts
      const adminAccounts = [
        { email: 'admin@ffa.com', password: 'admin123', name: 'Admin User' },
        { email: 'archie.crawford1@gmail.com', password: 'archie123', name: 'Archie Crawford' }
      ];
      
      const admin = adminAccounts.find(a => a.email === email && a.password === password);
      if (admin) {
        const user = {
          id: 999,
          name: admin.name,
          email: admin.email,
          role: "admin"
        };
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      
      throw new Error('Invalid email or password');
    }
  },
  entities: {
    User: {
      list: async () => {
        let members = JSON.parse(localStorage.getItem('members') || '[]');
        
        // If no members exist, load default FFA member data
        if (members.length === 0) {
          members = await base44.entities.User.loadDefaultMembers();
        }
        
        return members;
      },
      loadDefaultMembers: async () => {
        const defaultMembers = [
          {
            id: 1,
            name: "Burrell, Felecia",
            email: "felecia.burrell@ffa.com",
            password: null, // Will be set when user accepts invitation
            role: "member",
            status: "invited",
            units: 1852.53,
            totalContribution: 93189.17,
            joinDate: "2024-01-15"
          },
          {
            id: 2,
            name: "Jean, Joel Sr.",
            email: "joel.jean.sr@ffa.com",
            role: "member",
            status: "active",
            units: 2231.93,
            totalContribution: 112268.84,
            joinDate: "2024-01-15"
          },
          {
            id: 3,
            name: "J. Archie",
            email: "j.archie@ffa.com",
            role: "member", 
            status: "active",
            units: 11.08,
            totalContribution: 557.21,
            joinDate: "2024-01-15"
          },
          {
            id: 4,
            name: "Kirby, Phillip J. Jr.",
            email: "phillip.kirby@ffa.com",
            role: "member",
            status: "active",
            units: 1648.90,
            totalContribution: 82945.00,
            joinDate: "2024-01-15"
          },
          {
            id: 5,
            name: "Mauney, Larry",
            email: "larry.mauney@ffa.com",
            role: "member",
            status: "active",
            units: 2169.95,
            totalContribution: 109153.00,
            joinDate: "2024-01-15"
          },
          {
            id: 6,
            name: "Sharpe, Tim",
            email: "tim.sharpe@ffa.com",
            role: "member",
            status: "active",
            units: 1668.41,
            totalContribution: 83942.00,
            joinDate: "2024-01-15"
          },
          {
            id: 7,
            name: "Cheatham, Davy",
            email: "davy.cheatham@ffa.com", 
            role: "member",
            status: "active",
            units: 1615.83,
            totalContribution: 81304.00,
            joinDate: "2024-01-15"
          },
          {
            id: 8,
            name: "Jean, Joel L.",
            email: "joel.jean@ffa.com",
            role: "member",
            status: "active", 
            units: 1132.67,
            totalContribution: 56985.00,
            joinDate: "2024-01-15"
          },
          {
            id: 9,
            name: "Walker, Jessee J.",
            email: "jessee.walker@ffa.com",
            role: "member",
            status: "active",
            units: 1893.57,
            totalContribution: 95237.00,
            joinDate: "2024-01-15"
          },
          {
            id: 10,
            name: "Taylor, Clifton",
            email: "clifton.taylor@ffa.com",
            role: "member",
            status: "active",
            units: 562.93,
            totalContribution: 28315.00,
            joinDate: "2024-01-15"
          },
          {
            id: 11,
            name: "McCall, Anthony",
            email: "anthony.mccall@ffa.com",
            role: "member",
            status: "active",
            units: 943.93,
            totalContribution: 47511.00,
            joinDate: "2024-01-15"
          },
          {
            id: 12,
            name: "McCall, Shedrick D.",
            email: "shedrick.mccall@ffa.com",
            role: "member", 
            status: "active",
            units: 513.84,
            totalContribution: 25852.00,
            joinDate: "2024-01-15"
          },
          {
            id: 13,
            name: "Robinson, Luther Jr.",
            email: "luther.robinson@ffa.com",
            role: "member",
            status: "active",
            units: 331.17,
            totalContribution: 16669.00,
            joinDate: "2024-01-15"
          },
          {
            id: 14,
            name: "Gwaltney, Rheba G.",
            email: "rheba.gwaltney@ffa.com",
            role: "member",
            status: "active",
            units: 488.71,
            totalContribution: 24581.00,
            joinDate: "2024-01-15"
          },
          {
            id: 15,
            name: "Adih, Kofi S.",
            email: "kofi.adih@ffa.com",
            role: "member",
            status: "active",
            units: 283.34,
            totalContribution: 14251.00,
            joinDate: "2024-01-15"
          },
          {
            id: 16,
            name: "Greene, Kristen",
            email: "kristen.greene@ffa.com",
            role: "member",
            status: "active",
            units: 317.00,
            totalContribution: 15947.00,
            joinDate: "2024-01-15"
          },
          {
            id: 17,
            name: "Nichols, Milton", 
            email: "milton.nichols@ffa.com",
            role: "member",
            status: "active",
            units: 182.80,
            totalContribution: 9197.00,
            joinDate: "2024-01-15"
          },
          {
            id: 18,
            name: "Hylton, Lequan",
            email: "lequan.hylton@ffa.com",
            role: "member",
            status: "active",
            units: 149.34,
            totalContribution: 7517.00,
            joinDate: "2024-01-15"
          },
          {
            id: 19,
            name: "Jackson, Dante",
            email: "dante.jackson@ffa.com",
            role: "member", 
            status: "active",
            units: 159.98,
            totalContribution: 8051.00,
            joinDate: "2024-01-15"
          },
          {
            id: 20,
            name: "Rodgers, James",
            email: "james.rodgers@ffa.com",
            role: "member",
            status: "active",
            units: 77.70,
            totalContribution: 3910.00,
            joinDate: "2024-01-15"
          }
        ];
        
        localStorage.setItem('members', JSON.stringify(defaultMembers));
        return defaultMembers;
      },
      create: async (userData) => {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        const newMember = {
          id: Date.now(),
          ...userData,
          createdAt: new Date().toISOString()
        };
        members.push(newMember);
        localStorage.setItem('members', JSON.stringify(members));
        return newMember;
      },
      update: async (id, userData) => {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
          members[index] = { ...members[index], ...userData, updatedAt: new Date().toISOString() };
          localStorage.setItem('members', JSON.stringify(members));
          return members[index];
        }
        throw new Error('Member not found');
      },
      sendInvite: async (memberId, email) => {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        const memberIndex = members.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
          throw new Error('Member not found');
        }
        
        const inviteToken = 'inv_' + Math.random().toString(36).substr(2, 9);
        members[memberIndex] = { 
          ...members[memberIndex], 
          email: email,
          status: 'invited',
          inviteToken: inviteToken,
          invitedAt: new Date().toISOString()
        };
        localStorage.setItem('members', JSON.stringify(members));
        
        // Return the invite link
        return {
          inviteLink: `${window.location.origin}/invite/${inviteToken}`,
          member: members[memberIndex]
        };
      },
      delete: async (id) => {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        const memberIndex = members.findIndex(m => m.id === id);
        if (memberIndex === -1) {
          throw new Error('Member not found');
        }
        
        const deletedMember = members[memberIndex];
        members.splice(memberIndex, 1);
        localStorage.setItem('members', JSON.stringify(members));
        
        // Also remove their timeline data
        const timeline = JSON.parse(localStorage.getItem('memberTimeline') || '[]');
        const filteredTimeline = timeline.filter(entry => entry.memberId !== id);
        localStorage.setItem('memberTimeline', JSON.stringify(filteredTimeline));
        
        return deletedMember;
      },
      bulkImport: async (memberData) => {
        localStorage.setItem('members', JSON.stringify(memberData));
        return memberData;
      }
    },
    Account: {
      list: async () => {
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        return accounts;
      },
      getByMember: async (memberId) => {
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        return accounts.filter(account => account.memberId === memberId);
      },
      getTimeline: async (memberId) => {
        const timeline = JSON.parse(localStorage.getItem('memberTimeline') || '[]');
        return timeline.filter(entry => entry.memberId === memberId);
      }
    },
    Timeline: {
      bulkImport: async (timelineData) => {
        localStorage.setItem('memberTimeline', JSON.stringify(timelineData));
        return timelineData;
      },
      getAll: async () => {
        return JSON.parse(localStorage.getItem('memberTimeline') || '[]');
      }
    }
  }
};