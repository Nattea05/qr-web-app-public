'use client'

import { useState } from "react";
import { auth } from '../../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { Logo } from "../images/svg-logos/svg_logos";
import LoginImage from "@/app/images/login-img/LoginImage.jpg"
import Link from "next/link";
import Image from "next/image";

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [focusedInput, setFocusedInput] = useState("")
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
        <main className='flex flex-row w-screen h-screen items-center justify-center'>
            <div className="flex flex-col w-2/3 h-full">
                <Image src={LoginImage} alt="Login Image" width={0} height={0} sizes="100vw" className="w-full h-full object-cover -scale-x-100" />
                <div className="absolute flex flex-col self-center h-full justify-center items-center">
                    <span className="font-bold text-[86px] text-petgreen text-center">A better experience.</span>
                    <span className="font-bold text-[86px] text-petgreen text-center">For you and them.</span>
                </div>
            </div>
            <div className="flex flex-col w-1/3 h-full gap-y-5 items-center justify-center">
                <Logo width={"120"} height={"120"} fill={""} />
                <span className="font-bold text-5xl text-petgreen">Pawsitivity</span>
                <span className="font-bold text-5xl">Welcome back!</span>
                <span className="font-medium text-lg text-gray-700">Please enter your details</span>
                <input className={`w-10/12 p-4 border-b-2 ${focusedInput === "email" ? "border-petgreen placeholder:text-petgreen" : "border-gray-300"}`} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedInput("email")} onBlur={() => setFocusedInput("")} />
                <input className={`w-10/12 p-4 border-b-2 ${focusedInput === "password" ? "border-petgreen placeholder:text-petgreen" : "border-gray-300"}`} type="password" placeholder="Password" value={password} onChange={(p) => setPassword(p.target.value)} onFocus={() => setFocusedInput("password")} onBlur={() => setFocusedInput("")} />
                <button className="w-10/12 p-4 mt-2 text-center text-xl font-bold rounded-full bg-petgreen active:bg-activepetgreen" onClick={() => handleLogin()}>Login</button>
            </div>
        </main>
    )
}