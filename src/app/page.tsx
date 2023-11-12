'use client'

import { ref as ref_db, onValue, set, remove } from 'firebase/database'
import { Unsubscribe, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState, useReducer, useRef } from 'react'
import { db, auth } from '../../firebaseConfig'
import { useRouter } from "next/navigation";
import Header from './components/header'
import Scheduler, { Editing } from 'devextreme-react/scheduler'
import Popup from 'devextreme-react/popup';
import 'devextreme/dist/css/dx.light.css'
import useDataFetch from './fetchAppointmentData'
import createTimeSlots from './fetchTimeSlots'
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
      age: string,
      breed: string,
      conditions: string,
      name: string,
      sex: string,
      species: string,
    }
  }

  interface Data {
    vetIndex: number
  }

  type newData = {
    selectedClient: string,
    selectedPet: string,
    selectedDate: string,
    selectedTime: string,
    reason: string,
    [key: string]: any
  }

  const [slots, setSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<any[]>([])
  const [bookedSlotsSet, setBookedSlotsSet] = useState(new Set<any>(bookedSlots))
  const [isSlotsFetched, setIsSlotsFetched] = useState(false)
  const [isSlotsLoaded, setIsSlotsLoaded] = useState(false)
  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const [petData, setPetData] = useState<{ [ownID: string]: PetData }>({})
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)
  const [isPetDataLoaded, setIsPetDataLoaded] = useState(false)
  const [newAppointmentData, setNewAppointmentData] = useState<newData>({
    selectedClient: '',
    selectedPet: '',
    selectedDate: '',
    selectedTime: '',
    reason: ''
  })
  const currentDate = new Date()
  const [uid, setUid] = useState('')
  const [data, vetIndex] = useDataFetch(uid) as [Data[], number]
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
    vetIndex: 9999
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
      emptyDispatch({ popupVisible: true, editData: {...e.appointmentData}, vetIndex: vetIndex })
    }
  }

  function onHiding() {
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
            <Image src={state.editData.patientImg} alt="Patient Image" width={100} height={100} className='rounded-full' />
            <div className='flex-1 flex flex-col justify-center pl-2'>
              <span className='text-xl font-bold'>Patient</span>
              <span className='text-base'>{state.editData.patient}</span>
            </div>
          </div>
          <div className='flex w-1/2 h-full'>
            <Image src={state.editData.clientImg} alt="Client Image" width={100} height={100} className='rounded-full' />
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
          <button onClick={() => handleCancelAppointment(state.editData.appointmentID)} className='w-52 h-10 text-base rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold'>Cancel Appointment</button>
        </div>
      </div>      
    )
  }

  function emptyPopupRender() {
    function handleSelection(e: any) {
      const { name, value } = e.target
      setNewAppointmentData((prevState) => ({
        ...prevState,
        [name]: value
      }))
    }

    return (
      <div className='flex-1 h-full'>
        <div className='flex w-full h-1/5'>
          <div className='flex w-1/2 h-full'>
            <Image src="/create-appointment-img/patient.png" alt="Patient Image" width={100} height={100} className='object-scale-down' />
            <div className='flex-1 flex flex-col justify-center'>
              <span className='text-xl font-bold'>Patient</span>
              {newAppointmentData.selectedClient &&
                <select name="selectedPet" value={newAppointmentData.selectedPet} onChange={(e) => handleSelection(e)} className='h-8 mt-2 pl-2 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis'>
                  <option value="" disabled>Select a pet</option>
                  {Object.keys(petData).map((ownID) =>
                    ownID === newAppointmentData.selectedClient ? (
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
                <select name="selectedClient" value={newAppointmentData.selectedClient} onChange={(e) => handleSelection(e)} className='h-8 mt-2 pl-2 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis'>
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
              {isSlotsLoaded &&
                <select name="selectedTime" value={newAppointmentData.selectedTime} onChange={(e) => handleSelection(e)} className='h-8 mt-2 pl-2 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis'>
                  <option value="" disabled>Select a date</option>
                  {Array.from(slots).map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              }
            </div>
          </div>
        </div>
        <hr className='border-b-gray-300 border-b-2' />
        <div className='flex flex-col mt-3 w-full'>
          <span className='text-2xl font-bold'>Reason</span>
          <textarea
            name='reason'
            placeholder="Enter appointment reason"
            value={newAppointmentData.reason}
            onChange={(e) => handleSelection(e)}
            className="w-full h-2/6 mt-3 p-4 self-center rounded-3xl border-2 border-gray-300"
          />
        </div>
        <hr className='mt-4 border-b-gray-300 border-b-2' />
        <div className='flex w-full mt-4 items-center justify-around'>
          <button onClick={handleCreateAppointment} className='flex w-52 h-10 justify-center items-center text-base rounded-full bg-petgreen hover:bg-green-600 active:bg-green-700 text-white font-semibold'>Create Appointment</button>
        </div>
      </div>     
    )
  }

  function handleCreateAppointment() {
    const vetIndex = emptyState.vetIndex
    const formattedTime = newAppointmentData.selectedTime.replace(/:/g, "")
    const formattedDate = newAppointmentData.selectedDate.replace(/-/g, "")
    const newAppointmentRef = ref_db(db, "appointments/" + newAppointmentData.selectedClient.slice(0, 5) + formattedDate + formattedTime + "vet" + vetIndex + "/")

    let hasEmptyFields = true
    Object.keys(newAppointmentData).forEach((key) => {
      if (typeof newAppointmentData[key] === 'string' && newAppointmentData[key].trim() === '') {
        hasEmptyFields = false
      }
    })

    if (hasEmptyFields) {
      set(newAppointmentRef, {
        date: newAppointmentData.selectedDate,
        ownID: newAppointmentData.selectedClient,
        petID: newAppointmentData.selectedPet,
        reason: newAppointmentData.reason,
        time: newAppointmentData.selectedTime,
        vetIndex: vetIndex
      })
  
      onHiding()
      location.reload()
    } else {
      alert("You have left some fields missing, please ensure all fields are filled with the necessary information before submitting.")
    }
  }

  function handleCancelAppointment(id: string) {
    const cancelAppointmentRef = ref_db(db, "appointments/" + id)
    remove(cancelAppointmentRef)
    location.reload()
  }

  useEffect(() => {
    let valueListener: Unsubscribe

    if (emptyState.popupVisible) {
      setNewAppointmentData((prevState) => ({
        ...prevState,
        selectedDate: moment(emptyState.editData.startDate).format('YYYY-MM-DD')
      }))
      const appointmentsRef = ref_db(db, "appointments")
      valueListener = onValue(appointmentsRef, (snapshot) => {
        const data = snapshot.val()
        const timeSlots = Object.keys(data)
          .filter((key) => key.slice(-1) === emptyState.vetIndex.toString() && data[key].date === moment(emptyState.editData.startDate).format("YYYY-MM-DD"))
          .map((key) => data[key].time);
        let updatedBookedSlots = [...bookedSlots, ...timeSlots]
        const updatedSet = new Set<any>(updatedBookedSlots)
        bookedSlotsSet.clear()
        updatedSet.forEach((item) => setBookedSlotsSet((prev) => prev.add(item)))
        setIsSlotsFetched(true)
      })
    } else {
      setIsSlotsLoaded(false)
    }
    
    return () => {
      valueListener
    }
  }, [emptyState.popupVisible])

  useEffect(() => {
    if (isSlotsFetched) {
      setSlots(createTimeSlots('08:00', '22:00', bookedSlotsSet, emptyState.editData.startDate))
      setIsSlotsFetched(false)
      setIsSlotsLoaded(true)
    }
  }, [isSlotsFetched])

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
        defaultCurrentView="month"
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