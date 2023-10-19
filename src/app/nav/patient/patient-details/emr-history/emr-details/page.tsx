'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from "next/navigation"
import { ref as ref_db, onValue } from 'firebase/database'
import { ref as ref_storage, getDownloadURL, getMetadata, listAll } from 'firebase/storage';
import { db, storage } from '../../../../../../../firebaseConfig'
import Header from '../../../../../components/header'
import moment from 'moment-timezone'
import Image from "next/image";

export default function EmrDetails() {
    interface AppointmentData {
        date: string,
        ownID: string,
        petID: string,
        reason: string,
        time: string,
        vetIndex: number
    }

    const searchParams = useSearchParams()
    const emrDetailsString = searchParams.get('emrDetails') || '{}'
    const emrDetails = emrDetailsString ? JSON.parse(emrDetailsString) : {}
    const ownID = emrDetails["ownID"]
    const emrID = Object.keys(emrDetails)[0]
    const date = emrID.substring(5, 13)
    const time = emrID.match(/(\d{2})(\d{2})vet/)
    const [petData, setPetData] = useState({})
    const [petImage, setPetImage] = useState('')
    const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null)
    const [isPetDataLoaded, setIsPetDataLoaded] = useState(false)
    const [isPetImageLoaded, setIsPetImageLoaded] = useState(false)
    const [isAppointmentDataLoaded, setIsAppointmentDataLoaded] = useState(false)

    function capitalizeWords(str: string) {
        return str.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    useEffect(() => {
        const petRef = ref_db(db, "pets/" + ownID)
        const petListener = onValue(petRef, (snapshot) => {
            const data = snapshot.val()
            Object.keys(data)
                .filter(key => key === emrDetails[emrID].patientID)
                .map(key => setPetData(data[key]))
            setIsPetDataLoaded(true)
        })

        const appointmentRef = ref_db(db, "appointment_history/" + emrID)
        const appointmentListener = onValue(appointmentRef, (snapshot) => {
            const data = snapshot.val()
            setAppointmentData(data)
            setIsAppointmentDataLoaded(true)
        })

        const petImageRef = ref_storage(storage, "pet-profile-pictures/" + ownID)
        listAll(petImageRef)
            .then((res) => {
                const promises = res.items.map(async (itemRef) => {
                    const metadataPromise = getMetadata(itemRef);
                    const downloadURLPromise = getDownloadURL(itemRef);
                    try {
                        const [metadata, url] = await Promise.all([metadataPromise, downloadURLPromise]);
                        if (metadata.name === emrDetails[emrID].patientID) {
                            setPetImage(url);
                        }
                    } catch (error) {
                        console.error("Error received: ", error);
                    }
                });
                Promise.all(promises)
                    .then(() => {
                        setIsPetImageLoaded(true);
                    })
                    .catch((error) => {
                        console.error("Error received: ", error)
                    })
            })
            .catch((error) => {
                console.error("Error received: ", error)
            })

        return () => {
            petListener()
            appointmentListener()
        }
    }, [])

    useEffect(() => {
        if (isPetDataLoaded && isPetImageLoaded && isAppointmentDataLoaded) {
            
        }
    }, [isPetDataLoaded, isPetImageLoaded, isAppointmentDataLoaded])

    return (
        <main className='flex w-screen h-max'>
            <Header />
            <div className="flex-1 flex flex-col items-center pb-6 ml-72">
                <div className="flex py-5 w-11/12 h-16 gap-10 justify-center items-center">
                    <span className="text-3xl font-semibold">Completed Appointment</span>
                    <span className="text-3xl font-light">{moment(date, "YYYYMMDD").format("MMMM Do YYYY")}</span>
                    <span className="text-3xl font-light">{moment(time, "HHmm").format("h:mm A")}</span>
                </div>
                <div className="flex w-11/12 h-fit py-4 rounded-3xl border-2 border-gray-300">
                    <div className="flex flex-col w-1/2 h-full px-5">
                        <span className="text-5xl font-light text-gray-400">Patient</span>
                        <div className="flex-1 flex flex-row pt-3 items-center">
                            <Image src={petImage} alt="Patient Image" width={130} height={130} className="rounded-full" />
                            <span className="ml-3 text-4xl font-medium">{emrDetails[emrID].patientID.slice(5)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col w-1/2 h-full px-5">
                        <span className="text-5xl font-light text-gray-400">Client</span>
                        <div className="flex-1 flex flex-row pt-3 items-center">
                            <Image src={petImage} alt="Patient Image" width={130} height={130} className="rounded-full" />
                            <span className="ml-3 text-4xl font-medium">Client Name</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row justify-between mt-4 w-11/12 h-fit">
                    <div className="py-3 w-2/5 h-full rounded-3xl border-2 border-gray-300">
                        <span className="ml-5 text-3xl font-semibold">General Info</span>
                        <div className="flex flex-row py-3 w-full h-5/6">
                            <ul className="flex flex-col px-5 w-1/3 h-full gap-3 justify-evenly">
                                <li>Species</li>
                                <li>Breed</li>
                                <li>Sex</li>
                                <li>Date of Birth</li>
                                <li>Weight</li>
                            </ul>
                            <ul className="flex flex-col w-2/3 h-full gap-3 justify-evenly font-semibold">
                                <li>Placeholder</li>
                                <li>Placeholder</li>
                                <li>Placeholder</li>
                                <li>Placeholder</li>
                                <li>Placeholder</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col py-3 w-7/12 h-full rounded-3xl border-2 border-gray-300">
                        <span className="ml-5 text-3xl font-semibold">Visit Reason</span>
                        <p className="mt-2 w-11/12 h-5/6 max-h-[161px] self-center text-base overflow-scroll">
                            {appointmentData?.reason}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col py-3 mt-4 w-11/12 rounded-3xl border-2 border-gray-300">
                    <span className="ml-5 text-3xl font-semibold">Diagnosis</span>
                    <div className="flex flex-col w-full h-56 mt-2">
                        <span className="ml-5 text-2xl font-semibold text-gray-400">Subjective</span>
                        <p placeholder="Enter observation notes" className="w-[96%] h-5/6 mt-3 p-4 self-center rounded-3xl border-2 border-gray-300" >
                            {emrDetails[emrID].subjective ? emrDetails[emrID].subjective : "No subjective information was written."}
                        </p>
                    </div>
                    <div className="flex flex-col w-full h-fit mt-3">
                        <div className="flex flex-row w-full h-fit items-center">
                            <span className="ml-5 text-2xl font-semibold text-gray-400">Objective</span>
                        </div>
                        <div className="flex flex-row mt-5 w-full max-w-[1095px] h-full overflow-scroll self-center">
                                {!emrDetails[emrID].objective &&
                                    <span>No objective information was written.</span>
                                }
                                {emrDetails[emrID].objective && emrDetails[emrID].objective.vitals &&
                                    <div className="flex flex-col ml-5 py-3 px-2 w-1/3 min-w-[359px] h-full rounded-3xl border-2 border-gray-300">
                                        <div className="flex flex-row pl-3 w-full h-56 max-h-56 justify-center">
                                            <ul className="flex flex-col w-1/3 h-full justify-evenly font-medium">
                                                {Object.keys(emrDetails[emrID].objective.vitals).map(field => {
                                                    const formattedField = capitalizeWords(field)
                                                    return (
                                                        <li key={field}>{formattedField}</li>
                                                    )
                                                })}
                                            </ul>
                                            <ul className="flex flex-col pl-8 w-3/12 h-full justify-evenly text-lg font-medium">
                                                {Object.keys(emrDetails[emrID].objective.vitals).map(field => {
                                                    return (
                                                        <li key={field}>{emrDetails[emrID].objective.vitals[field]}</li>
                                                    )
                                                })}
                                            </ul>
                                            <ul className="flex flex-col pl-3 w-1/3 h-full justify-evenly font-medium">
                                                <li>Bpm</li>
                                                <li>Bpm</li>
                                                <li>°C</li>
                                                <li>kg</li>
                                            </ul>
                                        </div>                                               
                                    </div>
                                }
                                {emrDetails[emrID].objective && emrDetails[emrID].objective.candh &&
                                    <div className="flex flex-col ml-5 py-3 px-2 w-1/3 min-w-[359px] h-full rounded-3xl border-2 border-gray-300">
                                        <div className="flex flex-row w-full h-56 max-h-56">
                                            <ul className="flex flex-col w-2/3 h-full justify-evenly text-sm font-medium">
                                                {Object.keys(emrDetails[emrID].objective.candh).map(field => {
                                                    const formattedField =
                                                        field === "crt" ? `Capillary Refill Time` :
                                                        field === "ha" ? `Hydration Assessment` :
                                                        field === "mmc" ? `Mucous Membrane Colour` :
                                                        ""
                                                    return (
                                                        <li key={field}>{formattedField}</li>
                                                    )
                                                })}
                                            </ul>
                                            <ul className="flex flex-col w-3/12 h-full justify-evenly items-center text-lg font-medium">
                                                {Object.keys(emrDetails[emrID].objective.candh).map(field => {
                                                    return (
                                                        <li key={field} className='pb-2.5'>{emrDetails[emrID].objective.candh[field]}</li>
                                                    )
                                                })}
                                            </ul>
                                            <ul className="flex flex-col w-1/3 h-full gap-7 justify-evenly items-center font-medium">
                                                <li>seconds</li>
                                                <li></li>
                                                <li></li>
                                            </ul>
                                        </div>                                               
                                    </div>
                                }
                        </div>
                    </div>                    
                    <div className="flex flex-col w-full h-56 mt-2">
                        <span className="ml-5 text-2xl font-semibold text-gray-400">Assessment</span>
                        <p placeholder="Enter observation notes" className="w-[96%] h-5/6 mt-3 p-4 self-center rounded-3xl border-2 border-gray-300" >
                            {emrDetails[emrID].assessment ? emrDetails[emrID].assessment : "No assessment information was written."}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}