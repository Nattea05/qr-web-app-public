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
    const ownID = Object.keys(pet)[0]
    const petID = Object.keys(pet[ownID])[0]
    const [appointmentHistory, setAppointmentHistory] = useState<Record<string, any>>({})
    const [isAppointmentHistoryLoaded, setIsAppointmentHistoryLoaded] = useState(false)
    const [emrData, setEmrData] = useState<{ [emrID: string]: any }>({})
    const [isEmrDataLoaded, setIsEmrDataLoaded] = useState(false)

    useEffect(() => {
        const emrRef = ref_db(db, "emr_list")
        const emrListener = onValue(emrRef, (snapshot) => {
            const data = snapshot.val()
            const updatedEmrData = {...emrData}
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

    useEffect(() => {
        if (isEmrDataLoaded) {
            const appointmentHistoryRef = ref_db(db, "appointment_history")
            const appointmentHistoryListener = onValue(appointmentHistoryRef, (snapshot) => {
                const data = snapshot.val()
                Object.keys(data).filter(key => Object.keys(emrData).includes(key)).map(key => {
                    setAppointmentHistory((prevState) => ({
                        ...prevState,
                        [key]: data[key]
                      }))
                })
                setIsAppointmentHistoryLoaded(true)
            })

            return () => {
                appointmentHistoryListener()
            }
        }
    }, [isEmrDataLoaded])

    return (
        <main className='flex w-screen h-max'>
            <Header />
            <div className="flex-1 flex flex-col p-5 items-center gap-y-5 ml-72 overflow-y-scroll">
                <span className='font-semibold text-4xl self-start ml-3'>{pet[ownID][petID].name}&apos;s EMR History</span>
                <div className='flex-1 flex flex-col w-full max-h-[640px] p-6 overflow-y-scroll items-center rounded-3xl border-2 border-gray-300'>
                  <div className='flex flex-row w-full px-2 items-center border-b-4 border-black'>
                    <div className='w-1/2 font-semibold text-2xl'><span>Date</span></div>
                    <div className='w-1/2 font-semibold text-2xl'><span>Reason</span></div>
                  </div>
                  <table className='flex flex-col w-full gap-y-5'>
                    {isEmrDataLoaded && isAppointmentHistoryLoaded &&
                      Object.keys(emrData).map((emrID) => {                    
                        return (
                          <tr key={emrID}>
                            <Link href={`/nav/patient/patient-details/emr-history/emr-details?emrDetails=${encodeURIComponent(JSON.stringify({[emrID]: emrData[emrID], ownID: Object.keys(pet)[0]}))}`} className='flex flex-row w-full py-3 px-2 items-center border-b-2 border-gray-300'>
                              <td className='flex items-center w-1/2 gap-x-5 text-2xl'>{moment(appointmentHistory[emrID].date).format("Do MMMM YYYY")}, {moment(appointmentHistory[emrID].time, "HH:mm").format("h:mm A")}</td>
                              <td className='flex items-center w-1/2 max-w-[553px] max-h-[37px] truncate text-2xl'>{appointmentHistory[emrID].reason}</td>
                            </Link>
                          </tr>
                        )
                      })
                    }
                  </table>
                </div>                
            </div>
        </main>
    )
}