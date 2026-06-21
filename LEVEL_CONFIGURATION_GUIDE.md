# Game Level Dropdown & Difficulty Configuration - Implementation Summary

## Changes Made

### 1. **New Configuration File** - `src/config/levelDifficulty.ts`
Created a dedicated configuration file for all difficulty parameters. This makes it extremely easy to adjust levels in the future without touching game logic.

**Key Features:**
- Supports levels **0-10** (11 total levels)
- Each level has configurable difficulty parameters:
  - `minMax` - Minimum maximum operand value
  - `maxMax` - Maximum operand value at highest progress
  - `allowSubtraction` - Enable/disable subtraction operations
  - `subtractionChance` - Probability of subtraction (0-1)
  - `startFallDuration` - Initial ball fall time (ms)
  - `minFallDuration` - Minimum fall duration (ms)
  - `speedUpPerPoint` - How much faster balls fall per score point

**Helper Functions:**
- `getDifficultyConfig(level)` - Get config for a specific level
- `getAvailableLevels()` - Get array of all available levels (0-10)
- `getLevelLabel(level)` - Get human-readable label (Beginner, Easy, Medium, etc.)
- `getLevelEmoji(level)` - Get emoji for a level (🌱, 🌿, 🌳, etc.)

### 2. **Updated Types** - `src/types/index.ts`
Changed `GameLevel` type to support levels **0-10**:
```typescript
export type GameLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
```

### 3. **Updated Question Generator** - `src/util/questionGenerator.ts`
- Imported the new difficulty configuration
- Created `generateGameLevels()` function to dynamically generate level configs from difficulty settings
- Updated `GAME_LEVELS` to use the new dynamic generation
- All level configs now come from the centralized difficulty configuration

### 4. **Updated Game Screen** - `src/screens/GameScreen.tsx`
- **Added Picker component** from React Native for dropdown selection
- Replaced chip-based level selection with dropdown menu
- Changed initial level from 1 to 0
- Added styles for the picker container and items:
  - `levelPickerContainer` - Container styling
  - `levelPicker` - Picker styling
  - `levelPickerItem` - Individual item styling

## Level Configuration Details

### Current Levels (0-10):
| Level | Label    | Range   | Subtraction | Start Duration |
| ----- | -------- | ------- | ----------- | -------------- |
| 0     | Beginner | 3-5     | No          | 10000ms        |
| 1     | Easy     | 5-9     | No          | 8000ms         |
| 2     | Medium   | 9-18    | Yes (25%)   | 6500ms         |
| 3     | Hard     | 15-30   | Yes (40%)   | 5500ms         |
| 4     | Expert   | 25-50   | Yes (50%)   | 4500ms         |
| 5     | Master   | 35-70   | Yes (60%)   | 4000ms         |
| 6     | Pro      | 50-100  | Yes (65%)   | 3500ms         |
| 7     | Legend   | 60-120  | Yes (70%)   | 3200ms         |
| 8     | Elite    | 75-150  | Yes (75%)   | 2900ms         |
| 9     | Supreme  | 100-200 | Yes (80%)   | 2600ms         |
| 10    | Extreme  | 150-300 | Yes (90%)   | 2300ms         |

## How to Customize Difficulties

### To adjust an existing level:
Edit `src/config/levelDifficulty.ts` and modify the `DIFFICULTY_LEVELS` object:

```typescript
export const DIFFICULTY_LEVELS: Record<number, LevelDifficultyConfig> = {
  0: {
    minMax: 3,        // ← Change this
    maxMax: 5,        // ← Or this
    allowSubtraction: false,
    subtractionChance: 0,
    startFallDuration: 10000,  // ← Adjust fall speed
    minFallDuration: 5000,
    speedUpPerPoint: 80,       // ← How much faster per point
  },
  // ... other levels
};
```

### To change level labels or emojis:
Edit the `getLevelLabel()` and `getLevelEmoji()` functions in `src/config/levelDifficulty.ts`:

```typescript
export function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    0: 'Beginner',  // ← Change this
    1: 'Easy',
    // ...
  };
  return labels[level] ?? `Level ${level}`;
}

export function getLevelEmoji(level: number): string {
  const emojis: Record<number, string> = {
    0: '🌱',  // ← Change this
    1: '🌿',
    // ...
  };
  return emojis[level] ?? '🎮';
}
```

## Benefits of This Architecture

✅ **Centralized Configuration** - All difficulty settings in one place  
✅ **Easy to Adjust** - Modify any parameter without changing game logic  
✅ **Extensible** - Can easily add more levels beyond 10  
✅ **Type-Safe** - TypeScript ensures proper level types (0-10)  
✅ **Maintainable** - Clear separation of concerns  
✅ **User-Friendly** - Dropdown picker is more compact than chip selection  

## Future Enhancements

You can easily extend this system to:
- Add more levels (modify the type and add config entries)
- Add new difficulty parameters (e.g., `multiplicationChance`, `timeLimit`)
- Persist user's last selected level to device storage
- Add level unlock progression
- Create difficulty presets (Easy/Normal/Hard)
