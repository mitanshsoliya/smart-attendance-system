import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function QRScanner({ onAttendanceMarked, onScanSuccess }) {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraState, setCameraState] = useState("idle"); // 'idle' | 'starting' | 'active' | 'error'
  const [cameraErrorMessage, setCameraErrorMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const [geoCoords, setGeoCoords] = useState(null); // { latitude, longitude, accuracy }
  const [geoStatus, setGeoStatus] = useState("idle"); // 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable'
  const [geoError, setGeoError] = useState("");
  const [geoDetails, setGeoDetails] = useState(null); // { distance_meters, allowedRadius, outOfBounds }

  const getGeoCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGeoStatus("unavailable");
        setGeoError("Geolocation is not supported by your browser or device.");
        return reject(new Error("Geolocation unsupported"));
      }

      setGeoStatus("locating");
      setGeoError("");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setGeoCoords(coords);
          setGeoStatus("ready");
          setGeoError("");
          resolve(coords);
        },
        (err) => {
          console.warn("GPS Geolocation error:", err);
          setGeoStatus("denied");
          const msg =
            err.code === 1
              ? "Location permission was denied. Please allow GPS access in your browser settings to verify classroom attendance."
              : "Unable to retrieve precise GPS coordinates. Please ensure location services are enabled.";
          setGeoError(msg);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
      );
    });
  };

  const markAttendance = async (rawInput) => {
    if (!rawInput || !rawInput.trim()) {
      setMessage("Please enter a valid session token or scan a QR code.");
      setIsSuccess(false);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsSuccess(false);
    setGeoDetails(null);

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

    // Try to obtain fresh GPS coordinates if not already acquired
    let coordsToUse = geoCoords;
    if (!coordsToUse) {
      try {
        coordsToUse = await getGeoCoordinates();
      } catch (geoErr) {
        console.warn("Continuing without pre-acquired GPS:", geoErr);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const deviceToken = localStorage.getItem("lecturelog_device_token");
      const payload = {
        session_token,
      };

      if (deviceToken) {
        payload.device_token = deviceToken;
      }

      if (coordsToUse && coordsToUse.latitude !== undefined && coordsToUse.longitude !== undefined) {
        payload.latitude = coordsToUse.latitude;
        payload.longitude = coordsToUse.longitude;
      }

      const response = await axios.post(
        `${API_BASE}/attendance/mark`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(deviceToken ? { "x-device-token": deviceToken } : {}),
          },
        }
      );

      const resData = response.data;
      const msg = resData.message || "Attendance marked successfully!";
      setMessage(msg);
      setIsSuccess(true);
      if (resData.distance_meters !== undefined && resData.distance_meters !== null) {
        setGeoDetails({
          distance_meters: resData.distance_meters,
          verified: true,
        });
      }

      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
      if (onScanSuccess) {
        onScanSuccess(session_token);
      }
    } catch (error) {
      console.error("Mark Attendance Error:", error);
      const data = error.response?.data;
      const status = error.response?.status;

      // If already marked, student is ALREADY verified and PRESENT! Show positive confirmation
      if (status === 409 || data?.conflict || data?.alreadyMarked) {
        const alreadyMsg = data?.message || "Attendance already marked for this lecture session.";
        setMessage(`✓ ${alreadyMsg} You are recorded as PRESENT.`);
        setIsSuccess(true);
        if (onAttendanceMarked) {
          onAttendanceMarked();
        }
        if (onScanSuccess) {
          onScanSuccess(session_token);
        }
        return;
      }

      if (data?.outOfBounds) {
        setMessage(
          `Classroom Geo-Fence Violation: You are ${data.distance}m away from the faculty device! Attendance requires physical presence within ${data.allowedRadius}m.`
        );
        setGeoDetails({
          distance_meters: data.distance,
          allowedRadius: data.allowedRadius,
          outOfBounds: true,
        });
      } else if (data?.locationRequired) {
        setMessage(
          `GPS Location Required: Geo-fencing is active for this session. Please enable GPS in your browser to verify presence within ${data.allowedRadius || 100}m of the faculty device.`
        );
      } else {
        const errMsg =
          data?.message || "Invalid session token or QR code. Please try again.";
        setMessage(errMsg);
      }
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
      // Guard against multiple camera frames firing concurrently
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // Immediately stop camera to prevent duplicate frame captures while processing
      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          setCameraState("idle");
        }
      } catch (err) {
        console.log("Error stopping camera after scan:", err);
      }

      try {
        await markAttendance(decodedText);
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
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
    getGeoCoordinates().catch(() => {});

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

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

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
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1200);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (isProcessingRef.current) return;
    markAttendance(manualToken);
  };

  return (
    <div className="w-full flex flex-col gap-4 text-left font-sans">
      {/* Geo-Fencing Anti-Proxy Live GPS Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
          geoStatus === "ready"
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
            : geoStatus === "denied"
            ? "bg-rose-50/80 border-rose-200 text-rose-900"
            : "bg-amber-50/80 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <span
            className={`material-symbols-outlined text-xl shrink-0 ${
              geoStatus === "ready"
                ? "text-emerald-600"
                : geoStatus === "denied"
                ? "text-rose-600"
                : "text-amber-600 animate-spin"
            }`}
          >
            {geoStatus === "ready" ? "fmd_good" : geoStatus === "denied" ? "location_off" : "sync"}
          </span>
          <div>
            <div className="font-bold flex flex-wrap items-center gap-1.5">
              <span>Geo-Fence GPS Protection:</span>
              <span
                className={`uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  geoStatus === "ready"
                    ? "bg-emerald-200/70 text-emerald-900"
                    : geoStatus === "denied"
                    ? "bg-rose-200/70 text-rose-900"
                    : "bg-amber-200/70 text-amber-900"
                }`}
              >
                {geoStatus === "ready"
                  ? "Classroom Radius Enforced (50-100m)"
                  : geoStatus === "denied"
                  ? "Location Access Denied"
                  : "Acquiring GPS Fix..."}
              </span>
            </div>
            <div className="text-[11px] opacity-85 mt-0.5">
              {geoStatus === "ready" && geoCoords && (
                <span>
                  📍 GPS Position locked (±{geoCoords.accuracy}m accuracy). Attendance will only be accepted within 50–100m of the classroom.
                </span>
              )}
              {geoStatus === "denied" && (
                <span>{geoError || "Location permission required to verify in-classroom attendance and block remote proxies."}</span>
              )}
              {geoStatus !== "ready" && geoStatus !== "denied" && (
                <span>Locking satellite GPS to verify your physical classroom presence...</span>
              )}
            </div>
          </div>
        </div>

        {geoStatus !== "ready" && (
          <button
            type="button"
            onClick={() => getGeoCoordinates().catch(() => {})}
            className="self-start sm:self-auto px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary-container transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Retry GPS</span>
          </button>
        )}
      </div>

      {/* Verification Feedback Banner */}
      {message && (
        <div
          className={`p-3.5 text-xs sm:text-sm font-semibold rounded-xl flex flex-col gap-1 border ${
            isSuccess
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg shrink-0">
                {isSuccess ? "verified" : "gpp_bad"}
              </span>
              <span>{message}</span>
            </span>
            <button
              onClick={() => setMessage("")}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
          {geoDetails?.distance_meters !== undefined && (
            <div className="text-xs pl-7 flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-sm">distance</span>
              <span>
                Verified Classroom Distance: <strong>{geoDetails.distance_meters}m</strong>{" "}
                {geoDetails.outOfBounds ? "(OUTSIDE ALLOWED RADIUS)" : "(INSIDE GEO-FENCE)"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Camera Scanner Viewport */}
      <div className="border border-border-default rounded-2xl p-4 bg-white flex flex-col items-center shadow-xs">
        <div className="w-full flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">photo_camera</span>
            Live Camera Scanner
          </span>

          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="text-xs bg-surface-container-low border border-border-default rounded-lg px-2.5 py-1 text-primary focus:outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Video Reader Element with Viewfinder Reticle & Laser */}
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center mx-auto border-2 border-primary/20 shadow-inner">
          <div id="qr-reader" className="w-full h-full"></div>

          {/* Viewfinder Reticle Corner Brackets */}
          <div className="absolute inset-4 pointer-events-none z-10">
            {/* Top-Left */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary rounded-tl-sm"></div>
            {/* Top-Right */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary rounded-tr-sm"></div>
            {/* Bottom-Left */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-secondary rounded-bl-sm"></div>
            {/* Bottom-Right */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary rounded-br-sm"></div>

            {/* Animated Laser Beam */}
            {cameraState === "active" && (
              <div className="qr-scan-laser"></div>
            )}
          </div>

          {cameraState === "starting" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-xs gap-2 z-20">
              <span className="material-symbols-outlined text-2xl animate-spin text-secondary">
                sync
              </span>
              <span>Initializing camera feed...</span>
            </div>
          )}

          {cameraState === "error" && (
            <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center text-white text-xs gap-3 z-20">
              <span className="material-symbols-outlined text-3xl text-amber-400">
                videocam_off
              </span>
              <p className="text-stone-300 leading-tight text-xs">
                {cameraErrorMessage || "Camera unaccessible on this browser or device."}
              </p>
              <button
                onClick={() => startCamera()}
                className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-container flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Retry Camera Access
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-text-stone mt-2.5 text-center font-medium">
          Align the dynamic classroom QR code within the target reticle
        </p>
      </div>

      {/* Manual Session Token Verification */}
      <div className="bg-surface-container-low border border-border-default p-4 rounded-xl">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">keyboard</span>
          Manual Session Token Entry
        </h4>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="e.g. LECTURE-892041"
            className="flex-1 bg-white border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-primary focus:outline-none focus:border-primary uppercase font-mono"
          />
          <button
            type="submit"
            disabled={submitting || !manualToken.trim()}
            className="bg-primary text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {submitting ? (
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-sm">check</span>
            )}
            Verify Token
          </button>
        </form>
      </div>

      {/* Upload Image Fallback */}
      <div className="border border-border-default rounded-xl p-3.5 bg-surface-container-low">
        <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">upload_file</span>
          Upload QR Image File (Fallback)
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full text-xs text-text-stone file:mr-3 file:py-1.5 file:px-3 file:border file:border-border-default file:rounded-lg file:text-xs file:font-semibold file:bg-white file:text-primary hover:file:bg-surface-container cursor-pointer truncate"
        />
        <div id="qr-image-reader" className="hidden"></div>
      </div>
    </div>
  );
}

export default QRScanner;