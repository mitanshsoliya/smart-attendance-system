import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function QRScanner({ onAttendanceMarked }) {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraState, setCameraState] = useState("idle"); // 'idle' | 'starting' | 'active' | 'error'
  const [cameraErrorMessage, setCameraErrorMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const scannerRef = useRef(null);

  const markAttendance = async (rawInput) => {
    if (!rawInput || !rawInput.trim()) {
      setMessage("Please enter a valid session token or scan a QR code.");
      setIsSuccess(false);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsSuccess(false);

    let session_token = rawInput.trim();

    // Try parsing as JSON if legacy QR object
    try {
      const parsed = JSON.parse(rawInput);
      if (parsed && typeof parsed === "object") {
        session_token = (parsed.session_token || rawInput).trim();
      }
    } catch {
      // Plain string token
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/attendance/mark`,
        {
          session_token,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const msg = response.data.message || "Attendance marked successfully!";
      setMessage(msg);
      setIsSuccess(true);

      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
    } catch (error) {
      console.error("Mark Attendance Error:", error);
      const errMsg =
        error.response?.data?.message ||
        "Invalid session token or QR code. Please try again.";
      setMessage(errMsg);
      setIsSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Start Camera with flexible fallback
  const startCamera = async (cameraIdToUse = null) => {
    setCameraState("starting");
    setCameraErrorMessage("");

    // Stop existing scanner if running
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.log("Error stopping scanner before restart:", err);
      }
    }

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const qrConfig = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
    };

    const handleSuccess = async (decodedText) => {
      await markAttendance(decodedText);
      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          setCameraState("idle");
        }
      } catch (err) {
        console.log("Error stopping camera after scan:", err);
      }
    };

    try {
      // If a specific camera ID was chosen
      if (cameraIdToUse) {
        await scanner.start(cameraIdToUse, qrConfig, handleSuccess, () => {});
        setCameraState("active");
        return;
      }

      // Try environment camera first
      try {
        await scanner.start({ facingMode: "environment" }, qrConfig, handleSuccess, () => {});
        setCameraState("active");
        return;
      } catch (envError) {
        console.warn("Environment camera unavailable, trying user camera:", envError);
      }

      // Try user/front camera fallback
      try {
        await scanner.start({ facingMode: "user" }, qrConfig, handleSuccess, () => {});
        setCameraState("active");
        return;
      } catch (userError) {
        console.warn("User camera unavailable, querying camera devices:", userError);
      }

      // Query available camera devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const deviceId = devices[0].id;
        setSelectedCameraId(deviceId);
        await scanner.start(deviceId, qrConfig, handleSuccess, () => {});
        setCameraState("active");
      } else {
        throw new Error("No video input devices / cameras found on this device.");
      }
    } catch (err) {
      console.error("Camera Initialization Failed:", err);
      setCameraState("error");
      setCameraErrorMessage(
        err.message || "Camera access was denied or is unavailable on this browser."
      );
    }
  };

  useEffect(() => {
    let isMounted = true;
    startCamera();

    // Query cameras list for optional switch dropdown
    Html5Qrcode.getCameras()
      .then((devs) => {
        if (isMounted && devs && devs.length > 0) {
          setCameras(devs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Handle camera dropdown switch
  const handleCameraChange = (e) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    if (newCamId) {
      startCamera(newCamId);
    }
  };

  // Upload QR Image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setMessage("Processing QR code from image...");
      setIsSuccess(false);
      const imageScanner = new Html5Qrcode("qr-image-reader");
      const decodedText = await imageScanner.scanFile(file, true);
      await markAttendance(decodedText);
      await imageScanner.clear();
    } catch (error) {
      console.error("Image QR Error:", error);
      setMessage("Could not detect a valid QR code in this image. Please try a clearer image.");
      setIsSuccess(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    markAttendance(manualToken);
  };

  return (
    <div className="w-full flex flex-col gap-5 text-left font-sans">
      {/* Verification Feedback Banner */}
      {message && (
        <div
          className={`p-3 text-sm font-semibold flex items-center justify-between border ${
            isSuccess
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
              : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {isSuccess ? "check_circle" : "error"}
            </span>
            {message}
          </span>
          <button
            onClick={() => setMessage("")}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Manual Session Token Verification */}
      <div className="bg-surface-warm dark:bg-surface-tint/10 border border-border-default dark:border-outline-variant p-4">
        <h4 className="text-xs font-bold text-text-stone uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm">verified</span>
          Manual Token Verification
        </h4>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="e.g. LECTURE-892041"
            className="flex-1 bg-surface border border-border-default px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary uppercase"
          />
          <button
            type="submit"
            disabled={submitting || !manualToken.trim()}
            className="bg-secondary text-on-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {submitting ? (
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            )}
            Verify
          </button>
        </form>
      </div>

      {/* SECTION 2: Camera Scanner */}
      <div className="border border-border-default dark:border-outline-variant p-4 bg-surface flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-text-stone uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-sm">photo_camera</span>
            Scan using Camera
          </span>

          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="text-xs bg-surface border border-border-default px-2 py-1 focus:outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Video Reader Element */}
        <div className="relative w-full max-w-[320px] aspect-square bg-black/90 border border-border-default overflow-hidden flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full"></div>

          {cameraState === "starting" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
              <span className="material-symbols-outlined text-2xl animate-spin text-secondary">
                sync
              </span>
              <span>Initializing camera feed...</span>
            </div>
          )}

          {cameraState === "error" && (
            <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center text-white text-xs gap-3 z-10">
              <span className="material-symbols-outlined text-3xl text-amber-400">
                videocam_off
              </span>
              <p className="text-stone-300 leading-tight">
                {cameraErrorMessage || "Camera unaccessible on this browser/device."}
              </p>
              <button
                onClick={() => startCamera()}
                className="px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded-none hover:bg-secondary/90 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">refresh</span>
                Retry Camera Access
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-text-muted mt-2 text-center">
          Align the faculty QR code within the frame above
        </p>
      </div>

      {/* SECTION 3: Upload Image Fallback */}
      <div className="border border-border-default dark:border-outline-variant p-4 bg-surface-container-low">
        <span className="text-xs font-bold text-text-stone uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-sm">upload_file</span>
          Upload QR Image File
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="text-xs text-text-stone file:mr-3 file:py-1.5 file:px-3 file:border file:border-border-default file:text-xs file:font-semibold file:bg-surface file:text-primary hover:file:bg-surface-container cursor-pointer"
        />
        <div id="qr-image-reader" className="hidden"></div>
      </div>
    </div>
  );
}

export default QRScanner;