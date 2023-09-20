import { useState } from "react"

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleLogin() {
        console.log("Login")
    }

    return (
        <main className='flex flex-col w-screen h-screen items-center justify-center'>
            <div className="border-4 w-40 h-24">
                <span>Log In</span>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={email} onChange={(p) => setPassword(p.target.value)} />
                <button className="w-16 h-10 text-xl font-bold bg-petgreen" onClick={() => handleLogin()}>Login</button>
            </div>
        </main>
    )
}