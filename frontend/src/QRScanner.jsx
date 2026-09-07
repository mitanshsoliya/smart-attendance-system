import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function QRScanner({ onAttendanceMarked }) {
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  const markAttendance = async (decodedText) => {
    try {
      
      const qrData = JSON.parse(decodedText);

      console.log("QR Data:", qrData);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE}/attendance/mark`,
        {
          lecture_id: qrData.lecture_id,
          session_token: qrData.session_token,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message || "Attendance marked successfully!"
      );

      if (onAttendanceMarked) {
     onAttendanceMarked();
      }

    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Invalid QR or attendance failed"
      );
    }
  };

  // Camera Scanner
  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");

    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await markAttendance(decodedText);

          try {
            await scanner.stop();
          } catch (error) {
            console.log(error);
          }
        },
        () => {}
      )
      .catch((error) => {
        console.error("Camera Error:", error);
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  // Upload QR Image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      setMessage("Reading QR image...");

      const imageScanner = new Html5Qrcode("qr-image-reader");

      const decodedText = await imageScanner.scanFile(
        file,
        true
      );

      console.log("Uploaded QR Data:", decodedText);

      await markAttendance(decodedText);

      await imageScanner.clear();

    } catch (error) {
      console.error("Image QR Error:", error);

      setMessage(
        "Could not detect a valid QR code in this image. Please upload a clear QR code image."
      );
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
      }}
    >

      <h1>Scan Attendance QR</h1>

      {/* Camera Scanner */}

      <h2>📷 Scan using Camera</h2>

      <div
        id="qr-reader"
        style={{
          width: "350px",
          margin: "auto",
        }}
      ></div>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      {/* Upload Image */}

      <h2>📁 Or Upload QR Image</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Hidden QR image reader */}

      <div
        id="qr-image-reader"
        style={{
          display: "none",
        }}
      ></div>

      {message && (
        <h3
          style={{
            marginTop: "25px",
          }}
        >
          {message}
        </h3>
      )}

    </div>
  );
}

export default QRScanner;