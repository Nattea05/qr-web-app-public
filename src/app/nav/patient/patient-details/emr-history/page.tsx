'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from "next/navigation"
import { ref as ref_db, onValue } from 'firebase/database'
import { db } from '../../../../../../firebaseConfig'
import Header from '../../../../components/header'
import moment from 'moment-timezone'
import Link from 'next/link'

export default function PatientDetails() {
    const searchParams = useSearchParams()
    const petString = searchParams.get('pet') || '{}'
    const pet = petString ? JSON.parse(petString) : ''
    const [emrData, setEmrData] = useState<{ [emrID: string]: any }>({})
    const [isEmrDataLoaded, setIsEmrDataLoaded] = useState(false)

    useEffect(() => {
        const emrRef = ref_db(db, "emr_list")
        const emrListener = onValue(emrRef, (snapshot) => {
            const data = snapshot.val()
            const updatedEmrData = {...emrData}
            const ownID = Object.keys(pet)[0]
            Object.keys(data)
                .filter(key => data[key].patientID === Object.keys(pet[ownID])[0])
                .map(key => updatedEmrData[key] = data[key])
            setEmrData(updatedEmrData)
            setIsEmrDataLoaded(true)
        })

        return () => {
            emrListener()
        }
    }, [])

    useEffect(() => {}, [isEmrDataLoaded])

    return (
        <main className='flex w-screen h-screen'>
            <Header />
            <div className="flex-1 flex flex-col items-center ml-72">
                <div className='flex-1 flex flex-col p-5 w-full gap-10 items-center'>
                    {isEmrDataLoaded &&
                        Object.keys(emrData).map(key => {
                            const date = key.substring(5, 13)
                            const time = key.match(/(\d{2})(\d{2})vet/)
                            return (
                                <Link href={`/nav/patient/patient-details/emr-history/emr-details?emrDetails=${encodeURIComponent(JSON.stringify({[key]: emrData[key], ownID: Object.keys(pet)[0]}))}`} key={key} className='p-3 w-11/12 text-4xl border-b-4 border-black'>
                                    {moment(date, "YYYYMMDD").format("MMMM Do YYYY")}, {moment(time, "HHmm").format("h:mm A")}
                                </Link>
                            )
                        })
                    }
                </div>
            </div>
        </main>
    )
}