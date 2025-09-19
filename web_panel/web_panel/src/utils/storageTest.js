// Storage Test Utility
// Test if data is being saved and loaded correctly

export const testLocalStorage = () => {
  console.log('🧪 STORAGE TEST: Starting localStorage test...');
  
  try {
    // Test basic localStorage
    const testKey = 'irtzalink_test';
    const testData = { 
      name: 'Test User',
      bio: 'Test Bio',
      timestamp: new Date().toISOString()
    };
    
    // Save test data
    localStorage.setItem(testKey, JSON.stringify(testData));
    console.log('✅ STORAGE TEST: Data saved to localStorage');
    
    // Load test data
    const loadedData = localStorage.getItem(testKey);
    if (loadedData) {
      const parsedData = JSON.parse(loadedData);
      console.log('✅ STORAGE TEST: Data loaded from localStorage:', parsedData);
      
      // Clean up
      localStorage.removeItem(testKey);
      console.log('✅ STORAGE TEST: Test completed successfully');
      return true;
    } else {
      console.error('❌ STORAGE TEST: Failed to load data');
      return false;
    }
  } catch (error) {
    console.error('❌ STORAGE TEST: Error during test:', error);
    return false;
  }
};

export const debugUserData = (userId) => {
  console.log('🔍 DEBUG: Checking user data in localStorage...');
  
  try {
    // Check all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log('🔍 DEBUG: All localStorage keys:', allKeys);
    
    // Look for IrtzaLink related keys
    const irtzaKeys = allKeys.filter(key => key.includes('irtzalink') || key.includes('user'));
    console.log('🔍 DEBUG: IrtzaLink related keys:', irtzaKeys);
    
    // Check specific user data
    const userDataKey = 'irtzalink_user_data_v2';
    const userData = localStorage.getItem(userDataKey);
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('🔍 DEBUG: Found user data:', parsedData);
      
      if (parsedData.userId === userId) {
        console.log('✅ DEBUG: User ID matches:', userId);
        console.log('✅ DEBUG: User data details:', parsedData.userData);
      } else {
        console.log('⚠️ DEBUG: User ID mismatch. Expected:', userId, 'Found:', parsedData.userId);
      }
    } else {
      console.log('❌ DEBUG: No user data found in localStorage');
    }
    
    return { allKeys, irtzaKeys, userData: userData ? JSON.parse(userData) : null };
  } catch (error) {
    console.error('❌ DEBUG: Error during debug:', error);
    return null;
  }
};