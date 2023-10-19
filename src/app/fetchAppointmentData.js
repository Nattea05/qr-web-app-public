import { useState, useEffect } from "react";
import { ref as ref_db, onValue } from "firebase/database";
import { ref as ref_storage, getDownloadURL, getMetadata, listAll } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";

export default function useDataFetch(uid) {
    const [vetIndex, setVetIndex] = useState(-1)
    const [appointmentData, setAppointmentData] = useState([])
    const [userData, setUserData] = useState([])
    const [imageData, setImageData] = useState([])
    const [formattedData, setFormattedData] = useState([])
    const [isDataFetched, setIsDataFetched] = useState(false)
    const [isUserFetched, setIsUserFetched] = useState(false)
    const [isImageDataLoaded, setIsImageDataLoaded] = useState(false)

    useEffect(() => {
        const appointmentRef = ref_db(db, "appointments")
        const userRef = ref_db(db, "users")

        const appointmentListener = onValue(appointmentRef, (snapshot) => {
            const data = snapshot.val()
            setAppointmentData(data)
            setIsDataFetched(true)
        })
        
        const userListener = onValue(userRef, (snapshot) => {
            const data = snapshot.val()
            setUserData(data)
            setIsUserFetched(true)
        })    

        return () => {
            appointmentListener()
            userListener()
        }
    }, [])

    useEffect(() => {
        if (isDataFetched && isUserFetched) {
            let indexCount = 1
            Object.entries(userData).forEach(([key, value], index) => {
                const imageRef = ref_storage(storage, "pet-profile-pictures/" + key)
                listAll(imageRef)
                    .then((res) => {
                        const promises = res.items.map(async (itemRef) => {
                            const metadataPromise = getMetadata(itemRef);
                            const downloadURLPromise = getDownloadURL(itemRef);
                            try {
                                const [metadata, url] = await Promise.all([metadataPromise, downloadURLPromise]);
                                setImageData(imageData => [...imageData, {imageName: metadata.name, url: url}]);
                            } catch (error) {
                                console.error("Error received: ", error);
                            }
                        });
                        Promise.all(promises)
                            .then(() => {
                                if (indexCount === Object.entries(userData).length) {
                                    setIsImageDataLoaded(true);
                                }
                                indexCount++;
                            })
                            .catch((error) => {
                                console.error("Error received: ", error)
                            })
                    })
                    .catch((error) => {
                        console.error("Error received: ", error)
                    })
            })
        } 
    }, [userData, isDataFetched, isUserFetched])

    useEffect(() => {
        if (isDataFetched && isUserFetched && isImageDataLoaded) {
            const vetIndex = userData[uid]?.vetIndex
            const updatedData = [...formattedData]
            Object.entries(appointmentData).forEach(([key, value], index) => {
                if (value.vetIndex === vetIndex) {
                    updatedData.push({
                        text: `Appointment ${index}`,
                        startDate: new Date(`${value.date}T${value.time}:00.000+0800`),
                        endDate: new Date(`${value.date}T${value.time}:00.000+0830`),
                        description: value.reason,
                        patient: value.petID.slice(5),
                        patientID: value.petID,
                        client: userData[value.ownID].email,
                        clientID: value.ownID,
                        img: imageData.find((obj) => obj.imageName === value.petID).url,
                        appointmentID: key,
                        vetIndex: vetIndex
                        //add patient profile img in the future
                        //and change patient name
                    })
                }
            })
            setVetIndex(userData[uid]?.vetIndex)
            setFormattedData(updatedData)
        }
    }, [isDataFetched, isUserFetched, isImageDataLoaded])

    return [formattedData, vetIndex]
}