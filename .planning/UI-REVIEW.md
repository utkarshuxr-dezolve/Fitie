# Fitie UI Review — 6-Pillar Visual Audit

**Overall: 13/24 — Fair; polishable but shows early-MVP character**

---

## 1. Copywriting — 2/4

**Finds:**
- Greeting subtext: `"Let's have a productive workout today!"` — ignores non-workout contexts; app is also about nutrition/health
- Error messages are all generic: `"Error"`, `"Could not start workout"`, `"Could not log meal"` — no actionability or context
- `"Equipment Detected"` — the scan modal header, but the scan is a simulated random (CONCERNS.md C19)
- Profile motto hardcoded: `"Striving for progress, not perfection"` — nice, but feels like placeholder text
- `"Or add manually"` — dismissive tone; should be `"Add custom food"` or `"Manual entry"`
- Stats labels inconsistent: `"This Week"` vs `"Total"` vs `"Calories"` vs `"Weight"` — some are counts, some are values, all phrased differently
- `"elapsed"` under workout timer — too minimal; `"Elapsed Time"` reads better

**Fix:**
- Write a content pass: all microcopy should be action-oriented and specific to the domain
- Errors should state what failed + suggested action (e.g., `"Network error — check your connection"`)
- Greeting should be fitness-neutral: `"Ready for a great day?"`

---

## 2. Visual Design — 2/4

**Finds:**
- Screens are visually consistent in structure (greeting → section headers → cards → scroll) which is good
- Heavy reliance on solid blue cards (`cardBlue = #F0F5FF`) — every screen feels same-ish visually
- Plan cards on activity screen use dark blue (`cardBlueDark = #0057FF`) which is the only strong visual contrast — good
- Workout modal timer circle is well-proportioned but plain — `160x160` circle with `borderWidth: 4` and background color, no animation
- Macro progress bars in dashboard (`index.tsx:174-182`) use inline style calc for fill — functional but the bar is only 8px tall and hard to read at a glance
- Empty states exist (health, nutrition) which is good UX
- No transitions/animations between screens or tabs
- Tab bar layout uses default expo-router bottom tabs — works but not customized

**Fix:**
- Add subtle visual differentiation between sections: icon backgrounds, card tint variations, gradient headers
- Animate the workout timer (circular progress indicator instead of static fill)
- Add hero illustration or brand identity on the dashboard

---

## 3. Color — 3/4

**Finds:**
- Theme defines a solid foundation: `primary #0057FF`, semantic colors (`success`, `warning`, `error`), and surface tokens
- Good: color-coded macro chips/progress bars (blue, amber, pink)
- Good: status color in health reports uses proper semantic colors
- Issue: inline hex colors throughout screens: `#FFFBEB`, `#F5F3FF`, `#FDF2F8`, `#8B5CF6`, `#EC4899`, `#B45309`, `#FFFBEB` — these bypass the design system
- Issue: `statusClr` function in health.tsx builds hex + alpha via string concat — fragile, breaks with some color values
- The streak pill, macro chips, stat cards each hardcode background colors instead of using `surfaceBlue` or a token

**Fix:**
- Add `warningBg`, `infoBg`, `purple` tokens to theme.ts
- Replace all inline hex with token references
- Fix `statusClr` to use proper RGBA or theme tokens

---

## 4. Typography — 3/4

**Finds:**
- `typography` tokens (h1, h2, h3, body, bodyMd, bodySm, label, stat) are well-defined
- `h1` used consistently for page titles, `h3` for section headers — good hierarchy
- Spread syntax (`{...typography.h1}`) correctly applies token styles
- Issue: Many screens use raw `fontSize` and `fontWeight` objects directly in styles instead of tokens — e.g., `fontSize: 16, fontWeight: '700'` in nutrition upload card titles, `fontSize: 40, fontWeight: '800'` in workout timer
- Missing `letterSpacing` on some display text — `h1` and `stat` define it, but inline overrides don't
- SpaceMono font family exists in assets but is never used — `fontFamily` never assigned to `typography`

**Fix:**
- Add `typography.display` for the 40px timer stat
- Assign `fontFamily: 'SpaceMono'` to a token variant
- Replace raw fontSize/fontWeight combos with token spreads

---

## 5. Spacing & Layout — 2/4

**Finds:**
- `spacing` tokens (`xs: 4` through `xxl: 48`) exist and are used
- `spacing: screen` (20px) used for horizontal padding consistently — good
- `View style={{ height: 100 }} />` at end of every ScrollView — crude padding workaround to avoid bottom tab overlap
- Workout plan cards fixed width `180` — may clip on smaller screens or waste space on larger ones
- Profile editing form: `editRow` puts age and height side-by-side — tight on narrow phones
- Modal box `maxHeight: '80%'` and `'90%'` — inconsistent between modals
- No responsive handling — screens render identically regardless of screen size
- Filter chips on activity screen: no gap between horizontal scroll container and content edge

**Fix:**
- Replace `{{ height: 100 }}` with proper `contentContainerStyle` bottom padding
- Use percentage-based widths for plan cards or `Dimensions` API
- Standardize modal `maxHeight` to a token

---

## 6. Experience Design — 1/4

**Finds:**
- Pull-to-refresh works on every screen — good
- Active workout auto-loads on activity screen — good
- Workout timer runs in modal but can't be paused, reset, or cancelled mid-workout
- Scan "detection" is a random simulation (CONCERNS.md C19) — no actual camera integration, no `expo-camera` used on this screen
- Nutrition: manual entry has no food name validation; search and manual entry both in same modal creates cognitive load
- Profile: weight log has no min/max — `0` kg or `999` kg accepted
- No onboarding flow — user registers and is dropped into an empty dashboard
- No workout history detail view — just a list on the dashboard
- Error handling: `console.log('error')` in screens, `try/catch` in AuthContext logout silently swallows errors
- No loading states beyond ActivityIndicator — no skeletons or progressive rendering
- No dark mode support despite `surfaceDark` token existing in theme

**Fix:**
- Add onboarding: goal selection, unit preference, initial profile setup
- Workout modal: add pause, discard, and estimated-calorie tracking
- Nutrition: separate search and manual into tabs within the modal
- Implement skeleton loading states for the dashboard stats

---

## Summary Scorecard

| Pillar | Score | Priority |
|--------|-------|----------|
| Copywriting | 2/4 | Medium |
| Visuals | 2/4 | Medium |
| Color | 3/4 | High (inline hex cleanup) |
| Typography | 3/4 | Low |
| Spacing | 2/4 | Medium |
| Experience Design | 1/4 | **Critical** |
| **Total** | **13/24** | |

### Top 5 Fixes

1. **Add onboarding flow** — first-use goal & profile setup
2. **Centralize color tokens** — eliminate inline hex, add missing surface/semantic tokens
3. **Add skeleton loading states** — replace raw ActivityIndicator with structured skeletons
4. **Add workout controls** — pause, cancel, estimated calories
5. **Content pass** — rewrite all error messages, labels, and microcopy for clarity
