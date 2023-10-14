'use client'

import Header from '../../../components/header'
import { useSearchParams } from "next/navigation"
import Link from 'next/link'

export default function PatientDetails() {
    const searchParams = useSearchParams()
    const patientDetailsString = searchParams.get('patientDetails') || '{}'
    const patientDetails = patientDetailsString ? JSON.parse(patientDetailsString) : {}

    return (
      <main className='flex w-screen h-screen'>
        <Header />
        <div className="flex-1 flex flex-col items-center ml-72">
          <div className='flex-1 flex flex-col p-5 w-full gap-10 items-center'>
            {patientDetails &&
              Object.keys(patientDetails).map((ownID) => {
                const pet = patientDetails[ownID]
                return Object.keys(pet).map((petID) => {
                  const fields = patientDetails[ownID][petID]
                  return Object.keys(fields).map((field) => (
                    <span key={field} className='p-3 w-11/12 text-4xl border-b-4 border-black'>
                      {field.charAt(0).toUpperCase() + field.slice(1)}: {fields[field]}
                    </span>
                  ))
                })
              })
            }
            <Link href={`/nav/patient/patient-details/emr-history?pet=${encodeURIComponent(JSON.stringify(patientDetails))}`} className='flex items-center justify-center w-72 h-20 rounded-full font-semibold text-xl bg-petgreen active:bg-activepetgreen'>View EMR history</Link>
          </div>
        </div>
      </main>
    )
}