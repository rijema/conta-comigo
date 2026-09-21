# Accessibility Linting Results

**Date**: 2026-09-20  
**Command**: `npm run lint:a11y`  
**Total Issues**: 28 (2 errors, 26 warnings)

## Errors (Must Fix)

### 1. Form Labels Not Associated with Controls (3 errors)

**File**: `src/app/[locale]/dashboard/guardian/page.tsx`

```
Lines: 775, 786, 797
Rule: jsx-a11y/label-has-associated-control
Issue: Form labels not connected to input elements
```

**Example at line 775:**
```jsx
<label>Maternidade</label>
// Missing htmlFor attribute and corresponding input id
```

**Fix**: Add `htmlFor` to label and `id` to input:
```jsx
<label htmlFor="maternity">Maternidade</label>
<input id="maternity" type="checkbox" />
```

### 2. Unescaped Quotes in JSX (2 errors)

**File**: `src/app/[locale]/dashboard/educator/page.tsx`

```
Line: 542 (2 occurrences)
Rule: react/no-unescaped-entities
Issue: Double quotes should be HTML-escaped
```

**Fix**: Replace `"` with `&quot;`

---

## Warnings (Should Fix)

### High Priority Warnings

#### 1. Missing Keyboard Handlers (7 warnings)

**Files**:
- `src/app/[locale]/learn/menu/page.tsx` (line 381)
- `src/app/[locale]/learn/page.tsx` (line 403)
- `src/components/minigames/basket-minigame.tsx` (line 141)
- `src/components/titia/titia-modal.tsx` (line 39)

**Rule**: `jsx-a11y/click-events-have-key-events`  
**Issue**: Elements with `onClick` need keyboard support

**Fix**: Add `onKeyDown` handler or convert to `<button>`:
```jsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>

// OR
<div 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Click me
</div>
```

#### 2. Non-Interactive Elements with Interactions (7 warnings)

**Files**:
- `src/app/[locale]/learn/menu/page.tsx` (line 381)
- `src/app/[locale]/learn/page.tsx` (line 403)
- `src/app/[locale]/page.tsx` (line 94)
- `src/components/arasaac/arasaac-library-dialog.tsx` (line 88)
- `src/components/home/auth-dialog.tsx` (line 91)
- `src/components/minigames/basket-minigame.tsx` (line 141)
- `src/components/titia/titia-modal.tsx` (line 39)

**Rule**: `jsx-a11y/no-static-element-interactions`  
**Issue**: `<div>` or `<section>` has click handlers but no semantic role

**Fix**: Use appropriate role attributes:
```jsx
// ✅ Good - Use button element
<button onClick={handleClick}>Action</button>

// OR - Use role with aria
<div 
  onClick={handleClick}
  role="button"
  tabIndex={0}
  aria-pressed={isPressed}
>
  Action
</div>
```

#### 3. Non-Interactive Elements with Event Listeners (2 warnings)

**Files**:
- `src/components/arasaac/arasaac-pictogram.tsx` (line 47)
- `src/components/learner/ActivityRenderer.tsx` (line 317)

**Rule**: `jsx-a11y/no-noninteractive-element-interactions`  
**Issue**: Non-interactive elements have event listeners

**Fix**: Add appropriate role or use button element

### Medium Priority Warnings

#### 4. Missing React Hook Dependencies (8 warnings)

**Files**:
- `src/app/[locale]/dashboard/educator/page.tsx` (line 94)
- `src/app/[locale]/dashboard/guardian/page.tsx` (line 211)
- `src/app/[locale]/learn/menu/page.tsx` (line 65)
- `src/app/[locale]/learn/page.tsx` (line 148)
- `src/app/[locale]/progress/page.tsx` (line 60)
- `src/components/activity/guided-instructions.tsx` (line 41)
- `src/components/comparison-minigame.tsx` (line 85)

**Rule**: `react-hooks/exhaustive-deps`  
**Issue**: useEffect dependencies incomplete

**Fix**: Add missing dependencies to dependency array

### Low Priority Warnings

#### 5. Image Optimization

**File**: `src/components/activity/multiple-choice-activity.tsx` (line 64)

**Rule**: `@next/next/no-img-element`  
**Suggestion**: Use Next.js `<Image>` component for optimization

---

## Action Plan

### Phase 1: Critical Fixes (Errors)
1. **Form labels**: Add `htmlFor` attributes in guardian dashboard
2. **Unescaped quotes**: Fix HTML entities in educator dashboard

**Estimated time**: 15 minutes

### Phase 2: High Priority (Keyboard Accessibility)
1. **Add keyboard handlers** to all interactive divs
2. **Add role attributes** where native elements aren't used

**Estimated time**: 1-2 hours

### Phase 3: Medium Priority (React Hooks)
1. **Fix dependency arrays** in useEffect hooks

**Estimated time**: 30 minutes

---

## Next Steps

1. Run `npm run lint:a11y:fix` to auto-fix what's possible
2. Manually fix errors in guardian and educator dashboards
3. Add keyboard handlers to interactive elements
4. Re-run `npm run lint:a11y` to verify
5. Run full audit: `npm run audit:a11y`

