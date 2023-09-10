'use client'

import Header from './components/header'
import Scheduler from 'devextreme-react/scheduler'
import 'devextreme/dist/css/dx.light.css'
import useDataFetch from './fetchAppointmentData'

export default function Home() {
  const currentDate = new Date()
  const data = useDataFetch()

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