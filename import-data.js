import Papa from 'papaparse'
import { supabase } from './src/lib/supabase.js'
import { readFileSync } from 'fs'

// ⚠️ DEPRECATED: This script writes to the legacy ffa_timeline table.
// For new imports, write directly to member_monthly_balances with canonical fields:
// member_id, report_date, portfolio_value, total_units, total_contribution, growth_amount, growth_pct

// Script to import FFA timeline CSV data into Supabase
async function importTimelineData() {
  try {
    console.log('Starting FFA timeline data import...')
    
    // Read the CSV file
    const csvContent = readFileSync('./data/ffa_timeline.csv', 'utf-8')
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Clean up the data
        if (value === '' || value === null || value === undefined) return null
        if (field === 'Member_Name') return value.replace(/"/g, '') // Remove quotes
        if (['Portfolio_Value', 'Total_Units', 'Total_Contribution', 'Ownership_Pct', 'Portfolio_Growth', 'Portfolio_Growth_Amount'].includes(field)) {
          const num = parseFloat(value)
          return isNaN(num) ? null : num
        }
        return value
      }
    })
    
    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors)
      return
    }
    
    console.log(`Parsed ${parseResult.data.length} records`)
    
    // Transform data to match database schema
    const transformedData = parseResult.data.map((row, index) => {
      // Parse report date
      let reportDate
      try {
        if (row.Report_Date) {
          const date = new Date(row.Report_Date)
          reportDate = date.toISOString().split('T')[0] // YYYY-MM-DD format
        } else {
          reportDate = null
        }
      } catch (e) {
        console.warn(`Invalid date for row ${index + 1}: ${row.Report_Date}`)
        reportDate = null
      }
      
      return {
        member_name: row.Member_Name,
        report_month: row.Report_Month,
        report_date: reportDate,
        portfolio_value: row.Portfolio_Value,
        total_units: row.Total_Units,
        total_contribution: row.Total_Contribution,
        ownership_pct: row.Ownership_Pct,
        portfolio_growth: row.Portfolio_Growth,
        portfolio_growth_amount: row.Portfolio_Growth_Amount
      }
    }).filter(row => row.member_name && row.report_date) // Filter out invalid rows
    
    console.log(`Importing ${transformedData.length} valid records...`)
    
    // Clear existing data (optional - remove this if you want to append)
    console.log('Clearing existing timeline data...')
    const { error: deleteError } = await supabase
      .from('ffa_timeline')
      .delete()
      .neq('id', 0) // Delete all records
    
    if (deleteError) {
      console.warn('Warning: Could not clear existing data:', deleteError.message)
    }
    
    // Insert data in batches of 100
    const batchSize = 100
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('ffa_timeline')
        .insert(batch)
        .select('id')
      
      if (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
        console.error('Failed batch data sample:', batch[0])
        errorCount += batch.length
      } else {
        successCount += data.length
        console.log(`Batch ${Math.floor(i/batchSize) + 1} completed: ${data.length} records inserted`)
      }
    }
    
    console.log(`\nImport completed!`)
    console.log(`Successfully imported: ${successCount} records`)
    console.log(`Failed imports: ${errorCount} records`)
    
    // Create member accounts from timeline data
    console.log('\nCreating member accounts...')
    await createMemberAccounts()
    
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Create member accounts based on timeline data
async function createMemberAccounts() {
  try {
    // Get unique members with their latest data
    const { data: latestMemberData, error } = await supabase
      .rpc('get_latest_member_data')
    
    if (error) {
      // If the function doesn't exist, create member accounts manually
      console.log('Creating member accounts from timeline data...')
      
      const { data: timelineData, error: timelineError } = await supabase
        .from('ffa_timeline')
        .select('*')
        .order('member_name, report_date desc')
      
      if (timelineError) {
        console.error('Error fetching timeline data:', timelineError)
        return
      }
      
      // Group by member and get latest data
      const memberMap = new Map()
      timelineData.forEach(record => {
        if (!memberMap.has(record.member_name)) {
          memberMap.set(record.member_name, record)
        }
      })
      
      const memberAccounts = Array.from(memberMap.values()).map(record => ({
        member_name: record.member_name,
        current_units: record.total_units || 0,
        total_contributions: record.total_contribution || 0,
        current_value: record.portfolio_value || 0,
        ownership_percentage: record.ownership_pct || 0
      }))
      
      // Clear existing member accounts
      await supabase.from('member_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Insert member accounts
      const { data: insertedAccounts, error: insertError } = await supabase
        .from('member_accounts')
        .insert(memberAccounts)
        .select()
      
      if (insertError) {
        console.error('Error creating member accounts:', insertError)
      } else {
        console.log(`Created ${insertedAccounts.length} member accounts`)
      }
    }
    
  } catch (error) {
    console.error('Error creating member accounts:', error)
  }
}

// Run the import
importTimelineData()