# 💰 FFA Investments Platform# FFA Investments - Complete Investment Club Management System



A modern investment club management platform with beautiful dark theme UI, real-time data synchronization, and comprehensive member portfolio tracking.![FFA Investments](https://img.shields.io/badge/Status-Production%20Ready-green)

![React](https://img.shields.io/badge/React-18.2.0-blue)

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)![Vite](https://img.shields.io/badge/Vite-4.4.5-purple)

![Status](https://img.shields.io/badge/status-production-green.svg)![Supabase](https://img.shields.io/badge/Database-Supabase-green)

![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

![Supabase](https://img.shields.io/badge/supabase-enabled-green.svg)A comprehensive React-based investment club management application with Charles Schwab integration, educational resources, and member dues tracking.



## 🚀 Live Application## 🚀 Live Features



**Production URL**: [https://ffa-investments-f7daq0qcm-ajs-projects-e15d145a.vercel.app](https://ffa-investments-f7daq0qcm-ajs-projects-e15d145a.vercel.app)### 🔐 **Authentication & Role Management**

- Secure Supabase authentication

## ✨ Features- Admin and member role-based access

- Profile management with display names

### 🎨 **Beautiful UI/UX**

- Modern dark gradient theme with glass morphism effects### 💰 **Charles Schwab Integration**

- Mobile-responsive design across all devices- Full OAuth 2.0 implementation with automatic token refresh

- Professional styling with smooth animations- Account insights and portfolio analytics  

- Hipster-inspired login with bright accent colors- Raw data viewer for transactions and positions

- Secure token storage and management

### 👥 **Member Management**

- Complete member profiles with investment portfolio data### 📊 **Member Dues Tracking**

- Real-time synchronization between admin and member views- **Real Excel Integration**: Loads actual member data from `member_dues_20251116_150358.xlsx`

- Email invitation system for new members- **21 Active Members**: Displays real payment status, amounts owed, and contributions

- Role-based access control (admin/member)- **Status Tracking**: Credit Balance, Owes Money, Current status indicators

- **Monthly History**: Detailed payment tracking with collapsible views

### 📊 **Investment Tracking**- **Export Capabilities**: JSON and Excel export functionality

- Individual portfolio dashboards with current values

- Unit price management with historical tracking### 🎓 **Educational Resources**

- Performance calculations and trend analysis- **Beardstown Ladies Guide**: Interactive educational content from the famous investment book

- Charles Schwab API integration ready- **Progress-Saving Checklist**: 17-point stock-buying checklist with local storage

- **Modern Applications**: Real-world investment strategies for today's markets

### 🛠 **Admin Dashboard**

- User management with role assignments### 🏢 **Admin Dashboard**

- Member account oversight and management- Complete user management system

- Unit price updates with change calculations- Financial data import/export tools

- Dues tracking and payment management- Unit price tracking and management

- Data import tools for Excel/CSV files- Portfolio builder and analytics



### 🔐 **Security & Authentication**## 📁 Project Structure

- Supabase authentication with JWT tokens

- Row Level Security (RLS) policies```

- Protected routes and secure API callssrc/

- Environment variable protection├── Pages/

│   ├── AdminDues/           # Member dues management

## 🏗 **Technology Stack**│   ├── BeardstownLadies/    # Educational content

│   ├── AdminSchwab.jsx      # Schwab integration

### **Frontend**│   └── [Other Pages]/

- **React 18.2.0** - Modern React with hooks and context├── components/              # Reusable UI components

- **Vite** - Fast build tool with ES2022 support├── contexts/               # React context providers

- **React Router** - Client-side routing├── services/               # API services (Schwab, etc.)

- **Tailwind CSS** - Utility-first styling framework├── utils/                  # Utility functions

- **Lucide React** - Beautiful icon library│   ├── memberDuesExcel.js  # Excel data integration

│   └── excelReader.js      # Excel file parser

### **Backend**└── lib/                    # External library configs

- **Supabase** - PostgreSQL database with real-time subscriptions```

- **Supabase Auth** - Authentication and user management

- **Row Level Security** - Database-level security policies## 🛠 Quick Start



### **Deployment**### Prerequisites

- **Vercel** - Production hosting with automatic deployments- Node.js 18+

- **GitHub** - Source code management and CI/CD- Supabase account

- **Environment Variables** - Secure configuration management- Charles Schwab Developer Account (optional)

- Excel file with member data

## 🚀 **Quick Start**

### Installation

### **Prerequisites**

- Node.js 18+ installed```bash

- Supabase account# Clone the repository

- Vercel account (for deployment)git clone https://github.com/ArchieCrawford/FFAInvestments.git

cd FFAInvestments

### **Local Development**

```bash# Install dependencies

# Clone the repositorynpm install

git clone https://github.com/ArchieCrawford/FFAInvestments.git

cd FFAinvestments# Generate HTTPS certificates (required for Schwab OAuth)

openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Install dependencies

npm install# Setup environment variables

cp .env.example .env

# Set up environment variables# Edit .env with your Supabase and Schwab credentials

cp .env.example .env

# Edit .env with your Supabase credentials# Start development server

npm run dev

# Start development server```

npm run dev

```### Environment Variables



### **Environment Variables**```env

```bash# Supabase Configuration

VITE_SUPABASE_URL=your_supabase_project_urlVITE_SUPABASE_URL=your-supabase-url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_keyVITE_SUPABASE_ANON_KEY=your-supabase-anon-key

VITE_SCHWAB_CLIENT_ID=your_schwab_client_idSUPABASE_SERVICE_ROLE_KEY=your-service-role-key

VITE_SCHWAB_REDIRECT_URI=your_redirect_uri

```# Charles Schwab API Configuration

VITE_SCHWAB_CLIENT_ID=your-schwab-client-id

## 📚 **Documentation**VITE_SCHWAB_CLIENT_SECRET=your-schwab-client-secret

VITE_SCHWAB_REDIRECT_URI=https://localhost:3003/admin/schwab

All comprehensive documentation is located in the **`/docs`** folder:

# Application Configuration

### **🔑 Key Documents**VITE_APP_URL=https://localhost:3003

- **[📋 Complete Setup Guide](./docs/PROJECT_RECREATION_GUIDE_2025-11-17.md)** - Step-by-step system recreation```

- **[⚙️ Operations Manual](./docs/OPERATIONS_RUNBOOK_2025-11-17.md)** - Daily operations and maintenance

- **[📖 Development History](./docs/change-log.md)** - Complete feature evolution timeline## 📊 Member Data Integration

- **[🗂 Documentation Index](./docs/README-DOCS.md)** - Full documentation overview

The application integrates with your Excel file (`member_dues_20251116_150358.xlsx`) containing:

### **📁 Documentation Categories**

- **Getting Started**: Setup instructions and project overview- **21 Active Members** with real names and financial data

- **Development**: Technical implementation and history- **Payment Status**: Credit Balance, Owes Money, Current

- **Deployment**: Production deployment guides- **Amount Tracking**: Latest amounts owed, total payments, contributions

- **Operations**: Daily maintenance and troubleshooting- **Historical Data**: Monthly payment tracking and trends

- **User Management**: Member and admin procedures

### Sample Member Data Structure

## 🎯 **Key Capabilities**```javascript

{

### **For Investment Club Admins**  "Member Name": "Crawford, Archie",

- ✅ Manage member accounts and portfolios  "Payment Status": "Current", 

- ✅ Track unit prices and historical performance  "Latest Amount Owed": 0,

- ✅ Handle member invitations and role assignments  "Total Payments": 12000,

- ✅ Import data from Excel files and external sources  "Total Contribution": 35000

- ✅ Monitor club performance with comprehensive dashboards}

```

### **For Club Members**

- ✅ View personal investment portfolio in real-time## 🔗 Navigation Structure

- ✅ Track performance and unit value changes

- ✅ Access educational content and resources### Admin Users

- ✅ Update personal information and preferences- Dashboard & Analytics

- ✅ View contribution history and account details- Member & User Management  

- **Dues Tracker** (Real Excel data)

### **For Developers**- Financial Ledger & Unit Pricing

- ✅ Complete codebase with modern React patterns- **Education Management**

- ✅ Comprehensive documentation for setup and maintenance  - Lesson Administration

- ✅ Modular component architecture for easy extension  - **Beardstown Ladies Guide**

- ✅ Secure authentication and database integration- Data Import/Export Tools

- ✅ Production-ready deployment pipeline- **Charles Schwab Integration**

  - Account Connection

## 🔧 **Development Commands**  - Insights Dashboard

  - Raw Data Viewer

```bash

# Development### Member Users

npm run dev          # Start development server- Personal Dashboard

npm run build        # Build for production- Account Information

npm run preview      # Preview production build- Contribution Tools

- **Educational Resources**

# Deployment  - Interactive Beardstown Ladies Guide

npm run deploy       # Build and deploy to Vercel  - Investment Checklist

vercel --prod        # Deploy to production  - Unit Value Calculator



# Database## 🔧 Technical Features

npm run db:setup     # Set up database schema

npm run db:seed      # Seed with sample data### Security & Performance

```- HTTPS development environment with OpenSSL certificates

- Role-based route protection

## 🏛 **Database Schema**- Automatic token refresh for external APIs

- Error boundaries and loading states

### **Core Tables**

- **`members`** - Member profiles and contact information### Data Management

- **`member_accounts`** - Investment account data and portfolio values- Real-time Excel file integration

- **`unit_prices`** - Historical unit price tracking- Supabase database with structured schema

- **`ffa_timeline`** - Transaction history and timeline- Export capabilities (JSON/Excel)

- **`education_lessons`** - Educational content management- Automatic data synchronization

- **`education_progress`** - Member learning progress tracking

### User Experience

### **Key Views**- Responsive design for mobile/desktop

- **`complete_member_profiles`** - Unified member data with calculations- Interactive educational content

- **Portfolio calculations** with real-time value updates- Progress-saving checklists

- **Performance metrics** with historical comparisons- Collapsible detailed views



## 🔐 **Security Features**## 📈 Production Readiness



- **Row Level Security (RLS)** - Database-level access control### ✅ Completed Features

- **JWT Authentication** - Secure token-based auth- [x] Authentication & authorization system

- **Role-based Permissions** - Admin vs member access levels- [x] Charles Schwab OAuth 2.0 integration

- **Environment Protection** - Secure configuration management- [x] Real member dues tracking from Excel

- **Input Validation** - Frontend and backend validation- [x] Educational content with interactive features

- **SQL Injection Prevention** - Parameterized queries- [x] Admin management tools

- [x] HTTPS support for production APIs

## 📈 **Performance**- [x] Comprehensive documentation



- **Page Load Times**: < 3 seconds### 🎯 Next Steps for Production

- **Database Queries**: < 1 second average- [ ] Production SSL certificate setup

- **Bundle Size**: Optimized with code splitting- [ ] Server-side Excel processing API

- **Uptime Target**: 99.9%- [ ] Automated member data synchronization

- **Mobile Performance**: Fully responsive design- [ ] Email notification system

- [ ] Backup and monitoring procedures

## 🤝 **Contributing**

## 📚 Documentation

This is a private investment club management platform. For feature requests or issues:

- **`PROJECT_RUNBOOK.md`** - Complete technical documentation

1. Review existing documentation in `/docs`- **`QUICK_REFERENCE.md`** - Essential setup and usage guide

2. Check the operations runbook for procedures- **`SCHWAB_INTEGRATION.md`** - Charles Schwab API setup guide

3. Follow established development patterns- **`SUPABASE_SETUP.md`** - Database configuration guide

4. Test thoroughly before deploying

## 🤝 Contributing

## 📄 **License**

This is a specialized investment club management system. For questions or contributions, please refer to the comprehensive documentation or contact the development team.

Private investment club management platform. All rights reserved.

## 📄 License

## 📞 **Support**

Private project for FFA Investments - All rights reserved.

- **📚 Documentation**: Check the comprehensive `/docs` folder

- **🔧 Operations**: Reference the operations runbook---

- **🚨 Emergency**: Follow escalation procedures in ops manual

**🎉 Your complete investment club management system is ready!**

---

- **Real Member Data**: 21 actual members with live dues tracking

**Built with ❤️ for investment club management**  - **Educational Resources**: Interactive Beardstown Ladies investment guide  

**Last Updated**: November 17, 2025  - **Professional Features**: Charles Schwab integration, admin tools, responsive design

**Version**: 2.1.0  - **Production Ready**: HTTPS, authentication, role management, and comprehensive documentation

**Status**: Production Ready 🚀
Access at: **https://localhost:3003** (or your production domain)