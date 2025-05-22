'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup } from "@/components/ui/radio-group"
import Link from "next/link";
import { signup } from "@/utils/actions";
import { useActionState } from 'react'

const initialState = {
    success: true,
    message: '',
}

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
    
    const [state, formAction, pending] = useActionState(signup, initialState)

    return (
        <form className={cn("flex flex-col gap-6", className)} {...props} action={formAction}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Signup to your account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                Enter your email below to signup to your account
                </p>
            </div>
            <div className="grid gap-6">
                <RadioGroup defaultValue="comfortable" className="flex justify-center">
                    <div className="flex items-center space-x-2">
                        <input type="radio" id="user" name="role" value="user" />
                        <label htmlFor="user">Student</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="radio" id="admin" name="role" value="admin" />
                        <label htmlFor="user">Admin</label>
                    </div>
                </RadioGroup>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="m@example.com" required />
                </div>
                <div className="grid gap-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" name="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                Signup
                </Button>
                <p aria-live="polite" className="text-red-500">{state.message}</p>
            </div>
            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/" className="underline underline-offset-4">
                    Login
                </Link>
            </div>
        </form>
    )
}
