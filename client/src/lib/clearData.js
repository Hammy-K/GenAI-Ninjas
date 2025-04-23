/**
 * Utility functions to clear all application data
 */

// Function to clear local storage
export function clearLocalStorage() {
  // Clear localStorage
  localStorage.clear();
  console.log('LocalStorage cleared successfully');
  
  // Clear sessionStorage too for good measure
  sessionStorage.clear();
  console.log('SessionStorage cleared successfully');
  
  // Clear all cookies (or you can be more selective)
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
  console.log('Cookies cleared successfully');
  
  return { success: true };
}

// Function to clear server session data
export async function clearServerSession() {
  try {
    const response = await fetch('/api/debug/clear-session');
    const data = await response.json();
    console.log('Server session cleared:', data);
    return data;
  } catch (error) {
    console.error('Failed to clear server session:', error);
    return { success: false, error: error.message };
  }
}

// Clear all data and reload the page
export async function clearAllDataAndReload() {
  // Clear client-side storage
  clearLocalStorage();
  
  // Clear server-side session
  await clearServerSession();
  
  // Reload the page to start fresh
  console.log('Reloading page with clean state...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}