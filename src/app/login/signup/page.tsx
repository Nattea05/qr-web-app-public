'use client'

import { useState } from "react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as ref_db, set } from 'firebase/database';
import { db, auth } from '../../../../firebaseConfig';
import Link from "next/link";

export default function SignUp() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    function handleSignUp() {
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;

                const userData = {
                    email: email,
                    password: password
                }
                const usersRef = ref_db(db, "users/" + user.uid);
                set(usersRef, userData);
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    alert('Email address is already in use. Please choose another email.')
                } else {
                    console.log(`${error.code}: ${error.message}`)
                }
            })
    }

    return (
        <main className='flex flex-col w-screen h-screen items-center justify-center'>
            <div className="flex flex-col items-center justify-evenly border-4 border-black rounded-2xl w-96 h-72">
                <span>Sign Up</span>
                <input className="p-5 border-2 h-14 rounded-xl" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="p-5 border-2 h-14 rounded-xl" type="password" placeholder="Password" value={password} onChange={(p) => setPassword(p.target.value)} />
                <button className="w-24 h-14 text-xl font-bold rounded-xl bg-petgreen" onClick={() => handleSignUp()}>Sign Up</button>
                <span>Already have an account? <Link href="/login" className="text-petgreen">Login here</Link></span>
            </div>
        </main>
    )
}