'use client'

import Image from "next/image"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Calendar, Client, Patient, Staff, QRCode } from '../images/nav-img/nav-img'

export default function Header() {
    const pathname = usePathname()

    return (
        <header className='h-full w-72 fixed flex flex-col shadow-xl'>
            <Link href='../' className='w-full h-1/6 flex justify-around items-center -space-x-10'>
                <Image
                    src='/petlogo.svg'
                    alt='Pawsitivity Logo'
                    width={55}
                    height={55}
                 />
                <div className="flex flex-col">
                    <span className='font-bold text-2xl'>Pawsitivity</span>
                    <span className="text-sm text-gray-400">Veterinary Animal Clinic</span>
                </div>
            </Link>
            <nav className="h-3/4 space-y-5 flex flex-col">
                {[
                    {title: 'Calendar', url: '../', component: Calendar},
                    {title: 'Client List', url: '../nav/client', component: Client},
                    {title: 'Patient List', url: '../nav/patient', component: Patient},
                    {title: 'Staff List', url: '../nav/staff', component: Staff},
                    {title: 'Scan QR', url: '../nav/scan-qr', component: QRCode}
                ].map(({title, url, component}) => {
                    const isActive = (pathname === url.replace(/^\.\./, ''))

                    return (
                        <Link 
                            key={title} 
                            href={url} 
                            className={`h-16 flex pl-8 items-center font-semibold text-2xl hover:text-petgreen  hover:fill-petgreen ${isActive ? 'bg-petgreen text-white fill-white hover:text-white hover:fill-white' : ''}`}
                        >
                            {component()}
                            <span className="pl-5">{title}</span>
                        </Link>
                    )
                })}
            </nav>
            <hr className="w-5/6 border-1 rounded border-gray-300 self-center"></hr>
            <div className="justify-center h-1/6 flex">
                <svg width="100" height="100">
                    <mask id="circleMask">
                      <rect width="100%" height="100%" fill="black" />
                      <circle cx="50" cy="50" r="35" fill="white" />
                    </mask>

                    <image href="profile-pictures/hailee.jpg" x="-35" width="150" height="150" mask="url(#circleMask)" />
                </svg>
                <div className="flex flex-col w-1/2 justify-center items-start space-y-1">
                    <span className="font-semibold text-sm">Dr. Hailee S.</span>
                    <span className="font-medium text-xs text-gray-400">Veterinarian</span>
                </div>
            </div>
        </header>
    )
}