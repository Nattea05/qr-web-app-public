'use client'

import Header from '../../../components/header'
import { useState, useEffect } from 'react'
import { ref as ref_db, onValue } from 'firebase/database'
import { ref as ref_storage, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../../../firebaseConfig'
import { useSearchParams } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import { ProfilePicture } from '@/app/images/svg-logos/svg_logos'

export default function PatientDetails() {
    const searchParams = useSearchParams()
    const patientDetailsString = searchParams.get('patientDetails') || '{}'
    const patientDetails = patientDetailsString ? JSON.parse(patientDetailsString) : {}
    const [clientDetails, setClientDetails] = useState<Record<string, any>>({})
    const [clientImage, setClientImage] = useState('')
    const [isClientLoaded, setIsClientLoaded] = useState(false)
    const [isClientImageLoaded, setIsClientImageLoaded] = useState(false)
    const ownID = (Object.keys(patientDetails))[0]
    const petID = (Object.keys(patientDetails[ownID]))[0]

    useEffect(() => {
      const clientRef = ref_db(db, "users/" + ownID)
      const clientListener = onValue(clientRef, (snapshot) => {
        const data = snapshot.val()
        setClientDetails(data)
        setIsClientLoaded(true)
      })
      
        return (() => {
          clientListener()
        })
    }, [])

    useEffect(() => {
      if (isClientLoaded) {
        const clientImageRef = ref_storage(storage, "user-profile-pictures/" + ownID)
        getDownloadURL(clientImageRef)
          .then((url) => {
            setClientImage(url)
            setIsClientImageLoaded(true)
          })
          .catch((error) => {
            if (error.code === "storage/object-not-found") {
              setIsClientImageLoaded(true)
            } else {
              console.error("Error retrieving user image: " + error)
            }
          })
      }
    }, [isClientLoaded])

    return (
      <main className='flex w-screen h-max'>
        <Header />
        <div className="flex-1 flex flex-col p-5 gap-y-8 items-center ml-72 overflow-y-scroll">
          <div className='flex flex-row w-full rounded-3xl border-2 border-gray-300'>
            <div className='flex flex-col w-1/2 h-full p-5'>
              <span className='font-light text-5xl'>Patient</span>
              <div className='flex-1 flex flex-row w-full p-3 items-center gap-x-5'>
                {patientDetails[ownID]?.image &&
                  <Image src={patientDetails[ownID].image} alt='Patient Image' width={150} height={150} className='w-[150px] h-[150px] object-contain rounded-full' />
                }
                {!patientDetails[ownID]?.image &&
                  <ProfilePicture width='170' height='170' fill='black' />
                }
                <span className='font-semibold text-5xl'>{patientDetails[ownID][petID].name}</span>
              </div>
            </div>
            <div className='flex flex-col w-1/2 h-full p-5'>
              <span className='font-light text-5xl'>Owner</span>
              <div className='flex-1 flex flex-row w-full p-3 items-center gap-x-5'>
                {isClientImageLoaded && clientImage &&
                  <Image src={clientImage} alt='Client Image' width={150} height={150} className='w-[150px] h-[150px] object-contain rounded-full' />
                }
                {isClientImageLoaded && !clientImage &&
                  <ProfilePicture width='170' height='170' fill='black' />
                }
                <span className='font-semibold text-5xl'>{clientDetails.firstName} {clientDetails.lastName}</span>
              </div>
            </div>
          </div>
          <div className='flex flex-row w-full justify-center items-center gap-x-3'>
            <div className='flex flex-col w-1/2 min-h-[334px] p-5 pb-8 justify-evenly rounded-3xl border-2 border-gray-300'>
              {isClientLoaded && isClientImageLoaded && patientDetails &&
                Object.keys(patientDetails).map((ownID) => {
                  const pet = patientDetails[ownID]
                  return Object.keys(pet).filter(key => key !== "image").map((petID) => {
                    const fields = patientDetails[ownID][petID]
                    return Object.keys(fields).filter(field => field !== "conditions" && field !== "name").map((field) => {
                      return (
                        <div key={field} className='flex flex-row w-full p-3 justify-between border-b-2 border-gray-300'>
                          <span className='font-semibold text-2xl text-gray-400'>
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </span>
                          <span className='font-semibold text-2xl text-right'>
                            {fields[field]}
                          </span>
                        </div>
                      )
                    })
                  })
                })
              }
            </div>
            <div className='flex flex-col w-1/2 min-h-[334px] p-5 gap-y-3 rounded-3xl border-2 border-gray-300'>
              {isClientLoaded && isClientImageLoaded && patientDetails &&
                <>
                  <span className='font-semibold text-2xl'>Conditions</span>
                  <div className='flex-1 w-full max-h-[246px] p-3 pb-2 overflow-y-scroll rounded-3xl border-2 border-gray-300'>
                    <p className='w-full max-h-[240px]'>{patientDetails[ownID][petID].conditions}</p>
                  </div>
                </>
              }
            </div>
          </div>
          <Link href={`/nav/patient/patient-details/emr-history?pet=${encodeURIComponent(JSON.stringify(patientDetails))}`} className='flex w-full p-5 justify-center items-center rounded-2xl bg-petgreen active:bg-activepetgreen font-bold text-2xl'>
            View EMR History
          </Link>
        </div>
      </main>
    )
}