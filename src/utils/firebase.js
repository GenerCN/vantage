// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1I9ALbGkfX00tdHtZdEM2w09IHUKDIcw",
  authDomain: "react-vantage-damian.firebaseapp.com",
  projectId: "react-vantage-damian",
  storageBucket: "react-vantage-damian.firebasestorage.app",
  messagingSenderId: "760624687848",
  appId: "1:760624687848:web:34be847ab4a4bfe7a3b75d",
  measurementId: "G-BV0K9S1NME",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
