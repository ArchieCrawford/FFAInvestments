// Updated sendInvite function with EmailJS integration
sendInvite: async (memberId, email) => {
  const members = JSON.parse(localStorage.getItem('members') || '[]');
  const memberIndex = members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    throw new Error('Member not found');
  }
  
  const inviteToken = 'inv_' + Math.random().toString(36).substr(2, 9);
  const inviteLink = `${window.location.origin}/invite/${inviteToken}`;
  
  // Update member record
  members[memberIndex] = { 
    ...members[memberIndex], 
    email: email,
    status: 'invited',
    inviteToken: inviteToken,
    invitedAt: new Date().toISOString()
  };
  localStorage.setItem('members', JSON.stringify(members));
  
  // Send email via EmailJS (add this when ready for production)
  try {
    // Uncomment and configure when you set up EmailJS
    /*
    await emailjs.send(
      'your_service_id',
      'your_template_id',
      {
        to_email: email,
        to_name: members[memberIndex].name,
        invite_link: inviteLink,
        club_name: 'FFA Investment Club'
      },
      'your_public_key'
    );
    */
    
    // Return success with link (remove this part when email is working)
    return {
      success: true,
      inviteLink: inviteLink,
      member: members[memberIndex],
      emailSent: false // Change to true when email is configured
    };
  } catch (error) {
    console.error('Email failed:', error);
    // Still return success with manual link as fallback
    return {
      success: true,
      inviteLink: inviteLink,
      member: members[memberIndex],
      emailSent: false,
      emailError: error.message
    };
  }
}