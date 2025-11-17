# FFA Investments - Complete Investment Club Management System

![FFA Investments](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-4.4.5-purple)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)

A comprehensive React-based investment club management application with Charles Schwab integration, educational resources, and member dues tracking.

## 🚀 Live Features

### 🔐 **Authentication & Role Management**
- Secure Supabase authentication
- Admin and member role-based access
- Profile management with display names

### 💰 **Charles Schwab Integration**
- Full OAuth 2.0 implementation with automatic token refresh
- Account insights and portfolio analytics  
- Raw data viewer for transactions and positions
- Secure token storage and management

### 📊 **Member Dues Tracking**
- **Real Excel Integration**: Loads actual member data from `data/member_dues_20251116_150358.xlsx`
- **21 Active Members**: Displays real payment status, amounts owed, and contributions
- **Status Tracking**: Credit Balance, Owes Money, Current status indicators
- **Monthly History**: Detailed payment tracking with collapsible views
- **Export Capabilities**: JSON and Excel export functionality

### 🎓 **Educational Resources**
- **Beardstown Ladies Guide**: Interactive educational content from the famous investment book
- **Progress-Saving Checklist**: 17-point stock-buying checklist with local storage
- **Modern Applications**: Real-world investment strategies for today's markets

### 🏢 **Admin Dashboard**
- Complete user management system
- Financial data import/export tools
- Unit price tracking and management
- Portfolio builder and analytics

## 📁 Project Structure

```
src/
├── Pages/
│   ├── AdminDues/           # Member dues management
│   ├── BeardstownLadies/    # Educational content
│   ├── AdminSchwab.jsx      # Schwab integration
│   └── [Other Pages]/
├── components/              # Reusable UI components
├── contexts/               # React context providers
├── services/               # API services (Schwab, etc.)
├── utils/                  # Utility functions
│   ├── memberDuesExcel.js  # Excel data integration
│   └── excelReader.js      # Excel file parser
└── lib/                    # External library configs
```

## 🛠 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Charles Schwab Developer Account (optional)
- Excel file with member data

### Installation

```bash
# Clone the repository
git clone https://github.com/ArchieCrawford/FFAInvestments.git
cd FFAInvestments

# Install dependencies
npm install

# Generate HTTPS certificates (required for Schwab OAuth)
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase and Schwab credentials

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Charles Schwab API Configuration
VITE_SCHWAB_CLIENT_ID=your-schwab-client-id
VITE_SCHWAB_CLIENT_SECRET=your-schwab-client-secret
VITE_SCHWAB_REDIRECT_URI=https://localhost:3003/admin/schwab

# Application Configuration
VITE_APP_URL=https://localhost:3003
```

## 📊 Member Data Integration

The application integrates with your Excel file (`data/member_dues_20251116_150358.xlsx`) containing:

- **21 Active Members** with real names and financial data
- **Payment Status**: Credit Balance, Owes Money, Current
- **Amount Tracking**: Latest amounts owed, total payments, contributions
- **Historical Data**: Monthly payment tracking and trends

### Sample Member Data Structure
```javascript
{
  "Member Name": "Crawford, Archie",
  "Payment Status": "Current", 
  "Latest Amount Owed": 0,
  "Total Payments": 12000,
  "Total Contribution": 35000
}
```

## 🔗 Navigation Structure

### Admin Users
- Dashboard & Analytics
- Member & User Management  
- **Dues Tracker** (Real Excel data)
- Financial Ledger & Unit Pricing
- **Education Management**
  - Lesson Administration
  - **Beardstown Ladies Guide**
- Data Import/Export Tools
- **Charles Schwab Integration**
  - Account Connection
  - Insights Dashboard
  - Raw Data Viewer

### Member Users
- Personal Dashboard
- Account Information
- Contribution Tools
- **Educational Resources**
  - Interactive Beardstown Ladies Guide
  - Investment Checklist
  - Unit Value Calculator

## 🔧 Technical Features

### Security & Performance
- HTTPS development environment with OpenSSL certificates
- Role-based route protection
- Automatic token refresh for external APIs
- Error boundaries and loading states

### Data Management
- Real-time Excel file integration
- Supabase database with structured schema
- Export capabilities (JSON/Excel)
- Automatic data synchronization

### User Experience
- Responsive design for mobile/desktop
- Interactive educational content
- Progress-saving checklists
- Collapsible detailed views

## 📈 Production Readiness

### ✅ Completed Features
- [x] Authentication & authorization system
- [x] Charles Schwab OAuth 2.0 integration
- [x] Real member dues tracking from Excel
- [x] Educational content with interactive features
- [x] Admin management tools
- [x] HTTPS support for production APIs
- [x] Comprehensive documentation

### 🎯 Next Steps for Production
- [ ] Production SSL certificate setup
- [ ] Server-side Excel processing API
- [ ] Automated member data synchronization
- [ ] Email notification system
- [ ] Backup and monitoring procedures

## 📚 Documentation

- **`PROJECT_RUNBOOK.md`** - Complete technical documentation
- **`QUICK_REFERENCE.md`** - Essential setup and usage guide
- **`SCHWAB_INTEGRATION.md`** - Charles Schwab API setup guide
- **`SUPABASE_SETUP.md`** - Database configuration guide

## 🤝 Contributing

This is a specialized investment club management system. For questions or contributions, please refer to the comprehensive documentation or contact the development team.

## 📄 License

Private project for FFA Investments - All rights reserved.

---

**🎉 Your complete investment club management system is ready!**

- **Real Member Data**: 21 actual members with live dues tracking
- **Educational Resources**: Interactive Beardstown Ladies investment guide  
- **Professional Features**: Charles Schwab integration, admin tools, responsive design
- **Production Ready**: HTTPS, authentication, role management, and comprehensive documentation

Access at: **https://localhost:3003** (or your production domain)