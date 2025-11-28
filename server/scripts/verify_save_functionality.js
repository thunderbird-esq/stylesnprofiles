const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1/users/favorites';
const TEST_ITEM = {
  itemType: 'APOD',
  itemId: 'test-apod-verification',
  itemDate: '2025-01-01',
  data: {
    title: 'Verification Test APOD',
    url: 'https://example.com/test.jpg',
    media_type: 'image',
    description: 'This is a test item for verification.',
  },
};

async function verifySave() {
  console.log('🧪 Starting Save Functionality Verification...');

  try {
    // 1. Add Item
    console.log('1️⃣  Adding test favorite...');
    try {
      await axios.post(API_URL, TEST_ITEM);
      console.log('   ✅ Item added successfully.');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('   ℹ️  Item already exists, proceeding...');
      } else {
        throw error;
      }
    }

    // 2. Verify Item Exists
    console.log('2️⃣  Verifying item in list...');
    const response = await axios.get(API_URL);
    const favorites = response.data.favorites || [];
    const found = favorites.find(f => f.id === TEST_ITEM.itemId);

    if (found) {
      console.log('   ✅ Item found in favorites list.');
    } else {
      console.error('   ❌ Item NOT found in favorites list.');
      process.exit(1);
    }

    // 3. Clean up
    console.log('3️⃣  Cleaning up...');
    await axios.delete(`${API_URL}/${TEST_ITEM.itemId}`);
    console.log('   ✅ Item removed.');

    console.log('🎉 Verification PASSED!');
  } catch (error) {
    console.error('❌ Verification FAILED:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

verifySave();
