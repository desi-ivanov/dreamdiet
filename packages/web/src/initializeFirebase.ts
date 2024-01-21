// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyA3IWMukcS95mzPQvIvkApaWxI-VjNcn04",
  authDomain: "dreamdiet-4024d.firebaseapp.com",
  projectId: "dreamdiet-4024d",
  storageBucket: "dreamdiet-4024d.appspot.com",
  messagingSenderId: "576020005767",
  appId: "1:576020005767:web:e17909159b8b7cac560922",
  measurementId: "G-6LEV5EGP1C",
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
