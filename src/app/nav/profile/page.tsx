'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/header'
import { db, auth } from '../../../../firebaseConfig'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref as ref_db, onValue } from 'firebase/database'

export default function Profile() {
    const [uid, setUid] = useState('')
    const router = useRouter()
    const [userData, setUserData] = useState<any>();
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

    function handleSignOut() {
        signOut(auth).then(() => {
            router.replace('/login')
        }).catch((error) => {
            console.error("Error signing out: ", error)
        })
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid)
            } else {
                router.push('/login')
            }
        })

        return () => {
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        const userRef = ref_db(db, "users/" + uid)
        const valueListener = onValue(userRef, (snapshot) => {
            const data = snapshot.val()
            setUserData(data)
            setIsUserDataLoaded(true)
        })

        return () => {
            valueListener();
        }
    }, [uid])

    useEffect(() => {}, [isUserDataLoaded])

    return (
        <main className='flex w-screen h-screen'>
          <Header />
            <div className="flex-1 flex flex-col justify-center items-center ml-72">
                <span className='font-bold text-black text-3xl'>Email: {userData?.email}</span>
                <button
                    className='mt-10 bottom-3 w-8/12 h-16 self-center rounded-xl bg-petgreen active:bg-activepetgreen justify-center'
                    onClick={() => handleSignOut()}
                >
                    <span className='font-bold text-black text-2xl self-center'>Log Out</span>
                </button>  
            </div>
        </main>
    )
}