# Favorites and Collections API Documentation

This document describes the enhanced Favorites and Collections API endpoints for the NASA System 6 Portal.

## Overview

The Favorites and Collections API provides comprehensive functionality for:
- Managing user favorites with soft delete, tagging, and notes
- Organizing favorites into collections with custom ordering
- Full-text search with relevance scoring
- Public collections discovery
- Pagination and filtering capabilities

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Favorites API

### Base URL
`/api/favorites`

### Endpoints

#### Get Favorites (Paginated)

**GET** `/api/favorites`

Retrieves a paginated list of favorites for the authenticated user.

**Query Parameters:**
- `page` (optional, number, default: 1) - Page number (1-based)
- `limit` (optional, number, default: 20) - Items per page (1-100)
- `type` (optional, string) - Filter by item type (APOD, NEO, MARS, EPIC, EARTH, IMAGES)
- `archived` (optional, boolean, default: false) - Include archived items

**Response:**
```json
{
  "favorites": [
    {
      "id": "string",
      "user_id": "uuid",
      "type": "APOD|NEO|MARS|EPIC|EARTH|IMAGES",
      "title": "string",
      "url": "string",
      "hd_url": "string",
      "media_type": "image|video",
      "category": "string",
      "description": "string",
      "copyright": "string",
      "date": "YYYY-MM-DD",
      "saved_at": "ISO8601",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "metadata": {},
      "is_archived": false,
      "user_note": "string",
      "user_tags": ["string"],
      "is_favorite": false,
      "collection_count": 0,
      "collection_names": ["string"]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
GET /api/favorites?page=1&limit=10&type=APOD
```

#### Get Favorite by ID

**GET** `/api/favorites/{favoriteId}`

Retrieves a specific favorite item.

**Response:**
```json
{
  "id": "string",
  "user_id": "uuid",
  "type": "APOD|NEO|MARS|EPIC|EARTH|IMAGES",
  "title": "string",
  "url": "string",
  "hd_url": "string",
  "media_type": "image|video",
  "category": "string",
  "description": "string",
  "copyright": "string",
  "date": "YYYY-MM-DD",
  "saved_at": "ISO8601",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "metadata": {},
  "is_archived": false,
  "user_note": "string",
  "user_tags": ["string"],
  "is_favorite": false,
  "collection_count": 0,
  "collection_names": ["string"]
}
```

#### Add Favorite

**POST** `/api/favorites`

Adds a new item to favorites.

**Request Body:**
```json
{
  "itemType": "APOD|NEO|MARS|EPIC|EARTH|IMAGES",
  "itemId": "string",
  "itemDate": "YYYY-MM-DD",
  "data": {
    "title": "string",
    "url": "string",
    "hd_url": "string",
    "media_type": "image|video",
    "category": "string",
    "description": "string",
    "copyright": "string",
    "metadata": {}
  }
}
```

**Response:**
```json
{
  "id": "string",
  "user_id": "uuid",
  "type": "APOD|NEO|MARS|EPIC|EARTH|IMAGES",
  "title": "string",
  "url": "string",
  "hd_url": "string",
  "media_type": "image",
  "category": "string",
  "description": "string",
  "copyright": "string",
  "date": "YYYY-MM-DD",
  "saved_at": "ISO8601",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "metadata": {},
  "is_archived": false,
  "user_note": null,
  "user_tags": [],
  "is_favorite": false
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid item type
- `409 Conflict` - Item already in favorites

#### Update Favorite

**PATCH** `/api/favorites/{favoriteId}`

Updates a favorite item with user notes, tags, or favorite status.

**Request Body:**
```json
{
  "userNote": "string",
  "userTags": ["string"],
  "isFavorite": true
}
```

**Response:** Updated favorite object

**Error Responses:**
- `404 Not Found` - Favorite not found

#### Remove Favorite (Soft Delete)

**DELETE** `/api/favorites/{favoriteId}`

Archives a favorite item (soft delete).

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Favorite not found

#### Search Favorites

**GET** `/api/favorites/search`

Searches favorites with full-text search and relevance scoring.

**Query Parameters:**
- `q` (required, string) - Search query
- `page` (optional, number, default: 1) - Page number
- `limit` (optional, number, default: 20) - Items per page
- `types` (optional, array) - Filter by item types
- `tags` (optional, array) - Filter by user tags

**Response:**
```json
{
  "favorites": [
    {
      "id": "string",
      "type": "APOD",
      "title": "string",
      "url": "string",
      "category": "string",
      "description": "string",
      "saved_at": "ISO8601",
      "relevance_score": 0.95,
      "collection_count": 2,
      "collection_names": ["Space", "Planets"]
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "search": {
    "query": "nebula",
    "types": ["APOD", "IMAGES"],
    "tags": ["space"]
  }
}
```

**Example Request:**
```bash
GET /api/favorites/search?q=nebula&page=1&limit=10&types=APOD&tags=space
```

#### Get Favorite Statistics

**GET** `/api/favorites/stats`

Retrieves statistics for the user's favorites.

**Response:**
```json
{
  "totalFavorites": 150,
  "archivedCount": 10,
  "markedFavorites": 25,
  "uniqueTypes": 4,
  "types": ["APOD", "NEO", "MARS", "IMAGES"],
  "firstSaved": "2024-01-15T10:30:00Z",
  "lastSaved": "2024-11-20T14:45:00Z"
}
```

## Collections API

### Base URL
`/api/collections`

### Endpoints

#### Get Collections (Paginated)

**GET** `/api/collections`

Retrieves a paginated list of collections for the authenticated user.

**Query Parameters:**
- `page` (optional, number, default: 1) - Page number
- `limit` (optional, number, default: 20) - Items per page (1-100)
- `includePublic` (optional, boolean, default: false) - Include public collections from other users

**Response:**
```json
{
  "collections": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "description": "string",
      "is_public": false,
      "cover_image_url": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "item_count": 15,
      "owner_username": "string",
      "owner_display_name": "string",
      "is_owner": true
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Get Collection by ID

**GET** `/api/collections/{collectionId}`

Retrieves a specific collection.

**Response:** Collection object with item count

#### Create Collection

**POST** `/api/collections`

Creates a new collection.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "isPublic": false
}
```

**Response:** Created collection object

**Error Responses:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - Collection with this name already exists

#### Update Collection

**PATCH** `/api/collections/{collectionId}`

Updates a collection.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "isPublic": true
}
```

**Response:** Updated collection object

**Error Responses:**
- `404 Not Found` - Collection not found
- `409 Conflict` - Collection with this name already exists

#### Delete Collection

**DELETE** `/api/collections/{collectionId}`

Deletes a collection and all its items.

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Collection not found

#### Add Item to Collection

**POST** `/api/collections/{collectionId}/items`

Adds an item to a collection with optional position and notes.

**Request Body:**
```json
{
  "itemId": "string",
  "position": 0,
  "notes": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "collection_id": "uuid",
  "item_id": "string",
  "position": 0,
  "notes": "string",
  "added_at": "ISO8601",
  "collection": {
    "id": "uuid",
    "user_id": "uuid",
    "is_public": false
  },
  "item": {
    "id": "string",
    "title": "string"
  }
}
```

**Error Responses:**
- `404 Not Found` - Collection or item not found
- `409 Conflict` - Item already in collection

#### Remove Item from Collection

**DELETE** `/api/collections/{collectionId}/items/{itemId}`

Removes an item from a collection and reorders remaining items.

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Item not in collection

#### Get Collection Items (Paginated)

**GET** `/api/collections/{collectionId}/items`

Retrieves paginated items from a collection.

**Query Parameters:**
- `page` (optional, number, default: 1) - Page number
- `limit` (optional, number, default: 20) - Items per page (1-100)

**Response:**
```json
{
  "collection": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "is_public": false,
    "item_count": 50
  },
  "items": [
    {
      "id": "string",
      "type": "APOD",
      "title": "string",
      "url": "string",
      "position": 0,
      "collection_notes": "string",
      "added_to_collection_at": "ISO8601"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Reorder Collection Items

**PATCH** `/api/collections/{collectionId}/items/reorder`

Reorders items in a collection.

**Request Body:**
```json
[
  {
    "itemId": "string",
    "position": 0
  },
  {
    "itemId": "string",
    "position": 1
  }
]
```

**Response:** `200 OK` with success status

**Error Responses:**
- `404 Not Found` - Collection not found
- `400 Bad Request` - Invalid order data

#### Get Collection Statistics

**GET** `/api/collections/stats`

Retrieves statistics for the user's collections.

**Response:**
```json
{
  "totalCollections": 8,
  "publicCollections": 2,
  "privateCollections": 6,
  "totalItemsInCollections": 125,
  "avgItemsPerCollection": 15.6
}
```

#### Get Public Collections

**GET** `/api/collections/public`

Retrieves public collections with optional search.

**Query Parameters:**
- `page` (optional, number, default: 1) - Page number
- `limit` (optional, number, default: 20) - Items per page
- `search` (optional, string) - Search query

**Response:**
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "is_public": true,
      "item_count": 25,
      "owner_username": "string",
      "owner_display_name": "string",
      "relevance_score": 0.95,
      "is_owner": false
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful request with no content
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Performance Considerations

- All queries use proper indexes and avoid N+1 problems
- Pagination is implemented with LIMIT/OFFSET
- Full-text search uses PostgreSQL's built-in capabilities
- Database connection pooling is configured
- Response times are optimized for large datasets

## Database Schema

The API uses the following enhanced database tables:

### saved_items (Enhanced)
- `is_archived` - Soft delete flag
- `user_note` - Personal notes
- `user_tags` - User-defined tags
- `is_favorite` - Special favorite flag

### collection_items (Enhanced)
- `position` - Ordering within collection
- `notes` - Collection-specific notes

### Additional Views and Functions
- `enhanced_favorites` - View with collection information
- `enhanced_collections` - View with detailed statistics
- `search_favorites()` - Full-text search function
- `get_collection_statistics()` - Statistics function
- `search_public_collections()` - Public collections search