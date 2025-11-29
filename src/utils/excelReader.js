import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_FILE_PATH = 'C:\\Users\\AceGr\\FFAinvestments\\data\\member_dues_20251116_150358.xlsx';

export async function readMemberDuesExcel() {
  try {
    console.log('📊 Reading member dues from Excel file...');
    
    // Check if file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
    }

    // Read the Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    
    console.log('📋 Available worksheets:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    // Get the first worksheet (or you can specify which one to use)
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\n📊 Found ${jsonData.length} rows in worksheet "${worksheetName}"`);
    
    // Show first few rows to understand structure
    console.log('\n📋 First 5 rows:');
    jsonData.slice(0, 5).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });

    // Try to parse member data (assuming first row is headers)
    if (jsonData.length > 1) {
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      
      console.log('\n📋 Column headers:');
      headers.forEach((header, index) => {
        console.log(`  ${index}: ${header}`);
      });

      // Convert to objects
      const memberData = dataRows.map(row => {
        const member = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            member[header] = row[index];
          }
        });
        return member;
      });

      // Filter out empty rows
      const validMembers = memberData.filter(member => 
        Object.values(member).some(value => value !== undefined && value !== '')
      );

      console.log(`\n✅ Processed ${validMembers.length} valid member records`);
      
      // Show sample member data
      if (validMembers.length > 0) {
        console.log('\n📝 Sample member data:');
        console.log(JSON.stringify(validMembers[0], null, 2));
      }

      return {
        success: true,
        members: validMembers,
        totalRows: jsonData.length - 1,
        validMembers: validMembers.length,
        headers: headers,
        worksheetName: worksheetName
      };
    }

    return {
      success: false,
      error: 'No data found in Excel file'
    };

  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// If this file is run directly, execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  readMemberDuesExcel().then(result => {
    if (result.success) {
      console.log('\n🎉 Excel file read successfully!');
      console.log(`   - Total members: ${result.validMembers}`);
      console.log(`   - Worksheet: ${result.worksheetName}`);
    } else {
      console.log('\n❌ Failed to read Excel file:', result.error);
    }
  });
}