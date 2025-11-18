# FFA Investments - Complete Operations Runbook
**Date**: November 17, 2025  
**Version**: 2.2.0  
**Environment**: Production  
**Status**: Active - **Latest Update: Enhanced Settings & File Organization**  

## 🎯 System Overview

### Application Architecture
- **Frontend**: React 18.2.0 + Vite (deployed on Vercel)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Latest Domain**: https://ffa-investments-bgcgyc4z7-ajs-projects-e15d145a.vercel.app
- **Backup Domain**: https://ffa-investments-f7daq0qcm-ajs-projects-e15d145a.vercel.app
- **Repository**: GitHub (private)
- **Theme**: Dark gradient with glass morphism effects

### Recent Updates (November 17, 2025)
- **Enhanced Settings**: Improved member home and admin settings with better defaults
- **File Organization**: Organized all data files in `/data` folder with updated references
- **Documentation**: Complete reorganization of docs in `/docs` folder
- **Performance**: Optimized loading and error handling

### Key System Components
1. **Authentication System**: Supabase Auth with role-based access
2. **Member Management**: Complete member profiles with investment data
3. **Admin Dashboard**: User management, unit prices, dues tracking
4. **Member Portal**: Personal dashboard with portfolio view
5. **Real-time Data**: Synchronized updates across admin/member views
6. **Data Management**: Organized `/data` folder with Excel/CSV processing

## 🏃‍♂️ Daily Operations

### System Health Monitoring
```bash
# Check application status
curl -I https://ffa-investments-f7daq0qcm-ajs-projects-e15d145a.vercel.app

# Verify database connection
# Login to Supabase dashboard and check:
# - Database health
# - Active connections
# - Recent queries performance
```

### Performance Metrics to Monitor
- **Page Load Times**: Should be < 3 seconds
- **Database Query Times**: Should be < 1 second
- **Error Rate**: Should be < 1%
- **Uptime**: Target 99.9%

### Daily Checklist
- [ ] Verify application accessibility
- [ ] Check Supabase dashboard for errors
- [ ] Review Vercel deployment logs
- [ ] Monitor user activity (if analytics enabled)
- [ ] Backup verification (automated daily)

## 🛠 Common Administrative Tasks

### 1. User Management

#### Create New Admin User
```sql
-- Step 1: Create user in Supabase Auth dashboard
-- Step 2: Update user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'new-admin@email.com';

-- Step 3: Add to members table
INSERT INTO members (email, member_name, full_name, membership_status)
VALUES ('new-admin@email.com', 'Admin Name', 'Admin Full Name', 'active');
```

#### Add New Member
```sql
-- Option 1: Through Admin UI (Recommended)
-- Login as admin → Users → Add Member → Fill form

-- Option 2: Direct database insert
INSERT INTO members (
    email, member_name, full_name, first_name, last_name, 
    phone, address, membership_status, join_date
) VALUES (
    'member@email.com', 'Last, First', 'First Last', 
    'First', 'Last', '555-0123', '123 Main St', 
    'active', CURRENT_DATE
);
```

#### Reset User Password
```bash
# Method 1: Through Supabase Auth UI
# 1. Login to Supabase dashboard
# 2. Go to Authentication → Users
# 3. Find user and click "Send reset password email"

# Method 2: Programmatically (if needed)
# Use Supabase admin SDK with service key
```

### 2. Member Account Management

#### Link Member to Investment Account
```sql
-- Update member_accounts with correct email
UPDATE member_accounts 
SET email = 'member@email.com'
WHERE member_name = 'Last, First';

-- Run linking function
SELECT link_member_data();

-- Verify the link
SELECT * FROM complete_member_profiles 
WHERE email = 'member@email.com';
```

#### Update Portfolio Values
```sql
-- Update individual member account
UPDATE member_accounts 
SET 
    current_value = 25000.00,
    current_units = 1250.5000,
    last_updated = CURRENT_DATE
WHERE email = 'member@email.com';

-- Bulk update from CSV/Excel data
-- Use Admin UI: Import → Upload File → Map Columns → Import
```

### 3. Unit Price Management

#### Add New Unit Price
```sql
-- Through Admin UI (Recommended)
-- Login → Unit Price Management → Add New Price

-- Direct database insert
INSERT INTO unit_prices (price_per_unit, price_date, notes)
VALUES (20.25, '2025-11-17', 'Monthly price update');
```

#### View Price History
```sql
-- Get complete price history with changes
SELECT 
    price_date,
    price_per_unit,
    LAG(price_per_unit) OVER (ORDER BY price_date) as previous_price,
    ((price_per_unit - LAG(price_per_unit) OVER (ORDER BY price_date)) / 
     LAG(price_per_unit) OVER (ORDER BY price_date)) * 100 as percent_change,
    notes
FROM unit_prices 
ORDER BY price_date DESC;
```

### 4. Data Import Operations

#### Import Member Data from Excel
```bash
# Step 1: Prepare Excel file with columns:
# - Email, Member Name, Current Value, Current Units, Last Updated

# Step 2: Use Admin Import tool
# Login → Admin → Import → Select "Member Accounts"

# Step 3: Verify import
# Check Members page for new/updated data
```

#### Bulk Email Updates
```sql
-- Use the correct_member_emails.sql script
-- Update emails based on member names
\i database/correct_member_emails.sql

-- Verify results
SELECT member_name, email, current_value 
FROM member_accounts 
WHERE email IS NOT NULL
ORDER BY member_name;
```

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: User Cannot Login
**Symptoms**: Login page shows error, user exists in database
**Diagnosis**:
```sql
-- Check if user exists in auth.users
SELECT email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'user@email.com';

-- Check member profile
SELECT * FROM complete_member_profiles 
WHERE email = 'user@email.com';
```
**Solutions**:
1. **Email not confirmed**: Send confirmation email via Supabase Auth
2. **User not in members table**: Add to members table
3. **Wrong password**: Reset password through Supabase Auth

#### Issue: Member Data Not Showing
**Symptoms**: Member login works but no portfolio data visible
**Diagnosis**:
```sql
-- Check data in member_accounts
SELECT * FROM member_accounts WHERE email = 'member@email.com';

-- Check the unified view
SELECT * FROM complete_member_profiles WHERE email = 'member@email.com';
```
**Solutions**:
1. **Missing account link**: Run email mapping script
2. **No portfolio data**: Import account data via Admin UI
3. **View not updating**: Refresh materialized views if any

#### Issue: Admin Functions Not Working
**Symptoms**: Admin cannot access admin pages or functions
**Diagnosis**:
```sql
-- Check user role
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@email.com';

-- Verify admin profile
SELECT user_role, membership_status 
FROM complete_member_profiles 
WHERE email = 'admin@email.com';
```
**Solutions**:
1. **Missing admin role**: Update user metadata
2. **Wrong permission**: Check RLS policies
3. **Profile mismatch**: Update member record

#### Issue: Application Won't Load
**Symptoms**: White screen, loading errors, 500 errors
**Diagnosis**:
```bash
# Check Vercel deployment logs
vercel logs --app=ffa-investments

# Check browser console for JavaScript errors
# F12 → Console tab

# Verify environment variables
vercel env list
```
**Solutions**:
1. **Build failed**: Check build logs, fix compilation errors
2. **Environment variables missing**: Add required variables
3. **Database connection**: Verify Supabase URL and keys

### Performance Issues

#### Slow Page Loads
**Diagnosis**:
- Use browser dev tools to identify slow resources
- Check database query performance in Supabase logs
- Review Vercel analytics for performance metrics

**Solutions**:
```javascript
// Add performance monitoring
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    console.log('Performance metrics:', list.getEntries())
  })
  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input-delay'] })
}, [])
```

#### Database Query Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_member_accounts_email ON member_accounts(email);
CREATE INDEX IF NOT EXISTS idx_unit_prices_date ON unit_prices(price_date);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM complete_member_profiles;
```

## 🔄 Backup and Recovery

### Automated Backups
**Supabase automatically backs up the database daily**
- Retention: 7 days for free tier, 30 days for pro tier
- Point-in-time recovery available
- Access via Supabase dashboard → Database → Backups

### Manual Backup Procedure
```bash
# Create manual backup
pg_dump --host=db.xxx.supabase.co \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --no-password \
        --verbose \
        --file=ffa_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup (if needed)
psql --host=db.xxx.supabase.co \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=ffa_backup_20251117_143000.sql
```

### Code Backup
**GitHub Repository serves as primary code backup**
```bash
# Ensure latest code is committed
git add .
git commit -m "Daily backup - $(date)"
git push origin main

# Create release tag for major versions
git tag -a v2.1.0 -m "Production release 2.1.0"
git push origin v2.1.0
```

## 🔐 Security Operations

### Regular Security Tasks

#### Weekly Security Checklist
- [ ] Review Supabase auth logs for suspicious activity
- [ ] Check for failed login attempts
- [ ] Verify RLS policies are functioning
- [ ] Review user permissions and roles
- [ ] Update dependencies if security patches available

#### Monthly Security Tasks
- [ ] Rotate API keys if necessary
- [ ] Review and update environment variables
- [ ] Audit user access and remove inactive accounts
- [ ] Check for SQL injection vulnerabilities
- [ ] Review and update security policies

### Security Incident Response

#### Suspected Unauthorized Access
1. **Immediate Actions**:
   - Change admin passwords
   - Rotate Supabase service keys
   - Enable additional logging

2. **Investigation**:
   ```sql
   -- Check recent login activity
   SELECT * FROM auth.audit_log_entries 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   
   -- Review suspicious user activity
   SELECT email, last_sign_in_at, sign_in_count 
   FROM auth.users 
   ORDER BY last_sign_in_at DESC;
   ```

3. **Recovery**:
   - Force password reset for affected users
   - Review and restore any modified data
   - Implement additional security measures

## 📊 Monitoring and Analytics

### Key Metrics to Track

#### Application Metrics
- **User Engagement**: Login frequency, session duration
- **Feature Usage**: Most accessed admin functions
- **Performance**: Page load times, error rates
- **Security**: Failed login attempts, suspicious activity

#### Business Metrics
- **Member Growth**: New member registrations over time
- **Portfolio Performance**: Total AUM changes
- **Unit Price Trends**: Price changes and volatility
- **User Adoption**: Feature utilization rates

### Monitoring Setup
```javascript
// Basic analytics tracking (add to main components)
useEffect(() => {
  // Track page views
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_TRACKING_ID', {
      page_title: document.title,
      page_location: window.location.href
    })
  }
}, [])

// Error tracking
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error)
  // Send to monitoring service (Sentry, LogRocket, etc.)
})
```

## 🔧 System Maintenance

### Scheduled Maintenance Tasks

#### Weekly (Every Sunday)
```bash
# 1. Review system health
# - Check Vercel deployment status
# - Review Supabase performance metrics
# - Monitor error logs

# 2. Database maintenance
# - Check table sizes and growth
# - Review slow queries
# - Update statistics if needed

# 3. User management
# - Review new user registrations
# - Process pending member approvals
# - Clean up inactive test accounts
```

#### Monthly
```bash
# 1. Dependency updates
npm audit
npm update

# 2. Security updates
npm audit fix

# 3. Performance review
# - Analyze page load times
# - Review database query performance
# - Optimize slow operations

# 4. Backup verification
# - Test backup restoration process
# - Verify backup integrity
# - Update disaster recovery procedures
```

#### Quarterly
```bash
# 1. Full system audit
# - Review all user permissions
# - Audit database schema changes
# - Update documentation

# 2. Capacity planning
# - Review storage usage
# - Plan for growth
# - Update resource allocations

# 3. Feature evaluation
# - Review user feedback
# - Plan new features
# - Deprecate unused functionality
```

### Maintenance Windows
**Recommended Schedule**: Sunday 2:00 AM - 4:00 AM EST
- Low user activity period
- 2-hour window for most maintenance tasks
- Coordinate with Supabase maintenance windows

### Emergency Maintenance
```bash
# Quick fixes that can be done without downtime
git commit -m "Hotfix: [description]"
git push origin main
vercel --prod  # Automatic deployment

# For database fixes requiring downtime
# 1. Notify users via app banner
# 2. Enable maintenance mode
# 3. Perform fixes
# 4. Test functionality
# 5. Remove maintenance mode
```

## 📞 Emergency Contacts and Escalation

### Key Personnel
- **System Administrator**: [Your contact info]
- **Database Administrator**: [DBA contact if different]
- **Business Owner**: [Business contact]

### Service Providers
- **Vercel Support**: vercel.com/support (Pro plan required)
- **Supabase Support**: supabase.com/support
- **Domain/DNS**: [Your DNS provider]

### Escalation Procedure
1. **Level 1**: Application errors, minor performance issues
   - Handle via standard troubleshooting
   - Document in operations log

2. **Level 2**: Service disruption, authentication failures
   - Contact service providers if needed
   - Implement workarounds
   - Notify key stakeholders

3. **Level 3**: Data corruption, security breaches, extended outages
   - Immediate notification to all stakeholders
   - Engage all available resources
   - Document incident for post-mortem

## 📝 Change Management

### Deployment Process
```bash
# 1. Development and testing
git checkout -b feature/new-feature
# Make changes, test locally
git add .
git commit -m "Add new feature"

# 2. Code review and merge
git checkout main
git merge feature/new-feature

# 3. Deploy to production
git push origin main
vercel --prod

# 4. Post-deployment verification
# - Test critical functionality
# - Monitor for errors
# - Verify database changes
```

### Emergency Rollback
```bash
# Quick rollback to previous deployment
vercel list  # Get previous deployment URL
vercel alias [previous-deployment-url] production-domain

# Or rollback via Git
git revert [commit-hash]
git push origin main
vercel --prod
```

## 📚 Documentation Updates

### Keeping Documentation Current
- Update this runbook monthly or after major changes
- Maintain change log for all modifications
- Document new procedures as they're developed
- Review and update emergency procedures quarterly

### Version Control
- Store all documentation in Git repository
- Tag documentation versions with application releases
- Maintain separate docs for different environments if needed

---

## 🎉 Success Criteria

This runbook is successful when:
- System uptime exceeds 99.9%
- Security incidents are resolved within 1 hour
- Performance issues are identified and resolved proactively
- All team members can effectively use these procedures
- Documentation stays current and useful

**Last Updated**: November 17, 2025  
**Next Review**: December 17, 2025  
**Owner**: System Administrator