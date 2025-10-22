// Cleanup utility to remove all face-related data from localStorage
// Run this once to clean up any existing face data after removing face recognition

export const cleanupFaceData = () => {
  console.log('🧹 Cleaning up face recognition data...');
  
  const keysToRemove = [];
  
  // Scan all localStorage keys for face-related data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('sfm_face_') ||
      key.includes('face_descriptor') ||
      key.includes('face_profile') ||
      key.includes('face_mongodb')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
  });
  
  console.log(`✅ Cleanup complete! Removed ${keysToRemove.length} face-related items from localStorage`);
  
  return keysToRemove.length;
};

// Auto-run cleanup when this module is imported
cleanupFaceData();