
import AdminSidebar from '@/components/admin-sidebar'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <div>
        <AdminSidebar />
        {children}
    </div>
  )
}
