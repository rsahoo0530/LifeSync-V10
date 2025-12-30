
// timeService.ts
// Service to handle Real-Time syncing to prevent local clock manipulation

let timeOffset = 0;
let isSynced = false;

export const initRealTime = async () => {
  if (isSynced) return;
  
  try {
    // METHOD 1: HEAD request to current server/CDN (Fastest, No CORS, High Availability)
    // This fetches the headers of your own web app.
    const response = await fetch('/', { method: 'HEAD', cache: 'no-store' });
    const dateHeader = response.headers.get('Date');
    
    if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime();
        const localTime = Date.now();
        timeOffset = serverTime - localTime;
        isSynced = true;
        console.log("🕒 Time Synced via Headers. Offset:", timeOffset);
        return;
    }
  } catch (e) {
      console.warn("Header time sync failed, trying API fallback...");
  }

  // METHOD 2: Fallback API if method 1 fails
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); 

    const response = await fetch('https://worldtimeapi.org/api/ip', { 
        signal: controller.signal 
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();
        const localTime = Date.now();
        timeOffset = serverTime - localTime;
        isSynced = true;
        console.log("🕒 Time Synced via API. Offset:", timeOffset);
        return;
    }
  } catch (e) {
      // Silent fail
  }

  // If all fail, we just log once and use device time
  console.log("⚠️ Time sync failed. Using device time fallback.");
};

/**
 * Returns the TRUE current Date object, corrected for device clock manipulation.
 */
export const getRealTime = (): Date => {
    return new Date(Date.now() + timeOffset);
};

/**
 * Returns the TRUE current date string (YYYY-MM-DD).
 */
export const getRealDateString = (): string => {
    return getRealTime().toISOString().split('T')[0];
};

/**
 * Checks if a given date string (YYYY-MM-DD) is today (in real time).
 */
export const isRealToday = (dateStr: string): boolean => {
    return dateStr === getRealDateString();
};
