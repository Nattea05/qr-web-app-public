import { useState, useEffect } from "react";
import { ref as ref_db, onValue} from "firebase/database";
import { db } from "../../firebaseConfig";

export default function useDataFetch() {
    const [appointmentData, setAppointmentData] = useState([])
    const [formattedData, setFormattedData] = useState([])
    const [isDataFetched, setIsDataFetched] = useState(false)

    useEffect(() => {
        const appointmentRef = ref_db(db, "appointments")
        const valueListener = onValue(appointmentRef, (snapshot) => {
            const data = snapshot.val()
            setAppointmentData(Object.keys(data).map((key) => data[key]))
            setIsDataFetched(true)
        })

        return () => {
            valueListener()
        }
    }, [])

    useEffect(() => {
        if (isDataFetched) {
            setFormattedData(appointmentData.map((item, index) => ({
                text: `Appointment ${index}`,
                startDate: new Date(`${item.date}T${item.time}:00.000+0800`),
                description: item.reason
            })))
        }
    }, [appointmentData, isDataFetched])

    return formattedData
}