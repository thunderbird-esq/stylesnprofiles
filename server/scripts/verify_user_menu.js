const fs = require('fs');
const path = require('path');

const MENU_BAR_PATH = path.join(__dirname, '../../client/src/components/system6/MenuBar.js');

function verifyUserMenu() {
  console.log('👤 Starting User Menu Verification...');

  try {
    if (!fs.existsSync(MENU_BAR_PATH)) {
      console.error('   ❌ MenuBar.js not found!');
      process.exit(1);
    }

    const content = fs.readFileSync(MENU_BAR_PATH, 'utf8');

    // Check for useAuth import
    if (content.includes("import { useAuth } from '../../contexts/AuthContext'")) {
      console.log('   ✅ Found useAuth import.');
    } else {
      console.error('   ❌ Missing useAuth import.');
      process.exit(1);
    }

    // Check for user usage
    if (content.includes('const { user } = useAuth()')) {
      console.log('   ✅ Found useAuth hook usage.');
    } else {
      console.error('   ❌ Missing useAuth hook usage.');
      process.exit(1);
    }

    // Check for rendering user.username
    if (content.includes('user.username')) {
      console.log('   ✅ Found user.username rendering.');
    } else {
      console.error('   ❌ Missing user.username rendering.');
      process.exit(1);
    }

    console.log('🎉 User Menu Verification PASSED!');

  } catch (error) {
    console.error('❌ Verification FAILED:', error.message);
    process.exit(1);
  }
}

verifyUserMenu();
