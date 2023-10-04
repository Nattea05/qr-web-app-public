'use client'

import { ref as ref_db, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState, useReducer, useMemo, useRef } from 'react'
import { db, auth } from '../../firebaseConfig'
import { useRouter } from "next/navigation";
import Header from './components/header'
import Scheduler, { Editing } from 'devextreme-react/scheduler'
import Popup, { ToolbarItem } from 'devextreme-react/popup';
import 'devextreme/dist/css/dx.light.css'
import useDataFetch from './fetchAppointmentData'
import useTimeSlotsFetch from './fetchTimeSlots'
import Image from "next/image"
import Link from 'next/link';
import moment from 'moment';
import { Calendar, Time } from './images/appointment-form-img/appointment-form-img';

export default function Home() {
  interface UserData {
    email: string,
    password: string
  }

  interface PetData {
    [petID: string]: {
      breed: string,
      name: string,
      sex: string,
      species: string,
    }
  }

  interface Data {
    vetIndex: number
  }

  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const [petData, setPetData] = useState<{ [ownID: string]: PetData }>({})
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)
  const [isPetDataLoaded, setIsPetDataLoaded] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedPet, setSelectedPet] = useState('')
  const currentDate = new Date()
  const [uid, setUid] = useState('')
  const data = useDataFetch(uid) as Data[]
  const [timeSlots, setTimeSlots] = useState([])
  const router = useRouter()
  const initState = {
    popupVisible: false,
    popupTitle: "",
    editData: {}
  }
  const initEmptyState = {
    popupVisible: false,
    popupTitle: "",
    editData: {},
    vetIndex: null
  }
  const [state, dispatch] = useReducer(reducer, initState)
  const [emptyState, emptyDispatch] = useReducer(reducer, initEmptyState)
  const SchedulerRef = useRef(null)

  function reducer(state: any, action: any) {
    return {...state, ...action}
  }

  function onAppointmentFormOpening(e: any) {
    e.cancel = true
    if (e.appointmentData.text) {
      dispatch({ popupVisible: true, editData: {...e.appointmentData} })
    } else {
      emptyDispatch({ popupVisible: true, editData: {...e.appointmentData}, vetIndex: data[0].vetIndex })
    }
  }

  function onHiding(e: any) {
    dispatch({ popupVisible: false })
    emptyDispatch({ popupVisible: false })
  }

  function popupRender() {
    // Serialize object into a JSON string to be passed as a query parameter
    const appointmentDetails = JSON.stringify(state.editData)

    return (
      <div className='flex-1 h-full'>
        <div className='flex w-full h-1/5'>
          <div className='flex w-1/2 h-full'>
            <Image src={state.editData.img} alt="Patient Image" width={100} height={100} className='rounded-full' />
            <div className='flex-1 flex flex-col justify-center pl-2'>
              <span className='text-xl font-bold'>Patient</span>
              <span className='text-base'>{state.editData.patient}</span>
            </div>
          </div>
          <div className='flex w-1/2 h-full'>
            <Image src={state.editData.img} alt="Client Image" width={100} height={100} className='rounded-full' />
            <div className='flex-1 flex flex-col justify-center pl-2'>
              <span className='text-xl font-bold'>Client</span>
              <span className='text-base'>{state.editData.client}</span>
            </div>
          </div>
        </div>
        <hr className='mt-4 border-b-gray-200 border-b-2' />
        <div className='flex w-full h-1/4 justify-evenly'>
          <div className='flex w-1/2 h-full items-center'>
            <Calendar />
            <div className='flex flex-col pl-2'>
              <span className='text-xl font-bold'>Date</span>
              <span className='text-lg'>{moment(state.editData.startDate).format("MMMM Do YYYY")}</span>
            </div>
          </div>
          <div className='flex w-1/2 h-full items-center'>
            <Time />
            <div className='flex flex-col pl-2'>
              <span className='text-xl font-bold'>Time</span>
              <span className='text-lg'>{moment(state.editData.startDate).format("h:mm A")} - {moment(state.editData.endDate).format("h:mm A")}</span>
            </div>
          </div>
        </div>
        <hr className='border-b-gray-300 border-b-2' />
        <div className='flex flex-col mt-3 w-full'>
          <span className='text-2xl font-bold'>Reason</span>
          <p className='text-lg text-left'>
            {state.editData.description}
          </p>
        </div>
        <hr className='mt-4 border-b-gray-300 border-b-2' />
        <div className='flex w-full mt-4 items-center justify-around'>
          <Link href={`./manage-appointment?appointment=${encodeURIComponent(appointmentDetails)}`} className='flex w-52 h-10 justify-center items-center text-base rounded-full bg-petgreen hover:bg-green-600 active:bg-green-700 text-white font-semibold'>Begin Appointment</Link>
          <button onClick={() => console.log("Cancel")} className='w-52 h-10 text-base rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold'>Cancel Appointment</button>
        </div>
      </div>      
    )
  }

  function emptyPopupRender() {
    return (
      <div className='flex-1 h-full'>
        <div className='flex w-full h-1/5'>
          <div className='flex w-1/2 h-full'>
            <Image src="/create-appointment-img/patient.png" alt="Patient Image" width={100} height={100} className='object-scale-down' />
            <div className='flex-1 flex flex-col justify-center'>
              <span className='text-xl font-bold'>Patient</span>
              {selectedClient &&
                <select name="patient" value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} className='h-8 mt-2 pl-2 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis'>
                  {Object.keys(petData).map((ownID) =>
                    ownID === selectedClient ? (
                      Object.keys(petData[ownID]).map((petID) => (
                        <option key={petID} value={petID}>{petData[ownID][petID].name}</option>
                      ))
                    ) : null
                  )}
                </select>
              }
            </div>
          </div>
          <div className='flex w-1/2 h-full'>
            <Image src="/create-appointment-img/client.png" alt="Client Image" width={100} height={100} className='object-scale-down' />
            <div className='flex-1 flex flex-col justify-center'>
              <span className='text-xl font-bold'>Client</span>
              {isUserDataLoaded &&
                <select name="client" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className='h-8 mt-2 pl-2 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis'>
                  <option value="" disabled>Select a client first</option>
                  {Object.keys(userData).map((key) => (
                    <option key={key} value={key}>{userData[key].email}</option>
                  ))}
                </select>
              }
            </div>
          </div>
        </div>
        <hr className='mt-4 border-b-gray-200 border-b-2' />
        <div className='flex w-full h-1/4 justify-evenly'>
          <div className='flex w-1/2 h-full items-center'>
            <Calendar />
            <div className='flex flex-col pl-2'>
              <span className='text-xl font-bold'>Date</span>
              <span className='text-lg'>{moment(emptyState.editData.startDate).format('MMMM Do YYYY')}</span>
            </div>
          </div>
          <div className='flex w-1/2 h-full items-center'>
            <Time />
            <div className='flex flex-col pl-2'>
              <span className='text-xl font-bold'>Time</span>
              <span className='text-lg'>dropdown</span>
            </div>
          </div>
        </div>
        <hr className='border-b-gray-300 border-b-2' />
        <div className='flex flex-col mt-3 w-full'>
          <span className='text-2xl font-bold'>Reason</span>
          <p className='text-lg text-left'>
            textarea
          </p>
        </div>
        <hr className='mt-4 border-b-gray-300 border-b-2' />
        <div className='flex w-full mt-4 items-center justify-around'>
          <button className='flex w-52 h-10 justify-center items-center text-base rounded-full bg-petgreen hover:bg-green-600 active:bg-green-700 text-white font-semibold'>Create Appointment</button>
        </div>
      </div>     
    )
  }

  useEffect(() => {
    if (emptyState.popupVisible) {
      
    }
  }, [emptyState])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        router.push("/login")
      }
    })

    const userRef = ref_db(db, "users")
    const petRef = ref_db(db, "pets")

    const userListener = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      setUserData(data)
      setIsUserDataLoaded(true)
    })

    const petListener = onValue(petRef, (snapshot) => {
      const data = snapshot.val()
      setPetData(data)
      setIsPetDataLoaded(true)
    })    

    return () => {
      userListener()
      petListener()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
  }, [isUserDataLoaded, isPetDataLoaded])

  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <Scheduler
        ref={SchedulerRef}
        onAppointmentFormOpening={onAppointmentFormOpening}
        timeZone="Asia/Singapore"
        dataSource={data}
        views={['day', 'week', 'workWeek', 'month', 'timelineDay']}
        defaultCurrentView="day"
        defaultCurrentDate={currentDate}
        startDayHour={8}
        className='h-full w-10 ml-72 flex-auto overflow-auto'
      >
        <Editing allowResizing={false} allowDragging={false} />
      </Scheduler>
      <Popup
        visible={state.popupVisible}
        width={500}
        hideOnOutsideClick={true}
        onHiding={onHiding}
        title={state.editData.text}
        contentRender={popupRender}
      >
      </Popup>
      <Popup
        visible={emptyState.popupVisible}
        width={500}
        hideOnOutsideClick={true}
        onHiding={onHiding}
        title="Create an Appointment"
        contentRender={emptyPopupRender}
      >
      </Popup>
    </main>
  )
}