'use client'

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";
import { usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { ref as ref_db, onValue } from 'firebase/database'
import { db, auth } from "../../../firebaseConfig"
import { Calendar, Client, Patient, History, QRCode } from '../images/nav-img/nav-img'


export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const [vetIndex, setVetIndex] = useState(-1)
    const [clinicData, setClinicData] = useState<any>()
    const [uid, setUid] = useState('')
    const [isProfileHover, setIsProfileHover] = useState(false)
    const isProfileActive = pathname === ("/nav/profile").replace(/^\.\./, '')

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              setUid(user.uid)
            } else {
              router.push("/login")
            }
          })

        return (() => {
            unsubscribe()
        })
    }, [])

    useEffect(() => {
        const userRef = ref_db(db, "users/" + uid)
        const userListener = onValue(userRef, (snapshot) => {
            const data = snapshot.val()
            setVetIndex(data.vetIndex)
        })

        return (() => {
            userListener()
        })
    }, [uid])

    useEffect(() => {
        if (vetIndex !== -1) {
            const clinicRef = ref_db(db, "places/place" + (vetIndex + 1).toString())
            const clinicListener = onValue(clinicRef, (snapshot) => {
                const data = snapshot.val()
                setClinicData(data)
            })

            return (() => {
                clinicListener()
            })
        }
    }, [vetIndex])

    return (
        <header className='h-full w-72 fixed flex flex-col shadow-xl'>
            <Link href='/' className='w-full h-1/6 flex justify-around items-center -space-x-5'>
                <Image
                    src='/petlogo.svg'
                    alt='Pawsitivity Logo'
                    width={55}
                    height={55}
                 />
                <div className="flex flex-col">
                    <span className='font-bold text-2xl'>Pawsitivity</span>
                    <span className="text-sm text-gray-400">Veterinary Animal Software</span>
                </div>
            </Link>
            <nav className="flex flex-col h-3/4 space-y-5">
                {
                    [
                        {title: 'Calendar', url: '/', component: Calendar},
                        {title: 'Client List', url: '/nav/client', component: Client},
                        {title: 'Patient List', url: '/nav/patient', component: Patient},
                        {title: 'Appointment History', url: '/nav/appointment-history', component: History},
                        {title: 'Scan QR', url: '/nav/scan-qr', component: QRCode}
                    ].map(({title, url, component}) => {
                        const isActive = (pathname === url.replace(/^\.\./, ''))

                        return (
                            <Link 
                                key={title} 
                                href={url} 
                                className={`flex h-16 pl-8 py-10 items-center font-semibold text-2xl hover:text-petgreen  hover:fill-petgreen ${isActive ? 'bg-petgreen text-white fill-white hover:text-white hover:fill-white' : ''}`}
                            >
                                {component()}
                                <span className="pl-5">{title}</span>
                            </Link>
                        )
                    })
                }
            </nav>
            <hr className="w-5/6 border-1 rounded border-gray-300 self-center"></hr>
            <Link href='/nav/profile' className="flex w-full h-1/6 justify-center items-center" onMouseEnter={() => setIsProfileHover(true)} onMouseLeave={() => setIsProfileHover(false)}>
                <div className={`flex justify-center w-10/12 p-3 rounded-3xl ${isProfileActive ? "bg-petgreen" : ""}`}>
                    <div className="flex-1 flex flex-col w-full justify-center items-center gap-y-2">
                        {clinicData &&
                            <span className={`font-bold text-lg text-center ${isProfileHover ? "text-petgreen" : ""} ${isProfileActive ? "text-white" : ""}`}>{clinicData.name}</span>
                        }
                        <span className={`font-semibold text-base text-center text-gray-400 ${isProfileHover ? "text-petgreen" : ""} ${isProfileActive ? "text-white" : ""}`}>View Profile</span>
                    </div>
                </div>
            </Link>
        </header>
    )
}