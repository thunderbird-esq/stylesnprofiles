const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '../../client/src/components/favorites/favorites.css');
const SYSTEM_CSS_PATH = path.join(__dirname, '../../client/src/styles/system.css');

const REQUIRED_CLASSES = [
  '.favorites-panel',
  '.favorites-header',
  '.favorites-grid',
  '.empty-state',
  '.pagination-container',
];

const REQUIRED_VARS = [
  '--secondary-rgb',
];

function verifyStyling() {
  console.log('🎨 Starting Styling Verification...');

  try {
    // 1. Check favorites.css
    console.log('1️⃣  Checking favorites.css...');
    if (!fs.existsSync(CSS_PATH)) {
      console.error('   ❌ favorites.css not found!');
      process.exit(1);
    }
    const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
    let allFound = true;
    REQUIRED_CLASSES.forEach(cls => {
      if (cssContent.includes(cls)) {
        console.log(`   ✅ Found class: ${cls}`);
      } else {
        console.error(`   ❌ Missing class: ${cls}`);
        allFound = false;
      }
    });

    // 2. Check system.css
    console.log('2️⃣  Checking system.css...');
    if (!fs.existsSync(SYSTEM_CSS_PATH)) {
      console.error('   ❌ system.css not found!');
      process.exit(1);
    }
    const systemCssContent = fs.readFileSync(SYSTEM_CSS_PATH, 'utf8');
    REQUIRED_VARS.forEach(variable => {
      if (systemCssContent.includes(variable)) {
        console.log(`   ✅ Found variable: ${variable}`);
      } else {
        console.error(`   ❌ Missing variable: ${variable}`);
        allFound = false;
      }
    });

    if (allFound) {
      console.log('🎉 Styling Verification PASSED!');
    } else {
      console.error('❌ Styling Verification FAILED: Missing classes or variables.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification FAILED:', error.message);
    process.exit(1);
  }
}

verifyStyling();
