# OLX Lebanon — React Native Clone

A fully functional React Native CLI clone of [OLX Lebanon](https://www.olx.com.lb), built as a technical assessment. The app connects to the real OLX Lebanon API and Elasticsearch backend to display live listings, supports filtering by category, location, price, and dynamic category-specific fields, and ships with full Arabic/English bilingual support including RTL layout.

---

## How to Run

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 22.11.0 |
| React Native CLI | via `@react-native-community/cli` |
| Android Studio + Android SDK | API 33+ recommended |
| Xcode (macOS only) | 15+ |
| JDK | 17 |

### 1. Install dependencies

```bash
cd MyApp
npm install
```

### 2. iOS (macOS only)

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### 3. Android

```bash
npx react-native run-android
```

> **Network note (Android):** The app communicates with `search.mena.sector.run` over HTTP. The `android/app/src/main/res/xml/network_security_config.xml` already permits cleartext traffic for that domain, so no extra config is needed.

### 4. Start Metro bundler separately (optional)

```bash
npx react-native start
```

---

## Project Overview

### Screens

| Screen | Description |
|---|---|
| **Home** | Location header, search bar, auto-scrolling banner carousel, browse-by-category row, horizontal ad sections (Cars for Sale, International Properties). Pull-to-refresh updates all sections. Language toggle in the header switches between English and Arabic. |
| **Search Results** | Vertical paginated list of ads with infinite scroll. Elite ads rendered in a larger full-width card at the top. Filter chips row for quick location/category removal. Sort modal (Newest, Price ↑, Price ↓). Skeleton loading states and illustrated empty/error states. |
| **Search Filters** | Category picker (two-level tree with search), location picker (Lebanese governorates from the API), price range inputs, and dynamic category-specific fields auto-rendered from the `categoryFields` API — no hardcoded filter list. Live result count button debounced at 600 ms. |

### Core Architecture

**Context API over Redux**
Global state (language, RTL flag, categories, category fields map) lives in a single `AppContext`. Three screens and no deeply nested prop-drilling made Redux unnecessary overhead; Context keeps the code readable for any reviewer.

**Axios with separate instances**
Two Axios instances are configured in `axiosInstance.ts`:
- `olxApi` → `https://www.olx.com.lb/api` — categories and category fields
- `searchApi` → `https://search.mena.sector.run` — Elasticsearch `_msearch`

**Elasticsearch `_msearch` / NDJSON**
The search endpoint is not standard JSON. Each request is two newline-delimited JSON objects:
```
{"index":"olx-lb-production-ads-en"}
{"from":0,"size":12,"query":{...},"sort":[...]}
```
`Content-Type` must be `application/x-ndjson`. Sending a regular JSON body returns a `400`. The `buildNdjson()` helper in `adsApi.ts` handles this.

**Dynamic filter field mapping**
The `categoryFields` API returns a list of fields per category (brand, mileage, year, color, etc.) with a `filterType` and optional `choices`. The `DynamicFilterField` component maps each type to a UI component at runtime:

| `filterType` | Rendered as |
|---|---|
| `select` / `multiselect` (≤ 6 choices) | Inline `ChipGroup` |
| `select` / `multiselect` (> 6 choices) | Tappable row → `OptionPickerModal` |
| `range` / `number` | `RangeInput` (min/max pair) |

Changing the top-level category resets all dynamic field values to prevent stale filter state.

**Price field quirk**
`_source.price` in the OLX Elasticsearch index is always `0` (a legacy unused field). The real price lives in `_source.extraFields.price`. All price display, filtering, and sorting use `extraFields.price`.

**RTL / Language switching**
Language preference is persisted via `AsyncStorage`. On startup, `App.tsx` reads the stored language, applies `I18nManager.forceRTL()`, and passes the language to `AppProvider` so the correct translations load before the first render. Switching language at runtime calls `I18nManager.forceRTL()` again then reloads via `DevSettings.reload()` (dev) or prompts a manual restart (production), since React Native requires a full reload for RTL layout direction to take effect. Directional SVG icons (back arrows, chevrons) apply `transform: [{ scaleX: -1 }]` when `I18nManager.isRTL` is true.

**Skeleton loading**
A shared `Skeleton` component (pulsing `Animated.Value` on the native driver) powers all loading states. Three convenience wrappers — `VerticalCardSkeleton`, `HorizontalCardSkeleton`, `CategorySkeleton` — are composed wherever data is being fetched, replacing all `ActivityIndicator` spinners.

**No external UI libraries**
All styling uses `StyleSheet.create`. All icons are hand-crafted SVG paths via `react-native-svg`. No component libraries, no Tailwind, no icon packs.

### Folder Structure

```
src/
  api/          # Axios instances, adsApi, categoriesApi
  components/
    filters/    # CategoryPickerModal, LocationPickerModal, OptionPickerModal,
                #   ChipGroup, RangeInput, DynamicFilterField
    home/       # LocationHeader, BannerCarousel, CategoriesRow, AdSectionRow
    search/     # SearchHeader, FilterChipsRow, EliteAdCard, SortModal, LoadingSkeleton
    AdCard.tsx
    LanguageSwitcher.tsx
    Skeleton.tsx
  hooks/        # useFetchAds, useCategories, useLocations
  i18n/         # en.json, ar.json, i18next config
  navigation/   # RootNavigator (Stack), BottomTabNavigator
  screens/      # HomeScreen, SearchResultsScreen, SearchFiltersScreen
  store/        # AppContext
  theme/        # colors, typography, spacing
  types/        # All TypeScript interfaces
  utils/        # formatters (price, timestamp, truncate)
```

### Key Dependencies

| Package | Purpose |
|---|---|
| `react-native` 0.84 | Core framework |
| `@react-navigation/stack` + `bottom-tabs` | Navigation |
| `axios` | HTTP client |
| `i18next` + `react-i18next` | Internationalisation |
| `@react-native-async-storage/async-storage` | Language preference persistence |
| `react-native-svg` | All icons and empty-state illustrations |
| `react-native-safe-area-context` | Safe insets on notched devices |
| `react-native-gesture-handler` | Required by React Navigation |
