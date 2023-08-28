'use client'

import Header from './components/header'
import Scheduler from 'devextreme-react/scheduler'
import 'devextreme/dist/css/dx.light.css'
import { data } from './data.js'

const currentDate = new Date(2021, 3, 29)

export default function Home() {
  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <Scheduler
        timeZone="America/Los_Angeles"
        dataSource={data}
        views={['day', 'week', 'workWeek', 'month', 'timelineDay']}
        defaultCurrentView="day"
        defaultCurrentDate={currentDate}
        startDayHour={9}
        className='h-full w-10 flex-auto overflow-auto'
        />
    </main>
  )
}