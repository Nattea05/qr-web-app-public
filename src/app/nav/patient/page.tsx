'use client'

import { ref as ref_db, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../../../../firebaseConfig'
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import Header from '../../components/header'

export default function PatientList() {
  interface UserData {
    email: string,
    password: string,
    vetIndex: number
  }

  interface PetData {
    [petID: string]: {
      breed: string,
      name: string,
      sex: string,
      species: string,
    }
  }

  const [userData, setUserData] = useState<UserData>()
  const [petIdList, setPetIdList] = useState([])
  const [petIdSet, setPetIdSet] = useState(new Set<any>(petIdList))
  const [petData, setPetData] = useState<{ [ownID: string]: PetData }>({})
  const [isPetDataLoaded, setIsPetDataLoaded] = useState(false)
  const [isPetIdListLoaded, setIsPetIdListLoaded] = useState(false)
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)
  const [uid, setUid] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    
    const userRef = ref_db(db, "users")
    const userListener = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      Object.keys(data).forEach(key => {
        if (key === uid) {
          setUserData(data[key])
          setIsUserDataLoaded(true)
        }
      })
    })

    return () => {
      userListener()
    }
  }, [uid])

  useEffect(() => {
    if (isUserDataLoaded) {
      const historyRef = ref_db(db, "appointment_history")
      const historyListener = onValue(historyRef, (snapshot) => {
        const data = snapshot.val()
        const petIds = Object.keys(data)
        .filter(key => data[key].vetIndex === userData?.vetIndex)
        .map(key => data[key].petID)
        const updatedSet = new Set<any>([...petIdList, ...petIds])
        updatedSet.forEach(item => setPetIdSet(prev => prev.add(item)))
        setIsPetIdListLoaded(true)
      })

      return () => {
        historyListener()
      }
    }
  }, [isUserDataLoaded])

  useEffect(() => {
    if (isPetIdListLoaded) {
      const petsRef = ref_db(db, "pets")
      const petListener = onValue(petsRef, (snapshot) => {
        const data = snapshot.val()
        const updatedPetData = {...petData}
        Object.keys(data).forEach(ownId => {
          const pets = data[ownId]
          if (!updatedPetData[ownId]) {
            updatedPetData[ownId] = {}
          }
          Object.keys(pets).forEach(petId => {
            if (petIdSet.has(petId)) {
              updatedPetData[ownId][petId] = pets[petId]
            }
          })
        })
        setPetData(updatedPetData)
        setIsPetDataLoaded(true)
      })

      return () => {
        petListener()
      }
    }
  }, [isPetIdListLoaded])

  useEffect(() => {}, [isPetDataLoaded])

  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <div className="flex-1 flex flex-col items-center ml-72">
        <div className='flex-1 flex flex-col p-5 w-full gap-10 items-center'>
          {isPetDataLoaded &&
            Object.keys(petData).map((ownID) => {
              const pets = petData[ownID]
              return Object.keys(pets).map((petID) => (
                <Link href={`/nav/patient/patient-details?patientDetails=${encodeURIComponent(JSON.stringify({[ownID]: {[petID]: petData[ownID][petID]}}))}`} key={petID} className='p-3 w-11/12 text-4xl border-b-4 border-black'>
                  {petData[ownID][petID].name}
                </Link>
              
              ))
            })
          }
        </div>
      </div>
    </main>
  )
}