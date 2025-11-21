# JSDoc Quick Reference Guide

## Using JSDoc in Your IDE

### VS Code IntelliSense
The JSDoc annotations enable powerful autocomplete and type checking:

1. **Function Autocomplete:**
   ```javascript
   // Just start typing and see all available functions
   const cache = require('./middleware/cache');
   cache. // ← IntelliSense shows all functions with descriptions
   ```

2. **Parameter Hints:**
   ```javascript
   // Hover over function to see parameters and types
   cache.generateCacheKey(req, 'nasa');
   //                      ↑    ↑
   //                   required optional
   ```

3. **Type Checking:**
   ```javascript
   // JS with JSDoc gives TypeScript-like errors
   cache.cache('wrong type'); // IDE warns: expects number, got string
   ```

## Common Patterns

### Route Handlers

```javascript
/**
 * Get User Profile
 * Retrieves user profile data with caching
 *
 * @function getUserProfile
 * @async
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {DatabaseError} If database query fails
 * @example
 * router.get('/profile', authenticateToken, getUserProfile);
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await query('SELECT * FROM users WHERE id = $1', [userId]);
  res.json({ success: true, data: profile.rows[0] });
});
```

### Middleware

```javascript
/**
 * Validate User Input
 * Validates and sanitizes user input data
 *
 * @function validateUserInput
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 * @example
 * router.post('/users', validateUserInput, createUser);
 */
const validateUserInput = (req, res, next) => {
  // Validation logic
  next();
};
```

### Utility Functions

```javascript
/**
 * Format Date for API
 * Converts Date object to ISO string for API responses
 *
 * @function formatDate
 * @param {Date} date - Date to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeTime=true] - Include time component
 * @returns {string} Formatted date string
 * @example
 * const formatted = formatDate(new Date(), { includeTime: false });
 * // Returns: "2024-01-01"
 */
const formatDate = (date, options = {}) => {
  // Implementation
};
```

### Classes

```javascript
/**
 * API Client Class
 * Generic API client with retry and timeout support
 *
 * @class ApiClient
 * @param {Object} config - Configuration object
 * @param {string} config.baseURL - API base URL
 * @param {number} [config.timeout=10000] - Request timeout in ms
 * @example
 * const client = new ApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000
 * });
 */
class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make API Request
   * @param {string} endpoint - API endpoint
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    // Implementation
  }
}
```

## Type Annotations Reference

### Basic Types
```javascript
@param {string} name - A string parameter
@param {number} age - A number parameter
@param {boolean} active - A boolean parameter
@param {Object} data - An object
@param {Array} items - An array
@param {Function} callback - A function
@param {*} anything - Any type
```

### Optional and Default Values
```javascript
@param {string} [name] - Optional parameter
@param {number} [age=18] - Optional with default value
@param {Object} [options={}] - Optional object with default
```

### Complex Types
```javascript
@param {string[]} tags - Array of strings
@param {Array<number>} scores - Array of numbers
@param {Promise<Object>} promise - Promise resolving to object
@param {express.Request} req - Express request
@param {Error|null} error - Union type
```

### Object Properties
```javascript
/**
 * @param {Object} user - User object
 * @param {string} user.name - User's name
 * @param {number} user.age - User's age
 * @param {string[]} user.roles - User's roles
 */
```

### Return Types
```javascript
@returns {void} - Function returns nothing
@returns {string} - Returns a string
@returns {Promise<Object>} - Returns promise
@returns {Object} User data - Returns object with description
```

## Example Code with Full Documentation

```javascript
/**
 * User Management Module
 * Handles user CRUD operations with validation and caching
 *
 * @fileoverview User management with authentication and caching
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module routes/users
 * @requires express
 * @requires ../middleware/auth
 * @requires ../middleware/cache
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { cacheUser } = require('../middleware/cache');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Get All Users
 * Retrieves paginated list of users with optional filtering
 *
 * @function getAllUsers
 * @async
 * @param {express.Request} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.role] - Filter by role
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {DatabaseError} If database query fails
 * @throws {ValidationError} If query parameters are invalid
 *
 * @example
 * // GET /api/users?page=1&limit=10&role=admin
 * // Response:
 * // {
 * //   "success": true,
 * //   "data": {
 * //     "users": [...],
 * //     "pagination": { "page": 1, "limit": 10, "total": 100 }
 * //   }
 * // }
 */
router.get('/',
  authenticateToken,
  cacheUser(600),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;

    // Implementation
    const users = await fetchUsers({ page, limit, role });

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total: users.length }
      }
    });
  })
);

module.exports = router;
```

## Benefits in Your Editor

### 1. Autocomplete
- Type `cache.` and see all methods
- See parameter names and types
- View function descriptions inline

### 2. Parameter Hints
- Hover to see what each parameter does
- Know which parameters are optional
- See default values

### 3. Error Detection
- Wrong parameter types highlighted
- Missing required parameters shown
- Invalid property access caught

### 4. Quick Navigation
- Ctrl/Cmd + Click to jump to definition
- See where functions are used
- Find all references

### 5. Refactoring Support
- Rename safely across files
- See all usages before changing
- Update documentation alongside code

## Tips for Writing JSDoc

1. **Keep It Current:** Update JSDoc when changing code
2. **Be Specific:** Use exact types, not just "Object"
3. **Add Examples:** Complex functions benefit from examples
4. **Document Errors:** List all possible throws
5. **Use @since:** Track when features were added
6. **Link Related:** Use {@link} to reference related functions
7. **Validate:** Use JSDoc linting to catch mistakes

## Generating HTML Documentation

```bash
# Install JSDoc
npm install -g jsdoc

# Generate docs
cd server
jsdoc -r . -d ../docs/api

# View docs
open ../docs/api/index.html
```

## IDE Setup

### VS Code
1. Install "JavaScript and TypeScript Nightly" extension
2. Add to `.vscode/settings.json`:
```json
{
  "javascript.suggest.jsdoc": true,
  "javascript.validate.enable": true
}
```

### WebStorm/IntelliJ
- JSDoc support is built-in
- Enable in Settings → Editor → Inspections → JavaScript

### Sublime Text
- Install "DocBlockr" package
- Type `/**` and press Enter to auto-generate

---

**Quick Reference Created:** November 13, 2025
**For:** NASA System 6 Portal Development Team
**Updated:** As documentation evolves
