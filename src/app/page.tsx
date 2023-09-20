'use client'

import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../../firebaseConfig'
import { useRouter } from "next/navigation";
import Header from './components/header'
import Scheduler from 'devextreme-react/scheduler'
import 'devextreme/dist/css/dx.light.css'
import useDataFetch from './fetchAppointmentData'

export default function Home() {
  const currentDate = new Date()
  const data = useDataFetch()
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

    return () => unsubscribe()
  }, [])

  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <Scheduler
        timeZone="Asia/Singapore"
        dataSource={data}
        views={['day', 'week', 'workWeek', 'month', 'timelineDay']}
        defaultCurrentView="day"
        defaultCurrentDate={currentDate}
        startDayHour={8}
        className='h-full w-10 flex-auto overflow-auto'
        />
    </main>
  )
}