import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  return (
    <AdminDashboard
      password={process.env.ADMIN_PASSWORD || ''}
    />
  )
}