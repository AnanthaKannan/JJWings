# Quick Difficulty Adjustment Cheat Sheet

## File to Edit
**Location:** `src/config/levelDifficulty.ts`

## Quick Parameter Reference

### Number Ranges (Operands)
```typescript
{
  minMax: 5,      // 1-5 (starting range)
  maxMax: 50,     // Goes up to 50 at high score
}
```
→ **Increase both** = Harder math  
→ **Decrease both** = Easier math

### Operations
```typescript
{
  allowSubtraction: true,      // Allow subtraction
  subtractionChance: 0.5,      // 50% chance of subtraction
}
```
→ Change `0.5` to `0.2` for 20% chance  
→ Set `allowSubtraction: false` to disable subtraction

### Speed (Ball Fall Time)
```typescript
{
  startFallDuration: 4500,     // Ball takes 4.5 seconds to fall at start
  minFallDuration: 2000,       // Fastest = 2 seconds
  speedUpPerPoint: 180,        // Falls 180ms faster per correct answer
}
```
→ **Increase startFallDuration** = More time to answer  
→ **Decrease speedUpPerPoint** = Less speed increase per point

## Example: Make Level 5 Easier
```typescript
5: {
  minMax: 35,      // ← Change to 25 (was 35)
  maxMax: 70,      // ← Change to 50 (was 70)
  allowSubtraction: true,
  subtractionChance: 0.6,  // ← Change to 0.4 (was 0.6)
  startFallDuration: 4000, // ← Change to 5000 (was 4000)
  minFallDuration: 1800,
  speedUpPerPoint: 200,    // ← Change to 150 (was 200)
},
```

## Example: Make Level 3 Harder
```typescript
3: {
  minMax: 15,      // ← Change to 20 (was 15)
  maxMax: 30,      // ← Change to 50 (was 30)
  allowSubtraction: true,
  subtractionChance: 0.4,  // ← Change to 0.6 (was 0.4)
  startFallDuration: 5500, // ← Change to 4000 (was 5500)
  minFallDuration: 2400,   // ← Change to 1600 (was 2400)
  speedUpPerPoint: 160,    // ← Change to 200 (was 160)
},
```

## Balance Tips

✅ **Good Balance:**
- Each level should be noticeably harder than the previous
- Level progression should feel natural (not sudden jumps)
- Users should be able to reach high scores on reasonable levels

🎯 **Difficulty Curve Formula (optional):**
- `minMax` = 5 + (level × 12)
- `maxMax` = 10 + (level × 28)
- `startFallDuration` = 10000 - (level × 700)
- `speedUpPerPoint` = 80 + (level × 20)

## Testing Your Changes
1. Edit the configuration in `src/config/levelDifficulty.ts`
2. Save the file
3. The app will hot-reload
4. Select the level and start playing
5. Adjust if needed

No other files need to be modified! ✨
