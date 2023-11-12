'use client'

import { ref as ref_db, onValue } from 'firebase/database'
import { ref as ref_storage, getDownloadURL, getMetadata } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { db, storage, auth } from '../../../../firebaseConfig'
import { useRouter } from "next/navigation"
import { ProfilePicture } from '@/app/images/svg-logos/svg_logos'
import Image from 'next/image'
import Header from '../../components/header'

export default function ClientList() {
  interface UserData {
    email: string,
    password: string,
    vetIndex: number
  }

  interface ClientData {
    [key: string]: string
  }

  const [userData, setUserData] = useState<UserData>()
  const [clientIdList, setClientIdList] = useState([])
  const [clientIdSet, setClientIdSet] = useState(new Set<any>(clientIdList))
  const [clientData, setClientData] = useState<{ [clientID: string]: ClientData }>({})
  const [clientImages, setClientImages] = useState<{ imageName: string; url: string; }[]>([])
  const [isClientImagesLoaded, setIsClientImagesLoaded] = useState(false)
  const [isClientDataLoaded, setIsClientDataLoaded] = useState(false)
  const [isClientIdListLoaded, setIsClientIdListLoaded] = useState(false)
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
        const clientIds = Object.keys(data)
        .filter(key => data[key].vetIndex === userData?.vetIndex)
        .map(key => data[key].ownID)
        const updatedSet = new Set<any>([...clientIdList, ...clientIds])
        updatedSet.forEach(item => setClientIdSet(prev => prev.add(item)))
        setIsClientIdListLoaded(true)
      })

      return () => {
        historyListener()
      }
    }
  }, [isUserDataLoaded])

  useEffect(() => {
    if (isClientIdListLoaded) {
      const clientRef = ref_db(db, "users")
      const clientListener = onValue(clientRef, (snapshot) => {
        const data = snapshot.val()
        const updatedClientData = {...clientData}
        Object.keys(data).forEach(ownId => {
          const client = data[ownId]
          if (clientIdSet.has(ownId)) {
            updatedClientData[ownId] = client
          }
        })
        setClientData(updatedClientData)
        setIsClientDataLoaded(true)
      })

      return () => {
        clientListener()
      }
    }
  }, [isClientIdListLoaded])

  useEffect(() => {
    if (isClientDataLoaded) {
      const promises = Object.keys(clientData).map(async (ownID) => {
        const clientImagesRef = ref_storage(storage, "user-profile-pictures/" + ownID)
        try {
          const metadata = await getMetadata(clientImagesRef)
          const url = await getDownloadURL(clientImagesRef)
          setClientImages(clientImages => [...clientImages, {imageName: metadata.name, url: url}])
        }
        catch (error: any) {
          if (error.code === "storage/object-not-found") {
            setClientImages(clientImages => [...clientImages, {imageName: ownID, url: ''}])
          } else {
            console.error("Error retrieving client images: " + error);
          }
        }
        Promise.all(promises)
          .then(() => {
            setIsClientImagesLoaded(true)
          })
          .catch((error) => {
            console.error("Error resolving promises: " + error)
          })
      })
    }
  }, [isClientDataLoaded])

  useEffect(() => {
    if (isClientImagesLoaded) {
      // console.log(clientData)
      // console.log(clientImages)
    }
  }, [isClientImagesLoaded])
  
  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <div className="flex-1 flex flex-col p-5 items-center gap-y-5 ml-72 overflow-y-scroll">
        <span className='font-semibold text-4xl self-start ml-3'>Client List</span>
          <div className='flex-1 flex flex-col w-full max-h-[640px] p-6 overflow-y-scroll items-center rounded-3xl border-2 border-gray-300'>
            <div className='flex flex-row w-full px-2 items-center border-b-4 border-black'>
              <div className='w-2/6 font-semibold text-2xl'><span>Client</span></div>
              <div className='w-2/6 font-semibold text-2xl'><span>Email</span></div>
              <div className='w-2/6 font-semibold text-2xl'><span>Phone Number</span></div>
            </div>
            <table className='flex flex-col w-full'>
              {isClientDataLoaded && isClientImagesLoaded &&
                Object.keys(clientData).map((ownID) => {
                  const clientImageIndex = clientImages.findIndex(obj => obj.imageName === ownID)
                  const imageUrl = clientImages[clientImageIndex].url

                  return (
                    <tr key={ownID} className=''>
                      <div className='flex flex-row w-full py-3 px-2 items-center border-b-2 border-gray-300'>
                        <td className='flex items-center w-2/6 gap-x-5 text-2xl'>
                          {imageUrl &&
                            <Image src={imageUrl} alt='Client Image' width={56} height={56} className='w-[56px] h-[56px] object-cover rounded-2xl' />
                          }                          
                          {!imageUrl &&
                            <ProfilePicture width='56' height='56' fill='black' />
                          }
                          {clientData[ownID].firstName} {clientData[ownID].lastName}
                        </td>
                        <td className='flex items-center w-2/6 text-2xl'>{clientData[ownID].email}</td>
                        <td className='flex items-center w-2/6 text-2xl'>0{clientData[ownID].phoneNumber}</td>
                      </div>
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