'use client'

import { ref as ref_db, onValue } from 'firebase/database'
import { ref as ref_storage, getDownloadURL, getMetadata } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth, storage } from '../../../../firebaseConfig'
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
  const [petImages, setPetImages] = useState<{ imageName: string; url: string; }[]>([])
  const [isPetImagesLoaded, setIsPetImagesLoaded] = useState(false)
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

  useEffect(() => {
    if (isPetDataLoaded) {
      const promises = Object.keys(petData).map(async (ownID) => {
        const pets = petData[ownID]
        if (pets) {
          await Promise.all(
            Object.keys(pets).map(async (petID) => {
              const petImagesRef = ref_storage(storage, "pet-profile-pictures/" + ownID + "/" + petID)
              try {
                const metadata = await getMetadata(petImagesRef)
                const url = await getDownloadURL(petImagesRef)
                setPetImages(petImages => [...petImages, {imageName: metadata.name, url: url}])
              }
              catch (error) {
                console.error("Error retrieving data: " + error);
              }
            }) 
          )
          Promise.all(promises)
            .then(() => {
              setIsPetImagesLoaded(true)
            })
        }
      })
    }
  }, [isPetDataLoaded])

  useEffect(() => {
    if (isPetImagesLoaded) {}
  }, [isPetImagesLoaded])

  return (
    <main className='flex w-screen h-max'>
      <Header />
      <div className="flex-1 flex flex-col p-5 items-center gap-y-5 ml-72 overflow-y-scroll">
        <span className='font-semibold text-4xl self-start ml-3'>Patient List</span>
        <div className='flex-1 flex flex-col w-full p-6 items-center rounded-3xl border-2 border-gray-300'>
          <div className='flex flex-row w-full px-2 items-center border-b-4 border-black'>
            <div className='w-4/12 font-semibold text-2xl'><span>Pet</span></div>
            <div className='w-3/12 font-semibold text-2xl'><span>Species</span></div>
            <div className='w-3/12 font-semibold text-2xl'><span>Breed</span></div>
            <div className='w-2/12 font-semibold text-2xl'><span>Sex</span></div>
          </div>
          <table className='flex flex-col w-full'>
            {isPetDataLoaded && isPetImagesLoaded &&
              Object.keys(petData).map((ownID) => {
                const pets = petData[ownID]
                return Object.keys(pets).map((petID) => {
                  const petImageIndex = petImages.findIndex(pet => pet.imageName === petID)
                  return (
                    <tr key={petID} className=''>
                      <Link href={`/nav/patient/patient-details?patientDetails=${encodeURIComponent(JSON.stringify({[ownID]: {[petID]: petData[ownID][petID], image: petImages[petImageIndex].url}}))}`} className='flex flex-row w-full py-3 px-2 items-center border-b-2 border-gray-300'>
                        <td className='flex items-center w-4/12 gap-x-5 text-2xl'>
                          <Image src={petImages[petImageIndex].url} alt='Staff Image' width={56} height={56} className='w-[56px] h-[56px] object-cover rounded-2xl' />
                          {petData[ownID][petID].name}
                        </td>
                        <td className='flex items-center w-3/12 text-2xl'>{petData[ownID][petID].species}</td>
                        <td className='flex items-center w-3/12 text-2xl'>{petData[ownID][petID].breed}</td>
                        <td className='flex items-center w-2/12 text-2xl'>{petData[ownID][petID].sex}</td>
                      </Link>
                    </tr>
                  )
              })
              })
            }
          </table>
        </div>
      </div>
    </main>
  )
}