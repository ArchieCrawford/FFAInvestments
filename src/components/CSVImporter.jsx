import React, { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

export default function CSVImporter({ onImportComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus({ type: 'error', message: 'Please select a CSV file (.csv extension required)' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({ type: 'error', message: 'File size too large. Please select a file smaller than 10MB.' });
      return;
    }

    setIsUploading(true);
    setImportStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await processCSVData(results.data);
          setImportStatus({ type: 'success', message: `Successfully imported ${results.data.length} records` });
          if (onImportComplete) onImportComplete();
        } catch (error) {
          setImportStatus({ type: 'error', message: `Import failed: ${error.message}` });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setImportStatus({ type: 'error', message: `File parsing failed: ${error.message}` });
        setIsUploading(false);
      }
    });
  };

  const processCSVData = async (data) => {
    const memberMap = new Map();
    const rawTimeline = [];

    data.forEach((row) => {
      const memberName = row.Member_Name?.trim();
      if (!memberName) return;

      if (!memberMap.has(memberName)) {
        memberMap.set(memberName, {
          name: memberName,
          totalUnits: 0,
          currentBalance: 0,
          totalContribution: 0
        const timelineEntry = {
          report_date: new Date(row.Report_Date).toISOString().split('T')[0],
          portfolio_value: parseFloat(row.Portfolio_Value) || 0,
          total_units: parseFloat(row.Total_Units) || 0,
          total_contribution: parseFloat(row.Total_Contribution) || 0,
          growth_amount: parseFloat(row.Portfolio_Growth_Amount) || 0,
          growth_pct: parseFloat(row.Portfolio_Growth) || 0
        };
        rawTimeline.push(timelineEntry);

        const member = memberMap.get(memberName);
        member.totalUnits = Math.max(member.totalUnits, timelineEntry.total_units);
        member.currentBalance = Math.max(member.currentBalance, timelineEntry.portfolio_value);
        import React, { useState } from 'react'
        import Papa from 'papaparse'
        import { supabase } from '../lib/supabase'

        export default function CSVImporter({ onImportComplete }) {
          const [isUploading, setIsUploading] = useState(false)
          const [importStatus, setImportStatus] = useState(null)

          const handleFileUpload = async (event) => {
            const file = event.target.files[0]
            if (!file) return

            if (!file.name.toLowerCase().endsWith('.csv')) {
              setImportStatus({ type: 'error', message: 'Please select a CSV file (.csv extension required)' })
              return
            }

            if (file.size > 10 * 1024 * 1024) {
              setImportStatus({ type: 'error', message: 'File size too large. Please select a file smaller than 10MB.' })
              return
            }

            setIsUploading(true)
            setImportStatus(null)

            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: async (results) => {
                try {
                  await processCSVData(results.data)
                  setImportStatus({ type: 'success', message: `Successfully imported ${results.data.length} records` })
                  if (onImportComplete) onImportComplete()
                } catch (error) {
                  const msg = error instanceof Error ? error.message : String(error)
                  setImportStatus({ type: 'error', message: `Import failed: ${msg}` })
                } finally {
                  setIsUploading(false)
                }
              },
              error: (error) => {
                const msg = error instanceof Error ? error.message : String(error)
                setImportStatus({ type: 'error', message: `File parsing failed: ${msg}` })
                setIsUploading(false)
              }
            })
          }

          const processCSVData = async (data) => {
            const memberMap = new Map()
            const rawTimeline = []

            data.forEach((row) => {
              const memberName = row.Member_Name?.trim()
              if (!memberName) return

              if (!memberMap.has(memberName)) {
                memberMap.set(memberName, {
                  name: memberName,
                  totalUnits: 0,
                  currentBalance: 0,
                  totalContribution: 0
                })
              }

              if (row.Report_Date && row.Portfolio_Value) {
                const timelineEntry = {
                  member_name: memberName,
                  report_date: new Date(row.Report_Date).toISOString().split('T')[0],
                  portfolio_value: parseFloat(row.Portfolio_Value) || 0,
                  total_units: parseFloat(row.Total_Units) || 0,
                  total_contribution: parseFloat(row.Total_Contribution) || 0,
                  growth_amount: parseFloat(row.Portfolio_Growth_Amount) || 0,
                  growth_pct: parseFloat(row.Portfolio_Growth) || 0
                }
                rawTimeline.push(timelineEntry)

                const member = memberMap.get(memberName)
                member.totalUnits = Math.max(member.totalUnits, timelineEntry.total_units)
                member.currentBalance = Math.max(member.currentBalance, timelineEntry.portfolio_value)
                member.totalContribution = Math.max(member.totalContribution, timelineEntry.total_contribution)
              }
            })

            const memberNames = Array.from(memberMap.keys())

            const { data: existingMembers, error: existingError } = await supabase
              .from('members')
              .select('id, full_name')
              .in('full_name', memberNames)

            if (existingError) throw existingError

            const existingMap = new Map((existingMembers || []).map((m) => [m.full_name, m.id]))

            const newMembersPayload = memberNames
              .filter((name) => !existingMap.has(name))
              .map((name) => ({
                full_name: name,
                member_name: name,
                email: null,
                membership_status: 'pending_invite',
                join_date: new Date().toISOString().split('T')[0],
                role: 'member'
              }))

            let insertedMembers = []
            if (newMembersPayload.length > 0) {
              const { data: inserted, error: insertError } = await supabase
                .from('members')
                .insert(newMembersPayload)
                .select('id, full_name')

              if (insertError) throw insertError
              insertedMembers = inserted || []
            }

            const nameToId = new Map(existingMap)
            insertedMembers.forEach((m) => {
              nameToId.set(m.full_name, m.id)
            })

            const timelineRows = rawTimeline
              .map((t) => {
                const memberId = nameToId.get(t.member_name)
                if (!memberId) return null
                return {
                  member_id: memberId,
                  report_date: t.report_date,
                  portfolio_value: t.portfolio_value,
                  total_units: t.total_units,
                  total_contribution: t.total_contribution,
                  growth_amount: t.growth_amount,
                  growth_pct: t.growth_pct
                }
              })
              .filter(Boolean)

            if (timelineRows.length > 0) {
              const { error: timelineError } = await supabase
                .from('member_monthly_balances')
                .upsert(timelineRows, { onConflict: 'member_id,report_date' })

              if (timelineError) throw timelineError
            }

            const accountRows = Array.from(memberMap.entries())
              .map(([name, summary]) => {
                const memberId = nameToId.get(name)
                if (!memberId) return null
                return {
                  member_id: memberId,
                  member_name: name,
                  email: null,
                  current_units: summary.totalUnits,
                  current_value: summary.currentBalance,
                  total_contributions: summary.totalContribution
                }
              })
              .filter(Boolean)

            if (accountRows.length > 0) {
              const { error: accountsError } = await supabase
                .from('member_accounts')
                .upsert(accountRows, { onConflict: 'member_id' })

              if (accountsError) throw accountsError
            }
          }

          const loadSampleData = async () => {
            setIsUploading(true)
            setImportStatus(null)

            try {
              const sampleData = [
                {
                  Member_Name: 'Adih, Kofi S.',
                  Report_Month: '25-Aug',
                  Report_Date: '8/1/2025',
                  Portfolio_Value: '14087.16731',
                  Total_Units: '283.3353311',
                  Total_Contribution: '',
                  Ownership_Pct: '',
                  Portfolio_Growth: '-0.003714899',
                  Portfolio_Growth_Amount: '-52.52754346'
                },
                {
                  Member_Name: 'Burrell, Felecia',
                  Report_Month: '25-Aug',
                  Report_Date: '8/1/2025',
                  Portfolio_Value: '97624.903',
                  Total_Units: '1963.530609',
                  Total_Contribution: '',
                  Ownership_Pct: '',
                  Portfolio_Growth: '0.055980549',
                  Portfolio_Growth_Amount: '5175.375354'
                },
                {
                  Member_Name: 'Crawford, Archie',
                  Report_Month: '25-Aug',
                  Report_Date: '8/1/2025',
                  Portfolio_Value: '55000.00',
                  Total_Units: '1100.0000',
                  Total_Contribution: '',
                  Ownership_Pct: '',
                  Portfolio_Growth: '0.012345',
                  Portfolio_Growth_Amount: '678.90'
                }
              ]

              await processCSVData(sampleData)
              setImportStatus({ type: 'success', message: `Sample data imported (${sampleData.length} records)` })
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              setImportStatus({ type: 'error', message: `Sample import failed: ${msg}` })
            } finally {
              setIsUploading(false)
            }
          }

          return (
            <div>
              <div className="card p-4 mb-4">
                <p className="text-sm text-muted mb-2">Import member balances from a CSV file</p>
                <input type="file" accept=".csv" onChange={handleFileUpload} />
                <button className="btn-primary-soft ml-3" onClick={loadSampleData} disabled={isUploading}>Load Sample</button>
              </div>
              {importStatus && (
                <div className={`card p-3 ${importStatus.type === 'error' ? 'border-red-400' : 'border-green-400'}`}>
                  <p className={importStatus.type === 'error' ? 'text-red-500' : 'text-green-600'}>{importStatus.message}</p>
                </div>
              )}
            </div>
          )
        }
