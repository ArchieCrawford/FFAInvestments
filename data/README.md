# 📊 Data Files Directory

This folder contains all spreadsheets and data files used by the FFA Investments platform.

## 📁 Files Overview

### **📈 Financial Data**
- **`member_dues_20251116_150358.xlsx`** - Member dues and investment data
  - Contains member accounts, current values, and unit holdings
  - Used by Excel import utilities and member management system
  - Source of truth for portfolio calculations

### **📋 Sample Data**
- **`example.xlsx`** - Example spreadsheet format
  - Template for data import operations
  - Reference for proper column structure
  - Used in testing and documentation

### **⏱ Timeline Data**
- **`ffa_timeline.csv`** - Historical transaction timeline
  - Member investment history and transactions
  - Used for timeline visualization and history tracking
  - CSV format for easy data processing

## 🔗 **File Usage & References**

### **Referenced By:**
- `src/utils/excelReader.js` - Excel file processing
- `src/utils/memberDuesExcel.js` - Member dues data handling
- `src/components/CSVImporter.jsx` - CSV import functionality
- `import-data.js` - Data import scripts
- `read-excel.cjs` - Excel reading utilities

### **Purpose:**
- **Member Data Import**: Load real member account information
- **Portfolio Calculations**: Source data for investment values
- **Timeline Generation**: Historical transaction data
- **Testing & Development**: Sample data for development work

## 📋 **Data Structure**

### **Member Dues Excel Format:**
```
Columns:
- Member Name: Full member name
- Email: Member email address
- Current Value: Portfolio current value
- Current Units: Number of units held
- Last Updated: Last update date
```

### **Timeline CSV Format:**
```
Columns:
- Date: Transaction date
- Member: Member name
- Action: Transaction type
- Amount: Transaction amount
- Units: Units affected
- Notes: Additional information
```

## 🔒 **Data Security**

### **Sensitive Information:**
- Member personal data (emails, financial information)
- Portfolio values and account details
- Historical transaction records

### **Access Control:**
- Files should be treated as confidential
- Access limited to authorized personnel
- Regular backups recommended
- Version control for tracking changes

## 📊 **Data Maintenance**

### **Regular Tasks:**
- **Weekly**: Update member dues spreadsheet with latest values
- **Monthly**: Export transaction timeline for backup
- **Quarterly**: Archive old versions and clean up data

### **File Management:**
- Keep file names descriptive with dates
- Maintain consistent column structures
- Document any schema changes
- Test data imports after updates

## 🔄 **Integration Points**

### **Application Integration:**
```javascript
// Excel file path references
const EXCEL_FILE_PATH = './data/member_dues_20251116_150358.xlsx';
const CSV_FILE_PATH = './data/ffa_timeline.csv';
const EXAMPLE_FILE_PATH = './data/example.xlsx';
```

### **Import Utilities:**
- **Excel Reader**: Processes member dues data
- **CSV Importer**: Handles timeline data
- **Data Validators**: Ensures data integrity
- **Schema Mappers**: Transforms data for database

## 📝 **Adding New Data Files**

### **When adding new spreadsheets:**
1. Place file in `/data` folder
2. Update relevant utility scripts with new file paths
3. Update documentation references
4. Test import functionality
5. Add to version control

### **Naming Convention:**
- Use descriptive names with dates
- Include data type in filename
- Use consistent file extensions
- Avoid spaces and special characters

## 🚀 **Usage Examples**

### **Import Member Data:**
```bash
# Using Node.js script
node read-excel.cjs

# Using import utility
node import-data.js
```

### **Process CSV Timeline:**
```javascript
// In application code
import { processTimelineData } from './src/utils/csvProcessor.js';
const timelineData = processTimelineData('./data/ffa_timeline.csv');
```

---

**📁 Data Directory**: `/data`  
**Last Updated**: November 17, 2025  
**File Count**: 3 files  
**Total Size**: ~2MB  
**Purpose**: Central data storage for FFA Investments platform