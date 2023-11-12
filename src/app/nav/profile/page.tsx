'use client'

import React, { useState, useEffect, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/header'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref as ref_db, onValue, set, remove } from 'firebase/database'
import { ref as ref_storage, getDownloadURL, uploadBytes, listAll, getMetadata, deleteObject } from 'firebase/storage'
import { db, auth, storage } from '../../../../firebaseConfig'
import Image from 'next/image'
import { ProfilePicture, Email, Location, PhoneNumber, Whiteboard, Edit, Staff, Close, AddPhoto } from '@/app/images/svg-logos/svg_logos'
import { Modal } from '@mui/base/Modal'
import clsx from 'clsx'
import { v4 as uuid } from "uuid";

export default function Profile() {
    interface StaffData {
        [key: string]: string
    }

    const [uid, setUid] = useState('')
    const router = useRouter()
    const [userData, setUserData] = useState<any>();
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)
    const [clinicData, setClinicData] = useState<any>()
    const [isClinicDataLoaded, setIsClinicDataLoaded] = useState(false)
    const [clinicImage, setClinicImage] = useState<any>()
    const [staffImageFile, setStaffImageFile] = useState<HTMLElement>()
    const [clinicImageFile, setClinicImageFile] = useState<HTMLElement>()
    const [isImageUploaded, setIsImageUploaded] = useState(false)
    const [isNewClinicImageUploaded, setIsNewClinicImageUploaded] = useState(false)
    const [staffImage, setStaffImage] = useState<Blob>()
    const [newClinicImage, setNewClinicImage] = useState<Blob>()
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [removeOpen, setRemoveOpen] = useState(false)
    const [removeID, setRemoveID] = useState('')
    const [staffData, setStaffData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        role: '',
        vetIndex: '',
    })
    const [newClinicData, setNewClinicData] = useState({
        name: '',
        index: -1,
        location: '',
        address: '',
        phoneNumber: '',
        whiteboard: 'Whiteboard default message',
    })
    const [staffList, setStaffList] = useState<{ [staffID: string]: StaffData }>({})
    const [staffImageList, setStaffImageList] = useState<{ imageName: string; url: string; }[]>([])
    const [isStaffListLoaded, setIsStaffListLoaded] = useState(false)
    const [isStaffImageListLoaded, setIsStaffImageListLoaded] = useState(false)
    const Backdrop = React.forwardRef<HTMLDivElement, { open?: boolean; }>(
        function Backdrop(props, ref) {
        const { open } = props
        return (
            <div
                onClick={() => {
                    setOpen(false)
                    setRemoveOpen(false)
                    setEditOpen(false)
                }}
                className={clsx({ 'MuiBackdrop-open': open }, "-z-10 fixed inset-0 bg-black/50")}
                ref={ref}
            />
        )
    })

    staffImageFile?.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement) {
            const imageElementID = e.target.id.replace(/-file$/, '')
            const files = e.target.files
            if (files?.length == 0) {
              // No file selected, ignore 
              return;
            }
            handleDroppedFiles(files, imageElementID);
        }
    });

    clinicImageFile?.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement) {
            const imageElementID = e.target.id.replace(/-file$/, '')
            const files = e.target.files
            if (files?.length == 0) {
              // No file selected, ignore 
              return;
            }
            handleDroppedFiles(files, imageElementID);
        }
    });

    function handleDroppedFiles(files: any, imageElementID: string) {
      if (files.length > 0) {
        for (const file of files) {
          console.log(`Dropped file: ${file.name}`)
          
          if (file.type.startsWith('image/')) {
            setIsImageUploaded(true)
            setIsNewClinicImageUploaded(true)
            const reader = new FileReader()
            reader.onload = async (e) => {
              if (e.target?.result) {
                const result = typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result as ArrayBuffer);
                const imageElement = document.getElementById(imageElementID) as HTMLImageElement
                imageElement.src = result;
                // Convert to Blob
                const response = await fetch(result)
                const blob = await response.blob()
                if (imageElementID.includes("staff")) {
                    setStaffImage(blob)
                }
                else if (imageElementID.includes("clinic")) {
                    setNewClinicImage(blob)
                }
              }
            };
            reader.readAsDataURL(file)
          }
        }
      }
    }

    function handleStaffInputChange(e: any, field: string) {
        const newValue = e.target.value
        setStaffData((prevState) => ({
            ...prevState,
            [field]: newValue
        }))
    }

    function handleClinicInputChange(e: any, field: string) {
        const newValue = e.target.value
        setNewClinicData((prevState) => ({
            ...prevState,
            [field]: newValue
        }))
    }

    function handleAddStaff() {
        const hasMissingDetails = Object.values(staffData).some(
            (value) => value === undefined || value === null || value.trim() === ""
        )
        if (hasMissingDetails || !staffImage) {
            alert("Please fill in all the required fields and provide a picture.")
        } else {
            const staffID = uuid()
            const staffRef = ref_db(db, "staff/vet" + userData.vetIndex.toString() + "/" + staffID)
            set(staffRef, staffData)

            const staffImageRef = ref_storage(storage, "staff-images/vet" + userData.vetIndex.toString() + "/" + staffID)
            uploadBytes(staffImageRef, staffImage)
                .then((snapshot) => {
                    // Successful upload
                    location.reload()
                })
                .catch((error) => {
                    console.error("Error uploading staff image: " + error)
                })
        }
    }

    function handleEditClinicProfile() {
        const hasMissingDetails = Object.values(newClinicData).some(
            (value) => value === undefined || value === null || value.toString().trim() === ""
        )
        if (hasMissingDetails || !newClinicImage) {
            alert("Please fill in all the required fields and provide a picture.")
        } else {
            const vetIndex = userData.vetIndex + 1
            const clinicRef = ref_db(db, "places/place" + vetIndex.toString())
            set(clinicRef, newClinicData)

            if (isNewClinicImageUploaded) {
                const clinicImageRef = ref_storage(storage, "veterinary-locations/vet" + vetIndex.toString() + ".png")
                setTimeout(() => {
                    uploadBytes(clinicImageRef, newClinicImage)
                        .then((snapshot) => {
                            // Successful upload
                        })
                        .catch((error) => {
                            console.error("Error uploading clinic image: " + error)
                        })
                }, 500);
            }
            setTimeout(() => {
                location.reload()
            }, 1000)
        }
    }

    function handleRemoveStaff(staffID: string) {
        setRemoveOpen(true)
        setRemoveID(staffID)
    }

    function handleConfirmStaffRemove() {
        const removeStaffRef = ref_db(db, "staff/vet" + userData.vetIndex.toString() + "/" + removeID)
        const removeStaffImageRef = ref_storage(storage, "staff-images/vet" + userData.vetIndex.toString() + "/" + removeID)
        remove(removeStaffRef)
        deleteObject(removeStaffImageRef)
        setRemoveOpen(false)
    }

    function handleSignOut() {
        signOut(auth).then(() => {
            router.replace('/login')
        }).catch((error) => {
            console.error("Error signing out: ", error)
        })
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid)
            } else {
                router.push('/login')
            }
        })

        return () => {
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                setStaffImageFile(document.getElementById('staff-image-file') ?? undefined)
            }, 500);
        } else {
            setIsImageUploaded(false)
            setStaffImage(undefined)
        }
    }, [open])

    useEffect(() => {
        if (editOpen) {
            setTimeout(() => {
                setClinicImageFile(document.getElementById('clinic-image-file') ?? undefined)
            }, 500);
        } else {
            setIsNewClinicImageUploaded(false)
            setNewClinicImage(undefined)
        }
    }, [editOpen])

    useEffect(() => {
        const userRef = ref_db(db, "users/" + uid)
        const userListener = onValue(userRef, (snapshot) => {
            const data = snapshot.val()
            setUserData(data)
            setIsUserDataLoaded(true)
        })

        return () => {
            userListener();
        }
    }, [uid])

    useEffect(() => {
        if (isUserDataLoaded) {
            setStaffData((prevState) => ({
                ...prevState,
                vetIndex: userData.vetIndex.toString()
            }))
            const vetIndex = userData.vetIndex + 1
            const clinicRef = ref_db(db, "places/place" + vetIndex.toString())
            const clinicListener = onValue(clinicRef, (snapshot) => {
                const data = snapshot.val()
                setClinicData(data)
                setIsClinicDataLoaded(true)
            })

            const staffRef = ref_db(db, "staff/vet" + userData.vetIndex.toString())
            const staffListener = onValue(staffRef, (snapshot) => {
                const data = snapshot.val()
                setStaffList(data)
                setIsStaffListLoaded(true)
            })

            const clinicImageRef = ref_storage(storage, "veterinary-locations/vet" + vetIndex.toString() + ".png")
            getDownloadURL(clinicImageRef)
                .then((url) => {
                    setClinicImage(url)
                })
                .catch((error) => {
                    console.error("Error receiving image: " + error)
                })

            const clinicStaffImageRef = ref_storage(storage, "staff-images/vet" + userData.vetIndex.toString())
            listAll(clinicStaffImageRef)
                .then((res) => {
                    const promises = res.items.map(async (itemRef) => {
                        const metadataPromise = getMetadata(itemRef);
                        const downloadURLPromise = getDownloadURL(itemRef);
                        try {
                            const [metadata, url] = await Promise.all([metadataPromise, downloadURLPromise]);
                            setStaffImageList(staffImageList => [...staffImageList, {imageName: metadata.name, url: url}]);
                        } catch (error) {
                            console.error("Error received: ", error);
                        }
                    });
                    Promise.all(promises)
                        .then(() => {
                            setIsStaffImageListLoaded(true)
                        })
                        .catch((error) => {
                            console.error("Error received: ", error)
                        })
                })
                .catch((error) => {
                    console.error("Error received: ", error)
                })

            return (() => {
                clinicListener()
                staffListener()
            })
        }
    }, [isUserDataLoaded])

    useEffect(() => {
        if (isClinicDataLoaded && isStaffListLoaded && isStaffImageListLoaded) {
            setNewClinicData((prevState) => ({
                ...prevState,
                name: clinicData.name,
                index: clinicData.index,
                location: clinicData.location,
                address: clinicData.address,
                phoneNumber: clinicData.phoneNumber,
                whiteboard: clinicData.whiteboard,
            }))
            setNewClinicImage(clinicImage)
        }
    }, [isClinicDataLoaded, isStaffListLoaded, isStaffImageListLoaded])

    return (
        <main className='flex w-screen h-max'>
          <Header />
            <div className="flex-1 flex flex-col p-5 justify-center items-center ml-72 overflow-y-scroll">
                <div className='flex flex-row w-full h-fit rounded-3xl border-2 border-gray-300'>
                    {clinicImage &&
                        <Image src={clinicImage} alt='Clinic Image' width={0} height={0} sizes='100vw' objectFit={"contain"} className='w-1/3 h-full rounded-3xl' />
                    }
                    <div className='flex-1 flex flex-row p-3 gap-x-5'>
                        {clinicData &&
                            <>
                                <div className='flex flex-col w-1/2 gap-y-2 justify-center'>
                                    <span className='font-bold text-3xl'>{clinicData.name}</span>
                                    <div className='flex flex-row w-full p-2 gap-x-5'>
                                        <Location />
                                        <span className='font-semibold text-sm text-justify text-gray-400'>{clinicData.address}</span>
                                    </div>
                                    <div className='flex flex-row w-full p-2 gap-x-5 items-center'>
                                        <Email />
                                        <span className='font-semibold text-lg'>{userData.email}</span>
                                    </div>
                                    <div className='flex flex-row w-full p-2 gap-x-5 items-center'>
                                        <PhoneNumber />
                                        <span className='font-semibold text-lg'>{clinicData.phoneNumber}</span>
                                    </div>
                                </div>
                                <div className='flex flex-col w-1/2 gap-y-2 justify-center'>
                                    <div className='flex flex-row w-full p-1 gap-x-5 items-center'>
                                        <Whiteboard />
                                        <span className='font-semibold text-lg'>Whiteboard</span>
                                    </div>
                                    <div className='w-full h-2/3 max-h-[133px] overflow-scroll p-3 rounded-3xl border-2 border-gray-300'>
                                        <p className='text-sm text-justify'>{clinicData.whiteboard}</p>
                                    </div>
                                    <button onClick={() => setEditOpen(true)} className='flex w-full h-[30%] justify-center items-center gap-x-2 rounded-2xl bg-petgreen active:bg-activepetgreen font-semibold text-xl'>
                                        <Edit />
                                        Edit Clinic Profile
                                    </button>
                                </div>
                            </>
                        }
                    </div>
                </div>
                <div className='flex flex-col w-full h-fit p-3'>
                    <div className='flex flex-row w-full p-2 gap-x-3 items-center'>
                        <Staff />
                        <span className='font-semibold text-3xl'>Staff List</span>
                        <button onClick={() => setOpen(true)} className='flex w-10 h-10 justify-center items-center font-light text-white rounded-full text-5xl bg-petgreen active:bg-activepetgreen'>+</button>
                    </div>
                    <table className='flex flex-col w-full max-h-[274px] p-5 overflow-y-scroll rounded-3xl border-2 border-gray-300'>
                        <tbody>
                            <tr className='flex flex-row w-full border-b-4 border-black'>
                                <td className='w-4/12 font-semibold text-xl'>Staff</td>
                                <td className='w-3/12 font-semibold text-xl'>Email</td>
                                <td className='w-3/12 font-semibold text-xl'>Phone Number</td>
                                <td className='w-2/12 font-semibold text-xl'>Role</td>
                            </tr>
                                {typeof staffList === "object" && staffList && staffImageList &&
                                    Object.keys(staffList).map((key) => {
                                        const staffImage = staffImageList.find(obj => obj.imageName === key)?.url

                                        return (
                                            <tr key={key} className='flex flex-row w-full py-3 px-2 items-center odd:bg-slate-50 even:bg-white'>                                            
                                                <td className='flex items-center gap-x-5 w-4/12 text-xl overflow-hidden'>
                                                    <Image src={staffImage ? staffImage : ''} alt='Staff Image' width={72} height={72} className='w-[72px] h-[72px] object-cover rounded-full' />                                                    
                                                    {staffList[key].name}
                                                </td>
                                                <td className='flex items-center w-3/12 text-xl'>{staffList[key].email}</td>
                                                <td className='flex items-center w-3/12 text-xl'>{staffList[key].phoneNumber}</td>
                                                <td className='flex flex-row items-center w-2/12 justify-between text-xl'>
                                                    {staffList[key].role}
                                                    <button onClick={() => handleRemoveStaff(key)}>
                                                        <Close width='32' height='32' fill='#cbcbcb' />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                        </tbody>
                    </table>
                </div>
                <div className='flex mt-3 w-full justify-center items-center'>
                    <button
                        className='w-5/12 h-16 p-3 self-center rounded-xl bg-cancel active:bg-activecancel justify-center'
                        onClick={() => handleSignOut()}
                    >
                        <span className='font-bold text-black text-2xl self-center'>Log Out</span>
                    </button>
                </div>
            </div>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                slots={{ backdrop: Backdrop }}
                className='z-50 fixed inset-0 flex justify-center items-center'
            >
                <div className='flex flex-col w-5/12 h-5/6 p-8 justify-center items-center bg-white rounded-2xl'>
                    <div className='flex w-full justify-between items-center'>
                        <span className='font-semibold text-3xl'>Add Staff</span>
                        <button onClick={() => setOpen(false)}>
                            <Close width='42' height='42' fill='black' />
                        </button>
                    </div>
                    <div className='flex flex-col w-full h-[35%] gap-y-3 justify-center items-center'>
                        {isImageUploaded &&
                            <Image src={""} id='staff-image' alt="Staff Image" width={124} height={124} className='w-[124px] h-[124px] object-cover rounded-full' />
                        }
                        {!isImageUploaded &&
                            <ProfilePicture width='170' height='170' fill='black' />
                        }
                        <input id='staff-image-file' type='file' accept='image/*' className='inline-flex ml-24 pb-2' />
                    </div>
                    <div className='flex-1 flex w-full'>
                        <div className='flex flex-col w-1/2 h-full pr-3 justify-evenly items-end'>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Name</span>
                                <input value={staffData.name} onChange={(e) => handleStaffInputChange(e, 'name')} placeholder='e.g. John Lee' type="text" name="name" id="name" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Phone Number</span>
                                <input value={staffData.phoneNumber} onChange={(e) => handleStaffInputChange(e, 'phoneNumber')} placeholder='e.g. 0123456789' type="tel" name="name" id="name" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                        </div>
                        <div className='flex flex-col w-1/2 h-full pl-3 justify-evenly items-start'>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Email</span>
                                <input value={staffData.email} onChange={(e) => handleStaffInputChange(e, 'email')} placeholder='e.g. staff@email.com' type="email" name="name" id="name" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Role</span>
                                <select value={staffData.role} onChange={(e) => handleStaffInputChange(e, 'role')} name="role" id="role" className='p-3 rounded-2xl bg-white border-2 border-gray-300 overflow-ellipsis'>
                                    <option value="" disabled className='font-sans'>Select a role</option>
                                    <option value="Veterinarian" className='font-sans'>Veterinarian</option>
                                    <option value="Technician" className='font-sans'>Veterinary Technician</option>
                                    <option value="Assistant" className='font-sans'>Veterinary Asssitant</option>
                                    <option value="Receptionist" className='font-sans'>Receptionist</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleAddStaff()} className='flex w-1/2 p-3 justify-center items-center rounded-2xl bg-petgreen active:bg-activepetgreen font-semibold text-xl'>
                        Add Staff Member
                    </button>
                </div>
            </Modal>
            <Modal
                open={removeOpen}
                onClose={() => setRemoveOpen(false)}
                slots={{ backdrop: Backdrop }}
                className='z-50 fixed inset-0 flex justify-center items-center'
            >
                <div className='flex flex-col w-5/12 h-1/3 p-5 justify-center items-center bg-white rounded-2xl'>
                    <div className='flex w-full justify-between items-center'>
                        <span className='font-semibold text-3xl'>Confirm Staff Remove</span>
                    </div>
                    <div className='flex-1 flex flex-col mt-5 justify-center items-center'>
                        <span className='font-medium text-center text-xl'>Are you sure you want to remove {staffList[removeID]?.name}?</span>
                        <div className='flex flex-row w-full p-5 justify-center items-center gap-x-5'>
                            <button onClick={() => handleConfirmStaffRemove()} className='font-semibold text-lg w-36 p-3 rounded-2xl bg-petgreen active:bg-activepetgreen'>Confirm</button>
                            <button onClick={() => setRemoveOpen(false)} className='font-semibold text-lg w-36 p-3 rounded-2xl bg-cancel active:bg-activecancel'>Cancel</button>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                slots={{ backdrop: Backdrop }}
                className='z-50 fixed inset-0 flex justify-center items-center'
            >
                <div className='flex flex-col w-5/12 h-5/6 p-5 justify-center items-center bg-white rounded-2xl'>
                    <div className='flex w-full pb-5 justify-between items-center'>
                        <span className='font-semibold text-3xl'>Edit Clinic Profile</span>
                        <button onClick={() => setEditOpen(false)}>
                            <Close width='42' height='42' fill='black' />
                        </button>
                    </div>
                    <div className='flex flex-col w-full h-[35%] gap-y-3 justify-center items-center'>
                        {isNewClinicImageUploaded &&
                            <Image src={""} id='clinic-image' alt="Clinic Image" className='h-full object-cover rounded-2xl' />
                        }
                        {!isNewClinicImageUploaded && clinicImage &&
                            <Image src={clinicImage} id='current-clinic-image' alt="Current Clinic Image" width={400} height={162} className='h-full object-cover rounded-2xl' />
                            // <div className='flex w-8/12 h-full justify-center items-center rounded-2xl border-4 border-gray-300 border-dashed'>
                            //     <AddPhoto width='72' height='72' fill='#cbcbcb' />
                            // </div>
                        }
                        <input id='clinic-image-file' type='file' accept='image/*' className='inline-flex ml-20 pb-2' />
                    </div>
                    <div className='flex-1 flex w-full'>
                        <div className='flex flex-col w-1/2 h-full pr-3 justify-evenly items-end'>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Address</span>
                                <input value={newClinicData.address} onChange={(e) => handleClinicInputChange(e, 'address')} placeholder='e.g. 123 Main Street' type="text" name="name" id="name" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Phone Number</span>
                                <input value={newClinicData.phoneNumber} onChange={(e) => handleClinicInputChange(e, 'phoneNumber')} placeholder='e.g. 0123456789' type="tel" name="name" id="name" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                        </div>
                        <div className='flex flex-col w-1/2 h-full pl-3 justify-evenly items-start'>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Whiteboard</span>
                                <textarea value={newClinicData.whiteboard} onChange={(e) => handleClinicInputChange(e, 'whiteboard')} placeholder='Write a message to your staff' name="whiteboard" id="whiteboard" className='p-3 rounded-2xl border-2 border-gray-300'></textarea>
                            </div>
                            <div className='inline-flex flex-col w-11/12 h-fit'>
                                <span className='ml-2'>Location</span>
                                <input value={newClinicData.location} onChange={(e) => handleClinicInputChange(e, 'location')} placeholder='e.g. Subang Jaya' type="text" name="location" id="location" className='p-3 rounded-2xl border-2 border-gray-300' />
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleEditClinicProfile()} className='flex w-1/2 p-3 justify-center items-center rounded-2xl bg-petgreen active:bg-activepetgreen font-semibold text-xl'>
                        Confirm Edit
                    </button>
                </div>
            </Modal>
        </main>
    )
}