import axios from 'axios';

/**
 * Track user analytics
 * @param {string} renderUrl - Your Render deployment URL
 */
export const trackPageView = async (renderUrl = "https://web-analytics-backend.onrender.com") => {
  try {
    await axios.post(`${renderUrl}/track`, {
      site: "Aadhar Qr Decoder",
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`
    }, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 5000 // 5 second timeout
    });
  } catch (error) {
    // Ignore aborted requests in development
    if (error.code !== 'ERR_CANCELED') {
      console.error("Tracking error:", error);
    }
  }
};