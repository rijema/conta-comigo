# 🔍 Accessibility Validation Pipeline

Conta Comigo uses a two-stage accessibility validation pipeline to ensure WCAG 2.1 AA compliance across the entire application.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ACCESSIBILITY VALIDATION                       │
└─────────────────────────────────────────────────────────────────┘

Stage 1: SOURCE CODE (TSX/JSX)
┌─────────────────────────────────────────────────────────────────┐
│  ESLint + eslint-plugin-jsx-a11y                               │
│  ↓                                                               │
│  Validates component structure at compile time                  │
│  • Alt text for images                                          │
│  • ARIA attributes                                              │
│  • Interactive element handling                                 │
│  • Semantic HTML usage                                          │
│  • Heading hierarchy                                            │
│  • Form labels                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
    npm run lint:a11y
         ↓
         ✅ / ❌

Stage 2: BUILD OUTPUT (HTML)
┌─────────────────────────────────────────────────────────────────┐
│  html-validate                                                   │
│  ↓                                                               │
│  Validates rendered HTML output after Next.js build             │
│  • Color contrast (WCAG AA)                                     │
│  • Heading structure                                            │
│  • Landmark navigation                                          │
│  • Form accessibility                                           │
│  • Media alt text                                               │
│  • ARIA correctness                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
    npm run build
    npm run validate:html-a11y
         │
         ↓
         ✅ / ❌

Stage 3: AUTOMATED AUDIT
┌─────────────────────────────────────────────────────────────────┐
│  Combined validation (all stages)                               │
│  ↓                                                               │
│  Runs both linting and HTML validation                          │
│  Reports comprehensive accessibility results                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
    npm run audit:a11y
         │
         ↓
    ✅ WCAG 2.1 AA COMPLIANT / ❌ FAILURES DETECTED
```

## Commands

### Stage 1: Lint TSX/JSX Components

Validate accessibility rules in component source code:

```bash
# Run linter
npm run lint:a11y

# Run linter with auto-fix where possible
npm run lint:a11y:fix
```

**What it checks:**
- ✅ Images have alt text (`alt-text`)
- ✅ Anchors have content/labels (`anchor-has-content`, `anchor-is-valid`)
- ✅ ARIA attributes are valid (`aria-props`, `aria-proptypes`, `aria-role`)
- ✅ Heading elements have content (`heading-has-content`)
- ✅ HTML elements have lang attribute (`html-has-lang`)
- ✅ Iframes have titles (`iframe-has-title`)
- ✅ Form labels are connected to inputs (`label-has-associated-control`)
- ✅ No duplicate ARIA roles where inappropriate
- ✅ Interactive elements support keyboard navigation
- ✅ Click events have keyboard handlers

### Stage 2: Validate HTML Build Output

Validate the final rendered HTML after Next.js compilation:

```bash
# First build the application
npm run build

# Then validate the HTML output
npm run validate:html-a11y
```

**What it checks:**
- ✅ Color contrast ratios (WCAG AA: 4.5:1 minimum)
- ✅ Heading hierarchy is proper
- ✅ No duplicate IDs
- ✅ Landmark roles are unique
- ✅ No orphaned form labels
- ✅ Media elements have captions/descriptions
- ✅ ARIA roles and properties are valid
- ✅ HTML structure is valid

### Stage 3: Complete Accessibility Audit

Run the full validation pipeline in one command:

```bash
# Runs: lint → build → validate HTML
npm run audit:a11y
```

This is the comprehensive check that should be run before deployment.

## ESLint Rules (jsx-a11y)

### Errors (must be fixed)
```
jsx-a11y/alt-text
jsx-a11y/anchor-has-content
jsx-a11y/aria-activedescendant-has-tabindex
jsx-a11y/aria-props
jsx-a11y/aria-proptypes
jsx-a11y/aria-role
jsx-a11y/aria-unsupported-elements
jsx-a11y/heading-has-content
jsx-a11y/html-has-lang
jsx-a11y/iframe-has-title
jsx-a11y/label-has-associated-control
jsx-a11y/no-access-key
jsx-a11y/no-interactive-element-to-noninteractive-role
jsx-a11y/no-noninteractive-element-to-interactive-role
jsx-a11y/role-has-required-aria-props
jsx-a11y/role-supports-aria-props
jsx-a11y/scope
jsx-a11y/anchor-is-valid
```

### Warnings (recommended but not blocking)
```
jsx-a11y/click-events-have-key-events
jsx-a11y/img-redundant-alt
jsx-a11y/interactive-supports-focus
jsx-a11y/media-has-caption
jsx-a11y/mouse-events-have-key-events
jsx-a11y/no-autofocus
jsx-a11y/no-distracting-elements
jsx-a11y/no-noninteractive-element-interactions
jsx-a11y/no-redundant-roles
jsx-a11y/no-static-element-interactions
```

## HTML Validation Rules

### WCAG Compliance Rules
```
wcag/h64a  - Headings (h1-h6) must have content
wcag/h67   - Empty form labels
wcag/h71   - Page must have proper heading structure
wcag/aria  - ARIA attributes must be valid
```

### Accessibility Rules
```
color-contrast  - Text must have 4.5:1 contrast (AA standard)
id-dup         - No duplicate IDs
no-dup-attr    - No duplicate attributes
no-dup-landmark - No duplicate landmark roles
no-unknown-elements - HTML elements must be valid
void-content   - Void elements must not have content
```

## Configuration Files

### .eslintrc.json
Main ESLint configuration with jsx-a11y rules. Located in `frontend/.eslintrc.json`

**To customize:**
- Change `error` to `warn` to demote a rule
- Change `warn` to `error` to promote a rule
- Remove line to disable a rule

### .htmlvalidate.json
HTML-validate configuration. Located in `frontend/.htmlvalidate.json`

**To customize:**
- Change `error` to `warn` or `off`
- Add specific element/attribute patterns

## CI/CD Integration

### GitHub Actions Example

Add to `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Audit

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Run accessibility audit
        run: cd frontend && npm run audit:a11y
      
      - name: Report results
        if: always()
        run: echo "✅ Accessibility audit completed"
```

## Before Committing

Always run:

```bash
npm run lint:a11y:fix    # Auto-fix what you can
npm run audit:a11y       # Run full audit
```

If there are failures:
1. Review the error messages
2. Check the documentation for each rule
3. Update your component code
4. Re-run `npm run lint:a11y` to verify

## Before Deployment

1. **Local testing:**
   ```bash
   npm run audit:a11y
   ```

2. **Manual testing with screen reader:**
   - Use NVDA (Windows), JAWS, or VoiceOver (Mac)
   - Test all interactive elements
   - Test navigation flows

3. **Browser testing:**
   - Chrome DevTools Lighthouse audit
   - Axe DevTools extension
   - axe-core library

## Common Issues & Solutions

### Image alt text missing
```jsx
// ❌ Bad
<img src="logo.png" />

// ✅ Good
<img src="logo.png" alt="Company logo" />
```

### No keyboard access
```jsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
// OR
<div onClick={handleClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>Click me</div>
```

### Poor color contrast
```css
/* ❌ Bad: 2.56:1 ratio */
.text-low-contrast {
  color: #94a3b8;  /* slate-400 */
  background: white;
}

/* ✅ Good: 5.2:1 ratio */
.text-high-contrast {
  color: #475569;  /* slate-600 */
  background: white;
}
```

### Missing form labels
```jsx
// ❌ Bad
<input type="text" placeholder="Name" />

// ✅ Good
<label htmlFor="name">Name:</label>
<input id="name" type="text" />
```

### Heading hierarchy broken
```jsx
// ❌ Bad
<h1>Page Title</h1>
<h3>Subsection</h3>  // Skipped h2!

// ✅ Good
<h1>Page Title</h1>
<h2>Main Section</h2>
<h3>Subsection</h3>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [html-validate Documentation](https://html-validate.org/)
- [Deque Accessibility Blog](https://www.deque.com/blog/)

## Support

For accessibility questions or issues:
1. Check this documentation
2. Review the WCAG 2.1 guidelines
3. Test with actual assistive technologies
4. Consult with accessibility specialists when needed

---

**Last updated**: 2026-09-20  
**Standard**: WCAG 2.1 Level AA
