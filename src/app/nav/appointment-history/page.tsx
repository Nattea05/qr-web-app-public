'use client'

import { ref as ref_db, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { db, auth } from '../../../../firebaseConfig'
import Link from 'next/link'
import Header from '../../components/header'
import moment from 'moment'

export default function AppointmentHistory() {
  interface UserData {
    email: string,
    password: string,
    vetIndex: number
  }

  const [vetIndex, setVetIndex] = useState(-1)
  const [userData, setUserData] = useState<UserData>()
  const [appointmentHistory, setAppointmentHistory] = useState<Record<string, any>>({})
  const [emrHistory, setEmrHistory] = useState<Record<string, any>>({})
  const [clientList, setClientList] = useState<Map<string, any>>(new Map<string, any>())
  const [petList, setPetList] = useState<Map<string, any>>(new Map<string, any>())
  const [isAppointmentHistoryLoaded, setIsAppointmentHistoryLoaded] = useState(false)
  const [isEmrHistoryLoaded, setIsEmrHistoryLoaded] = useState(false)
  const [isClientListLoaded, setIsClientListLoaded] = useState(false)
  const [isPetListLoaded, setIsPetListLoaded] = useState(false)
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
    if (uid) {
      const userRef = ref_db(db, "users/" + uid)
      const userListener = onValue(userRef, (snapshot) => {
        const data = snapshot.val()
        setUserData(data)
        setVetIndex(data.vetIndex)
      })

      return (() => {userListener()})
    }
  }, [uid])

  useEffect(() => {
    if (vetIndex !== -1) {
      const appointmentHistoryRef = ref_db(db, "appointment_history")
      const appointmentHistoryListener = onValue(appointmentHistoryRef, (snapshot) => {
        const data = snapshot.val()
        Object.keys(data).filter(key => data[key].vetIndex === vetIndex).map((key) => {
          setAppointmentHistory((prevState) => ({
            ...prevState,
            [key]: data[key]
          }))
        })
        setIsAppointmentHistoryLoaded(true)
      })

      return (() => {appointmentHistoryListener()})
    }
  }, [vetIndex])

  useEffect(() => {
    if (isAppointmentHistoryLoaded) {
      const emrRef = ref_db(db, "emr_list")
      const emrListener = onValue(emrRef, (snapshot) => {
        const data = snapshot.val()
        Object.keys(data).filter(key => Object.keys(appointmentHistory).includes(key)).map((key) => {
          setEmrHistory((prevState) => ({
            ...prevState,
            [key]: data[key]
          }))
        })
        setIsEmrHistoryLoaded(true)
      })

      return (() => {emrListener()})
    }
  }, [isAppointmentHistoryLoaded])

  useEffect(() => {
    if (isEmrHistoryLoaded) {
      const appointmentClientIds = new Set(Object.keys(appointmentHistory).filter(key => appointmentHistory[key].vetIndex === vetIndex).map(key => appointmentHistory[key].ownID))
      const appointmentPetIds = new Set(Object.keys(appointmentHistory).filter(key => appointmentHistory[key].vetIndex === vetIndex).map(key => appointmentHistory[key].petID))

      const clientsRef = ref_db(db, "users")
      const clientsListener = onValue(clientsRef, (snapshot) => {
        const data = snapshot.val()
        const filteredData = Object.keys(data).filter(key => appointmentClientIds.has(key)).map(key => ({[key]: data[key]}))
        filteredData.forEach(client => Object.keys(client).map((clientID) => {
          setClientList((prevState) => prevState.set(clientID, client[clientID]))
        }))
        setIsClientListLoaded(true)
      })

      const petsRef = ref_db(db, "pets")
      const petsListener = onValue(petsRef, (snapshot) => {
        const data = snapshot.val()
        const filteredData = Object.keys(data).filter(ownID => appointmentClientIds.has(ownID)).map((ownID) => {
          const pets = data[ownID]
          return Object.keys(pets).filter(petID => appointmentPetIds.has(petID)).map(petID => ({[petID]: pets[petID]}))
        })
        filteredData.forEach(pets => pets.forEach(pet => {
          Object.keys(pet).map(petID => {
            setPetList((prevState) => prevState.set(petID, pet[petID]))
          })
        }))
        setIsPetListLoaded(true)
      })

      return (() => {
        clientsListener()
        petsListener()
      })
    }
  }, [isEmrHistoryLoaded])

  useEffect(() => {
    if (isClientListLoaded && isPetListLoaded) {
      // console.log(clientList)
      // console.log(petList)
    }
  }, [isClientListLoaded, isPetListLoaded])

  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <div className="flex-1 flex flex-col p-5 items-center gap-y-5 ml-72 overflow-y-scroll">
        <span className='font-semibold text-4xl self-start ml-3'>Appointment History</span>
        <div className='flex-1 flex flex-col w-full max-h-[640px] p-6 overflow-y-scroll items-center rounded-3xl border-2 border-gray-300'>
          <div className='flex flex-row w-full px-2 items-center border-b-4 border-black'>
            <div className='w-4/12 font-semibold text-2xl'><span>Date</span></div>
            <div className='w-3/12 font-semibold text-2xl'><span>Patient</span></div>
            <div className='w-3/12 font-semibold text-2xl'><span>Client</span></div>
            <div className='w-2/12 font-semibold text-2xl'><span>Reason</span></div>
          </div>
          <table className='flex flex-col w-full gap-y-5'>
            {isClientListLoaded && isPetListLoaded &&
              Object.keys(appointmentHistory).map((appID) => {
                const ownID = appointmentHistory[appID].ownID
                const petID = appointmentHistory[appID].petID

                return (
                  <tr key={appID}>
                    <Link href={`/nav/patient/patient-details/emr-history/emr-details?emrDetails=${encodeURIComponent(JSON.stringify({[appID]: emrHistory[appID], ownID: ownID}))}`} className='flex flex-row w-full py-3 px-2 items-center border-b-2 border-gray-300'>
                      <td className='flex items-center w-4/12 gap-x-5 text-2xl'>{moment(appointmentHistory[appID].date).format("Do MMMM YYYY")}, {moment(appointmentHistory[appID].time, "HH:mm").format("h:mm A")}</td>
                      <td className='flex items-center w-3/12 text-2xl'>{petList.get(petID).name}</td>
                      <td className='flex items-center w-3/12 text-2xl'>{clientList.get(ownID).firstName} {clientList.get(ownID).lastName}</td>
                      <td className='flex items-center w-2/12 max-w-[185px] max-h-[34px] truncate text-2xl'>{appointmentHistory[appID].reason}</td>
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