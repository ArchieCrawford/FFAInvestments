import React from 'react'
import { Page } from '../components/Page'
import { ClubGrowthCharts } from '../components/MonthlyHistoryCharts.jsx'

const AdminDashboard_Hero = () => {
  return (
    <Page
      title="Partner Dashboard"
      subtitle="Track how the club and partners have grown over time."
    >
      <ClubGrowthCharts />
    </Page>
  )
}

export default AdminDashboard_Hero
