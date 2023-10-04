'use client'

import React, { ReactElement, useState } from "react";
import Header from "../components/header"
import moment from 'moment';
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation"
import { ref as ref_db, set, remove } from "firebase/database";
import { db } from "../../../firebaseConfig";
import { v4 as uuid } from "uuid";

export default function ManageAppointment() {
    const searchParams = useSearchParams()
    const appointmentDetailsString = searchParams.get('appointment') || '{}'
    const appointmentDetails = appointmentDetailsString ? JSON.parse(appointmentDetailsString) : {}
    const router = useRouter()
    const [children, setChildren] = useState<ReactElement[]>([])
    const [diagnosisData, setDiagnosisData] = useState({
        appointmentID: '',
        subjective: '',
        objective: {},
        assessment: ''
    })

    function addChild() {
        const uniqueKey = uuid()
        setChildren((prevChildren) => [
            ...prevChildren,
            <ObjectivesChild key={uniqueKey} onDelete={removeChild} />
        ]);
    }

    function removeChild(indexToRemove: number) {
        setChildren((prevChildren) =>
            prevChildren.filter((_, index) => index !== indexToRemove)
        );
    }

    function ObjectivesChild({ onDelete }: any) {
        const [objectivesData, setObjectivesData] = useState({
            objectives: {
                vitals: {
                    heartRate: '',
                    respiration: '',
                    temperature: '',
                    weight: '',
                },
                candh: {
                    mmc: 'Pink',
                    crt: '',
                    ha: '',
                },
            },
        })

        function handleInputChange(e: any, category: 'vitals' | 'candh', field: string) {
            const newValue = e.target.value;

            setObjectivesData((prevState) => ({
              objectives: {
                ...prevState.objectives,
                [category]: {
                  ...prevState.objectives[category],
                  [field]: newValue,
                },
              },
            }));
        }   

        const [selectedItem, setSelectedItem] = useState('vitals')
        function handleSelectChange(e: any) {
            setSelectedItem(e.target.value)
        }

        return (
            <div className="flex flex-col ml-5 py-3 px-2 w-1/3 min-w-[359px] h-full rounded-3xl border-2 border-gray-300">
                <div className="flex flex-row w-full h-fit">
                    <select name="objectiveCategories" onChange={handleSelectChange} value={selectedItem} className="pl-3 ml-3 w-1/2 h-10 bg-white border-2 border-gray-300 rounded-full overflow-ellipsis">
                        <option value="vitals" className="font-sans">Vitals</option>
                        <option value="candh" className="font-sans">Circulation and Hydration</option>
                    </select>
                    <button onClick={onDelete} className="ml-32 self-center text-2xl text-gray-400">X</button>
                </div>
                <div className="flex flex-row pl-3 w-full h-60">
                    {selectedItem === "vitals" &&
                        <div className="flex flex-row w-full h-full">
                            <ul className="flex flex-col w-1/3 h-full justify-evenly font-medium">
                                <li>Heart Rate</li>
                                <li>Respiration</li>
                                <li>Temperature</li>
                                <li>Weight</li>
                            </ul>
                            <ul id="vitals" className="flex flex-col pl-3 w-3/6 h-full justify-evenly font-medium">
                                <li><input name="heartRate" value={objectivesData.objectives.vitals.heartRate} onChange={(e) => handleInputChange(e, 'vitals', 'heartRate')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                                <li><input name="respiration" value={objectivesData.objectives.vitals.respiration} onChange={(e) => handleInputChange(e, 'vitals', 'respiration')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                                <li><input name="temperature" value={objectivesData.objectives.vitals.temperature} onChange={(e) => handleInputChange(e, 'vitals', 'temperature')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                                <li><input name="weight" value={objectivesData.objectives.vitals.weight} onChange={(e) => handleInputChange(e, 'vitals', 'weight')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                            </ul>
                            <ul className="flex flex-col pl-3 w-1/3 h-full justify-evenly font-medium">
                                <li>Bpm</li>
                                <li>Bpm</li>
                                <li>°C</li>
                                <li>kg</li>
                            </ul>
                        </div>
                    }
                    {selectedItem === "candh" &&
                        <div className="flex flex-row w-full h-full">
                            <ul className="flex flex-col w-2/3 h-full justify-evenly text-sm font-medium">
                                <li>Mucous Membrane Colour</li>
                                <li>Capillary Refill Time</li>
                                <li>Hydration Assessment</li>
                            </ul>
                            <ul id="candh" className="flex flex-col pl-3 w-3/6 h-full justify-evenly font-medium">
                                <li>
                                    <select name="mmc" value={objectivesData.objectives.candh.mmc} onChange={(e) => handleInputChange(e, 'candh', 'mmc')} className="pl-3 w-full h-9 rounded-lg border-2 border-gray-300 bg-white overflow-ellipsis">
                                        <option value="Pink" className="font-sans">Pink</option>
                                        <option value="Pale" className="font-sans">Pale</option>
                                        <option value="Bluish" className="font-sans">Bluish</option>
                                        <option value="White" className="font-sans">White</option>
                                        <option value="Overly red" className="font-sans">Overly red</option>
                                    </select>
                                </li>
                                <li><input name="crt" value={objectivesData.objectives.candh.crt} onChange={(e) => handleInputChange(e, 'candh', 'crt')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                                <li><input name="ha" value={objectivesData.objectives.candh.ha} onChange={(e) => handleInputChange(e, 'candh', 'ha')} type="text" className="w-full h-9 rounded-lg border-2 border-gray-300"/></li>
                            </ul>
                            <ul className="flex flex-col pl-3 w-1/3 h-full justify-evenly font-medium">
                                <li></li>
                                <li>Seconds</li>
                                <li></li>
                            </ul>
                        </div>
                    }                    
                </div>
            </div>
        )
    }

    function handleTextAreaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const { name, value } = e.target
        setDiagnosisData((prevState) => ({
            ...prevState,
            [name]: value
        }))
    }    

    function handleCompletion() {
        const selectElements = document.querySelectorAll('select[name="objectiveCategories"]')
        const selectValues: string[] = []
        function hasDuplicates(arr: string[]) {
            const set = new Set(arr)
            return set.size !== arr.length
        }
        selectElements.forEach((select) => {
            const selectElement = select as HTMLSelectElement
            selectValues.push(selectElement.value)
        })

        const appointmentRef = ref_db(db, "appointments/" + appointmentDetails.appointmentID)
        const emrRef = ref_db(db, "emr_list/" + appointmentDetails.appointmentID + "/")
        const vitalsInputs = document.getElementById('vitals')?.querySelectorAll('input')
        const candhInputs = document.getElementById('candh')?.querySelectorAll('input, select')
        const maxLength = Math.max(
            vitalsInputs ? vitalsInputs.length : 0,
            candhInputs ? candhInputs.length : 0)
        const updatedData = {...diagnosisData}

        for (let i = 0; i < maxLength; i++) {
            if (vitalsInputs && vitalsInputs[i]) {
                const fieldName = vitalsInputs[i].name
                updatedData.objective = {
                    ...updatedData.objective,
                    [fieldName]: vitalsInputs[i].value
                }
            }

            if (candhInputs && candhInputs[i]) {
                const element = candhInputs[i] as HTMLInputElement | HTMLSelectElement
                const fieldName = element.name
                updatedData.objective = {
                    ...updatedData.objective,
                    [fieldName]: element.value
                }
            }
        }
        
        if (hasDuplicates(selectValues)) {
            alert("You have duplicate objective categories; please avoid having multiple identical categories at any given moment.")
        } else {
            set(emrRef, {
                patientID: appointmentDetails.patientID,
                subjective: updatedData.subjective,
                assessment: updatedData.assessment,
                objective: updatedData.objective
            })
            remove(appointmentRef)
            router.replace("../")
        }
    }

    return (
        <main className='flex w-screen h-max'>
            <Header />
            <div className="flex-1 flex flex-col items-center ml-72">
                <div className="flex py-5 w-11/12 h-16 justify-around items-center">
                    <span className="text-3xl font-semibold">Manage Appointment</span>
                    <span className="text-3xl font-light">{moment(appointmentDetails.startDate).format("MMMM Do YYYY")}</span>
                    <span className="text-3xl font-light">{moment(appointmentDetails.startDate).format("h:mm A")} - {moment(appointmentDetails.endDate).format("h:mm A")}</span>
                </div>
                <div className="flex w-11/12 h-1/3 py-4 rounded-3xl border-2 border-gray-300">
                    <div className="flex flex-col w-1/2 h-full px-5">
                        <span className="text-5xl font-light text-gray-400">Patient</span>
                        <div className="flex-1 flex flex-row pt-3 items-center">
                            <Image src={appointmentDetails.img} alt="Patient Image" width={130} height={130} className="rounded-full" />
                            <span className="ml-3 text-4xl font-medium">{appointmentDetails.patient}</span>
                        </div>
                    </div>
                    <div className="flex flex-col w-1/2 h-full px-5">
                        <span className="text-5xl font-light text-gray-400">Client</span>
                        <div className="flex-1 flex flex-row pt-3 items-center">
                            <Image src={appointmentDetails.img} alt="Patient Image" width={130} height={130} className="rounded-full" />
                            <span className="ml-3 text-4xl font-medium">{appointmentDetails.client}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row justify-between mt-4 w-11/12 h-1/3">
                    <div className="py-3 w-2/5 h-full rounded-3xl border-2 border-gray-300">
                        <span className="ml-5 text-3xl font-semibold">General Info</span>
                        <div className="flex flex-row w-full h-5/6">
                            <ul className="flex flex-col px-5 w-1/3 h-full justify-evenly">
                                <li>Species</li>
                                <li>Breed</li>
                                <li>Sex</li>
                                <li>Date of Birth</li>
                                <li>Weight</li>
                            </ul>
                            <ul className="flex flex-col w-2/3 h-full justify-evenly font-semibold">
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
                            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quibusdam dicta, sunt rerum unde quaerat veritatis. Eos, voluptate. Nemo, sapiente? Vero reprehenderit quo cum fuga molestias voluptas fugiat, velit repellat nesciunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime autem corrupti voluptas, molestias iure ducimus provident, quia neque eveniet facilis doloremque eum commodi quos saepe ab laboriosam voluptates, sed exercitationem! Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni, in rerum ea dicta at mollitia vero et possimus recusandae qui velit ipsum. Nobis repellendus laborum inventore numquam incidunt accusantium dignissimos! Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic molestiae quis ab dolorem impedit deserunt quos rerum at necessitatibus quidem, ad voluptates exercitationem nesciunt quasi ut sint beatae quaerat. Neque. Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel sunt illum id perferendis porro, ex a consectetur sequi nobis amet aspernatur eius. Magnam, natus! Quibusdam ducimus explicabo animi dolores blanditiis!
                        </p>
                    </div>
                </div>
                <div className="flex flex-col py-3 mt-4 w-11/12 rounded-3xl border-2 border-gray-300">
                    <span className="ml-5 text-3xl font-semibold">Diagnosis</span>
                    <div className="flex flex-col w-full h-56 mt-2">
                        <span className="ml-5 text-2xl font-semibold text-gray-400">Subjective</span>
                        <textarea name="subjective" value={diagnosisData.subjective} onChange={(e) => handleTextAreaChange(e)} placeholder="Enter observation notes" className="w-[96%] h-5/6 mt-3 p-4 self-center rounded-3xl border-2 border-gray-300" />
                    </div>
                    <div className="flex flex-col w-full h-fit mt-3">
                        <div className="flex flex-row w-full h-fit items-center">
                            <span className="ml-5 text-2xl font-semibold text-gray-400">Objective</span>
                            <button onClick={addChild} className="w-10 h-10 ml-3 rounded-full text-3xl text-white bg-petgreen active:bg-activepetgreen">+</button>
                        </div>
                        <div className="flex flex-row mt-5 w-full max-w-[1095px] h-full overflow-scroll self-center">
                            {children.map((child, index) => (
                                <>
                                    {React.cloneElement(child, { onDelete: () => removeChild(index) })}
                                </>
                            ))}
                        </div>
                    </div>                    
                    <div className="flex flex-col w-full h-56 mt-2">
                        <span className="ml-5 text-2xl font-semibold text-gray-400">Assessment</span>
                        <textarea name="assessment" value={diagnosisData.assessment} onChange={(e) => handleTextAreaChange(e)} placeholder="Enter factual assessments" className="w-[96%] h-5/6 mt-3 p-4 self-center rounded-3xl border-2 border-gray-300" />
                    </div>
                </div>
                <div className="flex w-11/12 h-44 items-center">
                    <button
                        onClick={handleCompletion}
                        className='flex ml-auto w-96 h-16 justify-center items-center text-base rounded-full bg-petgreen active:bg-activepetgreen shadow-xl text-white font-semibold'
                    >
                        Complete Appointment
                    </button>  
                </div>              
            </div>
        </main>
    )
}