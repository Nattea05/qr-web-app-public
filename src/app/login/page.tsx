'use client'

import { useState } from "react";
import { auth } from '../../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    function handleLogin() {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                router.push("../")
            })
            .catch((error) => {
                if (error.code === 'auth/invalid-email' || error.code === 'auth/missing-password' || error.code === 'auth/invalid-login-credentials') {
                    alert('Invalid email or password')
                } else {
                    console.log(`${error.code}: ${error.message}`)
                }
            })
    }


    return (
        <main className='flex flex-col w-screen h-screen items-center justify-center'>
            <div className="flex flex-col items-center justify-evenly border-4 border-black rounded-2xl w-96 h-72">
                <span>Log In</span>
                <input className="p-5 border-2 h-14 rounded-xl" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="p-5 border-2 h-14 rounded-xl" type="password" placeholder="Password" value={password} onChange={(p) => setPassword(p.target.value)} />
                <button className="w-24 h-14 text-xl font-bold rounded-xl bg-petgreen" onClick={() => handleLogin()}>Login</button>
                <span>Don&apos;t have an account? <Link href="/login/signup" className="text-petgreen">Register here</Link></span>
            </div>
        </main>
    )
}