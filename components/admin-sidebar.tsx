import { CircleUser, Landmark } from 'lucide-react';
import Link from 'next/link'

export default function AdminSidebar() {
    return (
        <header className="flex items-center justify-between border-b bg-white h-14 px-4 gap-3">
            <h1 className="text-xl font-bold">OpenLabs</h1>
            <div className='flex gap-2'>
                <Link href="/admin" className='p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition duration-150 ease-in-out'><span>Institutions</span><Landmark className='size-4'/></Link>
                <Link href="/admin/account" className=' p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition duration-150 ease-in-out'><span>Account</span><CircleUser className='size-4' /></Link>
            </div>
        </header>
    );
}