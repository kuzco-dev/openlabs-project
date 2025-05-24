import { CircleUser, House, ShoppingBag } from 'lucide-react';
import Link from 'next/link'

export default function UserHeader() {


    return (
        <header className="flex items-center justify-between border-b bg-white h-14 px-4 gap-3">
            <h1 className="text-xl font-bold">OpenLabs</h1>
            <div className='flex gap-2'>
                <Link href="/user" className='p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition duration-150 ease-in-out'><span>home</span><House className='size-4'/></Link>
                <Link href="/user/orders" className='p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition duration-150 ease-in-out'><span>Orders</span><ShoppingBag className='size-4'/></Link>
                <Link href="/user/account" className=' p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition duration-150 ease-in-out'><span>Account</span><CircleUser className='size-4' /></Link>
            </div>
        </header>
    );
}