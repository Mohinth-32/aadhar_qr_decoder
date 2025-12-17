import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import './App.css'

function App() {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [error, setError] = useState(null)

  const parseAadhaarQR = (qrData) => {
    try {
      // Aadhaar Secure QR is encrypted → show raw for now
      if (qrData.startsWith('<?xml')) {
        return { rawData: qrData }
      }

      const delimiter = qrData.includes('|')
        ? '|'
        : qrData.includes(',')
        ? ','
        : '\n'

      const fields = qrData.split(delimiter)

      return {
        referenceId: fields[0] || 'N/A',
        name: fields[1] || 'N/A',
        dateOfBirth: fields[2] || 'N/A',
        gender: fields[3] || 'N/A',
        address: fields[4] || 'N/A',
        rawData: qrData,
      }
    } catch (err) {
      return { rawData: qrData, parseError: err.message }
    }
  }

  const startScanning = async () => {
    try {
      setError(null)
      setScannedData(null)
      setScanning(true)

      if (!videoRef.current) {
        throw new Error('Video element not ready')
      }

      // Check if QR scanner is already running
      if (scannerRef.current) {
        await stopScanning()
      }

      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const parsed = parseAadhaarQR(result.data)
          setScannedData(parsed)
          stopScanning()
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      )

      await scannerRef.current.start()
      setScanning(true)
    } catch (err) {
      console.error('Scanner error:', err)
      setError(err.message || 'Failed to access camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  useEffect(() => {
    // Check camera support
    QrScanner.hasCamera().then((hasCamera) => {
      if (!hasCamera) {
        setError('No camera found on this device')
      }
    })

    startScanning()
    
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="app-container">
      <h1>Aadhaar QR Scanner</h1>

      {!scannedData && (
        <div className="scanner-container">
          <video ref={videoRef} className="qr-video" />
          {scanning && <p>Align Aadhaar QR inside frame</p>}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={startScanning}>Retry</button>
        </div>
      )}

      {scannedData && (
        <div className="scanned-data">
          <h2>Scanned Data</h2>

          {scannedData.name && <p><b>Name:</b> {scannedData.name}</p>}
          {scannedData.dateOfBirth && <p><b>DOB:</b> {scannedData.dateOfBirth}</p>}
          {scannedData.gender && <p><b>Gender:</b> {scannedData.gender}</p>}
          {scannedData.address && <p><b>Address:</b> {scannedData.address}</p>}

          <details>
            <summary>Raw QR Data</summary>
            <pre>{scannedData.rawData}</pre>
          </details>

          <button onClick={startScanning}>Scan Again</button>
        </div>
      )}
    </div>
  )
}

export default App
