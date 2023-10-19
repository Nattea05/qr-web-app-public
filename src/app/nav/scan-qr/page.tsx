'use client'

import { useState, useEffect } from 'react'
import { CameraDevice, Html5Qrcode } from "html5-qrcode";
import Header from '../../components/header'
import { Permission, AddPhoto } from '@/app/images/scan-qr-img/scan-qr-img';
import Image from 'next/image';
import { useRouter } from "next/navigation"

export default function ScanQr() {
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode>()
  const [cameraId, setCameraId] = useState('')
  const [cameraIdList, setCameraIdList] = useState<CameraDevice[]>()
  const [switched, setSwitched] = useState(false)
  const [isToggled, setIsToggled] = useState(true)
  const [isImagedToggled, setIsImageToggled] = useState(false)
  const [dropArea, setDropArea] = useState<HTMLElement>()
  const [inputFile, setInputFile] = useState<HTMLElement>()
  const [isSrcLoaded, setIsSrcLoaded] = useState(false)
  const [imageFile, setImageFile] = useState<File>()
  const router = useRouter()

  dropArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'rgb(156 163 175)'
  });  

  dropArea?.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'rgb(209 213 219)'
  });
  
  dropArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'rgb(209 213 219)'
    const files = e.dataTransfer?.files;
    handleDroppedFiles(files);
  });
  
  inputFile?.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement) {
      const files = e.target.files
      if (files?.length == 0) {
        // No file selected, ignore 
        return;
      }
      handleDroppedFiles(files);
    }
  });

  function handleDroppedFiles(files: any) {
    if (files.length > 0) {
      for (const file of files) {
        console.log(`Dropped file: ${file.name}`)
        
        if (file.type.startsWith('image/')) {
          setImageFile(file)
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              const result = typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result as ArrayBuffer);
              const imageElement = document.getElementById('uploaded-image') as HTMLImageElement
              imageElement.src = result;
              setIsSrcLoaded(true)
            }
          };
          reader.readAsDataURL(file)

          let fileName = file.name
          let droppedFile = new File([file], file.name ,{ type: 'image/*' })
          let container = new DataTransfer()
          container.items.add(droppedFile)
          const inputElement = document.getElementById('qr-input-file') as HTMLInputElement
          inputElement.files = container.files
        }
      }
    }
  }

  function getCameraPermission() {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameraIdList(devices)
        setCameraId(devices[0].id)
        setHtml5QrCode(new Html5Qrcode('reader'))
        setSwitched(!switched)
      }
    }).catch(error => {
      console.error("Error retrieving camera permissions: " + error)
    })
  }

  function scanImage() {
    if (imageFile) {
      const html5QrCodeImage = new Html5Qrcode("uploaded-image-container")
      html5QrCodeImage.scanFile(imageFile, false)
        .then(decodedText => {
          router.push(`/nav/patient/patient-details/emr-history/emr-details?emrDetails=${decodedText}`)
        })
        .catch(error => {
          console.error("Scanning error detected: " + error)
        });
    }        
  }

  function startScan() {
    if (html5QrCode && !html5QrCode.isScanning) {
      html5QrCode.start(
        cameraId, 
        {
          fps: 30,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
          router.push(`/nav/patient/patient-details/emr-history/emr-details?emrDetails=${decodedText}`)
          stopScan()
        },
        (errorMessage) => {

        }
      ).catch((error) => {
        console.error("Start scan error detected: " + error)
      })        
    }    
  }

  function stopScan() {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then((ignore) => {
        // QR Code scanning is stopped.
      }).catch((error) => {
        console.error("Stop scan error detected: " + error)
      })   
    } 
  }

  function handleCameraSwitch(value: string) {
    stopScan()
    setTimeout(async () => {
      setCameraId(value)
      setSwitched(!switched)
    }, 50)  
  }

  function handleScanToggle() {
    if (isToggled) {
      stopScan()
      setIsToggled(false)
    } else {
      startScan()
      setIsToggled(true)
    }
  }

  function handleImageToggle() {
    if (isImagedToggled) {
      startScan()
      setIsToggled(true)
      setIsImageToggled(false)
      setIsSrcLoaded(true)
    } else {
      stopScan()
      setIsToggled(false)
      setIsImageToggled(true)
      setIsSrcLoaded(false)
      setImageFile(undefined)
    }
  }

  useEffect(() => {
    if (isImagedToggled) {
      setDropArea(document.getElementById('drop-area') ?? undefined)
      setInputFile(document.getElementById('qr-input-file') ?? undefined)
    }
  }, [isImagedToggled])

  useEffect(() => {
    if (!html5QrCode?.isScanning) {
      startScan()
    }
  }, [switched])

  return (
    <main className='flex w-screen h-screen'>
      <Header />
      <div className="flex-1 flex flex-col justify-center items-center ml-72">
        <div className='flex-1 flex flex-col w-full gap-8 items-center justify-center'>
          {!html5QrCode && !isImagedToggled &&
            <>
              <div className='flex w-[60px0] h-[150px] items-center justify-center'>
                <Permission />
              </div>
              <button className='flex p-5 w-fit h-14 justify-center items-center font-semibold text-lg rounded-2xl bg-petgreen active:bg-activepetgreen' onClick={() => getCameraPermission()}>
                Request Camera Permissions
              </button>
            </>
          }
          {isImagedToggled &&
            <>
              <div id='drop-area' className='flex flex-col w-[800px] h-[450px] min-h-[100px] items-center justify-center border-4 border-gray-300 border-dashed'>
                <div id='uploaded-image-container' className={`w-full h-[90%] items-center justify-center ${isSrcLoaded ? 'flex' : 'hidden'}`}>
                  <Image id='uploaded-image' src='' alt='' className='h-full object-contain' />
                </div>
                {isSrcLoaded ? (
                    null
                  ) : (
                  <AddPhoto />
                )}
                <input id='qr-input-file' type='file' accept='image/*' className=' flex py-2 w-full h-[10%] text-center' />
              </div>
              <button className='flex p-5 w-fit h-14 justify-center items-center font-semibold text-lg rounded-2xl bg-petgreen active:bg-activepetgreen' onClick={() => scanImage()}>
                Scan Image
              </button>
            </>
          }
          {cameraIdList && html5QrCode && !isImagedToggled &&
            <select onChange={(e) => handleCameraSwitch(e.target.value)} value={cameraId} name="cameraSelect" id="cameraSelect" className='pl-5 w-72 h-12 bg-white rounded-2xl border-2 border-gray-300'>
              {
                Object.keys(cameraIdList).map((camera, index) => (
                  <option className='font-sans' key={cameraIdList[index].id} value={cameraIdList[index].id}>{cameraIdList[index].label}</option>
                ))
              }
            </select>
          }
          <div id='reader' className='flex w-[600px] -scale-x-100' />
          {html5QrCode && !isImagedToggled &&
            <div className='flex flex-row w-8/12 justify-center gap-5'>
              <button 
                className={`flex w-52 h-12 justify-center items-center font-semibold text-lg rounded-2xl ${isToggled ? 'bg-cancel active:bg-activecancel' : 'bg-petgreen active:bg-activepetgreen'}`}
                onClick={() => handleScanToggle()}
              >
                {isToggled ? 'Stop Scanning' : 'Start Scanning'}
              </button>
            </div>
          }
          <button className='-mt-3 underline text-2xl font-medium' onClick={() => handleImageToggle()}>
            {isImagedToggled ? 'Scan using Camera directly' : 'Scan an Image file'}
          </button>
        </div>
      </div>
    </main>
  )
}