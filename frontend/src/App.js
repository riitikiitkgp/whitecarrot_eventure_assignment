import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate  } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
// import EventsPage from "./components/EventsPage"; // Import the EventsPage component
import "./App.css";
import EventsPage from "./components/EventsPage";
import { TypeAnimation } from 'react-type-animation';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    // console.log(credentialResponse);
    const token = credentialResponse.credential;
    // localStorage.setItem('accessToken', token);
    await new Promise((resolve) => {
      localStorage.setItem('accessToken', token);
      resolve();
    });
    
    // console.log("Access Token:", token);
    setAccessToken(token);
    // await new Promise(resolve => setTimeout(resolve, 500));
    navigate('/events');
  };

  useEffect(() => {
    if (accessToken) {
      navigate('/events'); 
    }
  }, [accessToken, navigate]);

  return (
    <div className="App">
      <div className="box">

        <h1 className="box-heading">Eventure by
          <TypeAnimation
            sequence={[
              ' whitecarrot.io',
              1000
            ]}
            speed={200} 
            style={{ fontSize: '1em' }} 
            repeat={Infinity}
            cursor={false} 
          />
        </h1>
        <p className="box-content">Effortlessly manage your schedule and stay on top of your events with our seamless integration with Google Calendar. Log in to access your personalized dashboard and start organizing your life with ease.
        </p>

        {!accessToken ? (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        ) : (
          <p>Redirecting to events...</p>
        )}
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/events" element={<EventsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWrapper;