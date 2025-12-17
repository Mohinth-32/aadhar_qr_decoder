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
      // Parse XML format from Aadhaar QR
      if (qrData.startsWith('<?xml')) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(qrData, 'text/xml')
        const barcodeData = xmlDoc.getElementsByTagName('PrintLetterBarcodeData')[0]
        
        if (barcodeData) {
          const uid = barcodeData.getAttribute('uid') || ''
          const maskedUid = uid ? `XXXX XXXX ${uid.slice(-4)}` : 'N/A'
          
          return {
            uid: maskedUid,
            name: barcodeData.getAttribute('name') || 'N/A',
            careOf: barcodeData.getAttribute('careOf') || barcodeData.getAttribute('co') || '',
            building: barcodeData.getAttribute('building') || barcodeData.getAttribute('house') || '',
            street: barcodeData.getAttribute('street') || '',
            landmark: barcodeData.getAttribute('landmark') || barcodeData.getAttribute('lm') || '',
            locality: barcodeData.getAttribute('locality') || barcodeData.getAttribute('loc') || '',
            vtcName: barcodeData.getAttribute('vtcName') || barcodeData.getAttribute('vtc') || '',
            poName: barcodeData.getAttribute('poName') || barcodeData.getAttribute('po') || '',
            districtName: barcodeData.getAttribute('districtName') || barcodeData.getAttribute('dist') || '',
            stateName: barcodeData.getAttribute('stateName') || barcodeData.getAttribute('state') || '',
            pincode: barcodeData.getAttribute('pincode') || barcodeData.getAttribute('pc') || '',
            dateOfBirth: barcodeData.getAttribute('dob') || barcodeData.getAttribute('yob') || '',
            gender: barcodeData.getAttribute('gender') || '',
            rawData: qrData,
          }
        }
      }

      // Parse delimited format
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
          <h2>✅ Aadhaar Information</h2>

          {scannedData.uid && (
            <div className="info-row">
              <strong>Aadhaar Number:</strong>
              <span>{scannedData.uid}</span>
            </div>
          )}
          
          {scannedData.name && scannedData.name !== 'N/A' && (
            <div className="info-row">
              <strong>Name:</strong>
              <span>{scannedData.name}</span>
            </div>
          )}
          
          {scannedData.careOf && (
            <div className="info-row">
              <strong>Care Of:</strong>
              <span>{scannedData.careOf}</span>
            </div>
          )}
          
          {scannedData.dateOfBirth && (
            <div className="info-row">
              <strong>Date of Birth:</strong>
              <span>{scannedData.dateOfBirth}</span>
            </div>
          )}
          
          {scannedData.gender && (
            <div className="info-row">
              <strong>Gender:</strong>
              <span>{scannedData.gender}</span>
            </div>
          )}
          
          {(scannedData.building || scannedData.street || scannedData.landmark || 
            scannedData.locality || scannedData.vtcName || scannedData.poName || 
            scannedData.districtName || scannedData.stateName || scannedData.pincode) && (
            <div className="info-row address-row">
              <strong>Address:</strong>
              <div className="address-content">
                {scannedData.building && <span>{scannedData.building}, </span>}
                {scannedData.street && <span>{scannedData.street}, </span>}
                {scannedData.landmark && <span>{scannedData.landmark}, </span>}
                {scannedData.locality && <span>{scannedData.locality}, </span>}
                {scannedData.vtcName && <span>{scannedData.vtcName}, </span>}
                {scannedData.poName && <span>{scannedData.poName}, </span>}
                {scannedData.districtName && <span>{scannedData.districtName}, </span>}
                {scannedData.stateName && <span>{scannedData.stateName}</span>}
                {scannedData.pincode && <span> - {scannedData.pincode}</span>}
              </div>
            </div>
          )}
          
          {scannedData.address && !scannedData.building && (
            <div className="info-row">
              <strong>Address:</strong>
              <span>{scannedData.address}</span>
            </div>
          )}

          {scannedData.parseError && (
            <div className="error-message">
              <p>⚠️ Parse Error: {scannedData.parseError}</p>
            </div>
          )}

          <details className="raw-data-details">
            <summary>View Raw QR Data</summary>
            <pre>{scannedData.rawData}</pre>
          </details>

          <button onClick={startScanning} className="scan-again-btn">Scan Another QR Code</button>
        </div>
      )}
    </div>
  )
}

export default App
