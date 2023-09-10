// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMQ3w2BLvBBOjisHNsnig6SCdNyLYal9o",
  authDomain: "vet-test-firebase-4226c.firebaseapp.com",
  projectId: "vet-test-firebase-4226c",
  storageBucket: "gs://vet-test-firebase-4226c.appspot.com/",
  messagingSenderId: "322889154776",
  appId: "1:322889154776:web:ef23eb114515279e88d7ad",
  measurementId: "G-PTNP24FYDN",
  databaseURL: "https://vet-test-firebase-4226c-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
