# Favorites and Collections Components

This directory contains React components for managing user favorites and collections in the stylesnprofiles application. All components use System 6 styling and modern React patterns.

## Components Overview

### Main Components

#### `FavoritesPanel`
Displays user's favorites with filtering, pagination, and search functionality.

**Props:**
- `onError` (function) - Error handler callback

**Features:**
- Search functionality with debounced input
- Filter by content type (APOD, NEO, MARS, EPIC)
- Pagination controls
- Loading states and error handling
- Responsive grid layout

#### `CollectionsPanel`
Manages user's collections with create, view, and delete functionality.

**Props:**
- `onError` (function) - Error handler callback

**Features:**
- Grid view of collections
- Create new collection modal
- Delete collection with confirmation
- Collection metadata display (item count, public status, creation date)

#### `CollectionDetail`
Shows detailed view of a collection with its items and management options.

**Props:**
- `collection` (object) - Collection data
- `onBack` (function) - Navigation callback
- `onCollectionUpdate` (function) - Update callback
- `onError` (function) - Error handler callback

**Features:**
- Display collection items with drag-and-drop reordering
- Add/remove items from collection
- Edit collection details
- Back navigation to collections list

### Card Components

#### `FavoriteCard`
Displays a single favorite item with actions.

**Props:**
- `favorite` (object) - Favorite item data
- `onRemove` (function) - Remove callback
- `onError` (function) - Error handler callback

**Features:**
- Image thumbnail with fallback
- Content metadata (type, date, description)
- Remove from favorites action
- Add to collection functionality

#### `AddToCollectionButton`
Button component for adding items to collections.

**Props:**
- `itemId` (string) - ID of the item to add
- `itemType` (string) - Type of the item
- `collectionId` (string, optional) - Specific collection ID
- `collectionName` (string, optional) - Collection name
- `onSuccess` (function) - Success callback
- `onError` (function) - Error handler callback

**Features:**
- Two modes: specific collection or dropdown
- Shows existing collections in dropdown
- Indicates items already in collections
- Loading states and error handling

### Modal Components

#### `CreateCollectionModal`
Modal for creating new collections.

**Props:**
- `onClose` (function) - Close callback
- `onCollectionCreated` (function) - Success callback
- `onError` (function) - Error handler callback

**Features:**
- Form validation
- Character count display
- Public/private collection option
- Keyboard shortcuts (ESC to close)

#### `EditCollectionModal`
Modal for editing existing collections.

**Props:**
- `collection` (object) - Collection data to edit
- `onClose` (function) - Close callback
- `onCollectionUpdated` (function) - Success callback
- `onError` (function) - Error handler callback

**Features:**
- Edit collection name and description
- Change public/private status
- Delete collection with confirmation
- Display collection metadata

## Styling

All components use System 6 CSS styling with the following design principles:

- **Colors**: Black, white, and grey palette
- **Typography**: Chicago and Geneva fonts
- **Interactions**: Click feedback and hover states
- **Layout**: Grid-based responsive design
- **Animations**: Subtle motion with Framer Motion

## Usage Examples

### Basic Favorites Panel

```jsx
import { FavoritesPanel } from '../components/favorites';

function MyFavorites() {
  const handleError = (error) => {
    console.error('Favorites error:', error);
  };

  return (
    <FavoritesPanel onError={handleError} />
  );
}
```

### Collections with Management

```jsx
import { CollectionsPanel } from '../components/favorites';

function MyCollections() {
  const handleError = (error) => {
    console.error('Collections error:', error);
  };

  return (
    <CollectionsPanel onError={handleError} />
  );
}
```

### Add to Collection Button

```jsx
import { AddToCollectionButton } from '../components/favorites';

function AddItemToCollection({ itemId, itemType }) {
  const handleSuccess = (collectionId) => {
    console.log('Item added to collection:', collectionId);
  };

  const handleError = (error) => {
    console.error('Add to collection error:', error);
  };

  return (
    <AddToCollectionButton
      itemId={itemId}
      itemType={itemType}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}

// Specific collection button
<AddToCollectionButton
  itemId="item123"
  itemType="APOD"
  collectionId="collection456"
  collectionName="My Space Photos"
  onSuccess={() => console.log('Added to specific collection')}
/>
```

### Favorite Card in a Grid

```jsx
import { FavoriteCard } from '../components/favorites';

function FavoritesGrid({ favorites }) {
  const handleRemove = (itemId) => {
    // Remove item logic
  };

  const handleError = (error) => {
    console.error('Card error:', error);
  };

  return (
    <div className="favorites-grid">
      {favorites.map(favorite => (
        <FavoriteCard
          key={favorite.id}
          favorite={favorite}
          onRemove={handleRemove}
          onError={handleError}
        />
      ))}
    </div>
  );
}
```

## Data Structures

### Favorite Item

```javascript
{
  id: "string",
  type: "APOD" | "NEO" | "MARS" | "EPIC",
  title: "string",
  description: "string",
  url: "string",
  date: "string", // ISO date string
  // ... other metadata fields
}
```

### Collection

```javascript
{
  id: "string",
  name: "string",
  description: "string",
  is_public: boolean,
  created_at: "string", // ISO date string
  updated_at: "string", // ISO date string
  item_count: number,
  items: Array // Collection items (in CollectionDetail)
}
```

## State Management

Components use React hooks for local state management:
- `useState` for component state
- `useEffect` for side effects and data fetching
- `useCallback` for memoized event handlers
- `useContext` for authentication context

## Error Handling

All components include comprehensive error handling:
- API error catching and display
- User-friendly error messages
- Retry mechanisms where appropriate
- Error boundary integration

## Performance Optimizations

- Debounced search input to reduce API calls
- Lazy loading for images
- Efficient re-renders with useCallback
- Virtual scrolling for large lists (if needed)
- Pagination to manage data loading

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management in modals

## Testing

Components are structured to be easily testable:
- Prop-based configuration
- Mockable service dependencies
- Isolated component logic
- Clear state management

## Future Enhancements

- Offline support with service workers
- Bulk operations on items
- Collection sharing and collaboration
- Advanced filtering and sorting
- Collection templates
- Import/export functionality