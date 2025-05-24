
import UserHeader from '@/components/user-header'

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <div>
        <UserHeader />
        {children}
    </div>
  )
}
