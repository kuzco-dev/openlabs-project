'use client'
 
import { signout } from "@/utils/actions"
 
export default function SignoutButton() {
    return (
        <button onClick={() => signout()} className="cursor-pointer bg-black text-white rounded-lg flex px-4 py-1">Sign out</button>
    )
}