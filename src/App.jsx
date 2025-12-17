import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import './App.css'

function App() {
  const [scanning, setScanning] = useState(true)
  const [scannedData, setScannedData] = useState(null)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  const parseAadhaarQR = (qrData) => {
    try {
      // Aadhaar QR code is typically in XML format or delimited format
      // The secure QR code contains data separated by delimiters
      const parts = qrData.split('\n')
      
      // Try to parse as delimited format (common in Aadhaar QR)
      if (parts.length > 0) {
        const data = {}
        
        // Try common Aadhaar QR format (pipe-delimited or comma-delimited)
        const delimiter = qrData.includes('|') ? '|' : (qrData.includes(',') ? ',' : '\n')
        const fields = qrData.split(delimiter)
        
        // Typical Aadhaar QR structure (this may vary)
        if (fields.length >= 3) {
          data.referenceId = fields[0] || 'N/A'
          data.name = fields[1] || 'N/A'
          data.dateOfBirth = fields[2] || 'N/A'
          data.gender = fields[3] || 'N/A'
          data.address = fields[4] || 'N/A'
          
          // Additional fields if available
          if (fields.length > 5) {
            data.additionalInfo = fields.slice(5).join(', ')
          }
        } else {
          // If structure doesn't match, just show raw data
          data.rawData = qrData
        }
        
        return data
      }
      
      return { rawData: qrData }
    } catch (err) {
      return { rawData: qrData, parseError: err.message }
    }
  }

  const startScanning = async () => {
    try {
      setError(null)
      setScanning(true)
      setScannedData(null)

      // Check if running on HTTPS or localhost (required for camera on mobile)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS. Please use HTTPS or access via your local IP address.')
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.')
      }

      // Request camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        stream.getTracks().forEach(track => track.stop())
      } catch (permErr) {
        throw new Error('Camera permission denied. Please allow camera access to scan QR codes.')
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader")
      }

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        formatsToSupport: [0] // QR_CODE format
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // QR Code successfully scanned
          const parsedData = parseAadhaarQR(decodedText)
          setScannedData(parsedData)
          setScanning(false)
          
          // Stop scanning
          html5QrCodeRef.current.stop().catch(err => console.error(err))
        },
        (errorMessage) => {
          // Scanning error (ignore - happens when no QR in frame)
        }
      )
    } catch (err) {
      const errorMsg = err.message || err.toString() || 'Failed to start camera. Please check permissions.'
      setError(errorMsg)
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop()
        setScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const handleRescan = async () => {
    setScannedData(null)
    await startScanning()
  }

  useEffect(() => {
    startScanning()
    
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Cleanup error:', err))
      }
    }
  }, [])

  return (
    <div className="app-container">
      <h1>Aadhaar QR Scanner</h1>
      
      {!scannedData && (
        <div className="scanner-container">
          <div id="qr-reader"></div>
          {scanning && <p className="scanner-info">Position the Aadhaar QR code within the frame</p>}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRescan}>
            {error.includes('permission') || error.includes('Permission') 
              ? 'Request Camera Permission' 
              : 'Try Again'}
          </button>
        </div>
      )}

      {scannedData && (
        <div className="scanned-data">
          <h2>Scanned Aadhaar Information</h2>
          
          {scannedData.name && (
            <div className="data-field">
              <strong>Name:</strong> {scannedData.name}
            </div>
          )}
          
          {scannedData.dateOfBirth && (
            <div className="data-field">
              <strong>Date of Birth:</strong> {scannedData.dateOfBirth}
            </div>
          )}
          
          {scannedData.gender && (
            <div className="data-field">
              <strong>Gender:</strong> {scannedData.gender}
            </div>
          )}
          
          {scannedData.address && (
            <div className="data-field">
              <strong>Address:</strong> {scannedData.address}
            </div>
          )}
          
          {scannedData.referenceId && (
            <div className="data-field">
              <strong>Reference ID:</strong> {scannedData.referenceId}
            </div>
          )}
          
          {scannedData.additionalInfo && (
            <div className="data-field">
              <strong>Additional Info:</strong> {scannedData.additionalInfo}
            </div>
          )}
          
          {scannedData.rawData && !scannedData.name && (
            <div className="data-field">
              <strong>Raw Data:</strong>
              <pre>{scannedData.rawData}</pre>
            </div>
          )}
          
          {scannedData.parseError && (
            <div className="warning">
              <p>Note: Unable to parse some data. Showing raw format.</p>
            </div>
          )}
          
          <button className="rescan-button" onClick={handleRescan}>
            Scan Another Aadhaar QR
          </button>
        </div>
      )}
    </div>
  )
}

export default App
