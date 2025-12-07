# System 6 Design Standards

This document defines the design standards for Apple System 6 HIG compliance.

## Color Tokens

Always use CSS custom properties for colors:

```css
/* ✅ Correct */
color: var(--secondary);
background: var(--primary);
border-color: var(--tertiary);

/* ❌ Incorrect */
color: #000;
background: white;
```

### Available Color Tokens
- `--primary` - White (#FFFFFF)
- `--secondary` - Black (#000000)
- `--tertiary` - Grey (#A5A5A5)
- `--disabled` - DarkGrey (#B6B7B8)

## Font Sizing

Use the font sizing variables for consistent scaling:

```css
/* Available sizes */
--font-size-sm: 10px;
--font-size-base: 12px;   /* Default */
--font-size-lg: 16px;     /* 40% larger */
--font-size-xl: 21px;     /* 75% larger */
--font-size-xxl: 24px;    /* 2x base */
```

### Utility Classes
- `.text-sm` - Small text
- `.text-base` - Base text
- `.text-lg` - Large text (40% larger)
- `.text-xl` - Extra large text (75% larger)
- `.text-xxl` - Double size text

### App Container Scaling
Apply `.app-text-lg` to an app container to scale all text 40% larger:

```jsx
<div className="app-text-lg">
  {/* All text inside will be 16px instead of 12px */}
</div>
```

## Font Families

```css
/* Chicago - Headers, titles */
font-family: Chicago_12;

/* Geneva - Body text (smaller sizes) */
font-family: Geneva_9;

/* Monaco - Monospace code */
font-family: Monaco;
```

## Local Assets Only

All assets must be loaded locally, never from CDN:

```css
/* ✅ Correct - Local asset */
background-image: url('icon/scrollbar-up.svg');
src: url('fonts/ChicagoFLF.woff2');

/* ❌ Incorrect - CDN */
src: url('https://fonts.googleapis.com/...');
```

## Scrollbar Styling

Scrollbars use SVG icons from `client/src/styles/icon/`:
- `scrollbar-up.svg` / `scrollbar-up-active.svg`
- `scrollbar-down.svg` / `scrollbar-down-active.svg`
- `scrollbar-left.svg` / `scrollbar-left-active.svg`
- `scrollbar-right.svg` / `scrollbar-right-active.svg`

## Buttons

Use `.btn` class with Chicago_12 font:

```jsx
<button className="btn">Click Me</button>
```

## Windows

Windows require:
- `.window` container
- `.title-bar` with `.title` for header
- `.window-pane` for scrollable content

## Linting

Run CSS lint: `npm run lint:css`
