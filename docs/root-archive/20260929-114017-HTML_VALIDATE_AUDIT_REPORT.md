# 🔍 HTML-Validate Accessibility Audit Report

**Generated**: Sun Sep 20 22:22:56 -03 2026
**Standard**: WCAG 2.1 AA

---

## 1. AutBot Vendor (conta-comigo/vendor/autbot-frontend)

### Build Status
```bash
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.14s
```

### HTML Validation Results
```
```

✅ **Status**: PASSED - No accessibility issues

---

## 2. Conta Comigo Frontend

### Build Status
```bash

./src/hooks/use-voice-command.ts
95:6  Warning: React Hook useCallback has a missing dependency: 'options'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```

### ESLint jsx-a11y Results
```
  148:6  warning  React Hook useEffect has a missing dependency: 'session.currentActivity'. Either include it or remove the dependency array                                                                         react-hooks/exhaustive-deps
  403:9  warning  Visible, non-interactive elements with click handlers must have at least one keyboard listener                                                                                                     jsx-a11y/click-events-have-key-events
  403:9  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/app/[locale]/page.tsx
  94:9  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/app/[locale]/progress/page.tsx
  60:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/Users/richardjeremias/git/conta-comigo/frontend/src/components/activity/guided-instructions.tsx
  41:46  warning  React Hook useEffect has a missing dependency: 'speech'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/Users/richardjeremias/git/conta-comigo/frontend/src/components/activity/multiple-choice-activity.tsx
  64:80  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

/Users/richardjeremias/git/conta-comigo/frontend/src/components/arasaac/arasaac-library-dialog.tsx
  88:10  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/arasaac/arasaac-pictogram.tsx
  47:9  warning  Non-interactive elements should not be assigned mouse or keyboard event listeners  jsx-a11y/no-noninteractive-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/home/auth-dialog.tsx
  91:5  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/learner/ActivityRenderer.tsx
  317:11  warning  Non-interactive elements should not be assigned mouse or keyboard event listeners  jsx-a11y/no-noninteractive-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/minigames/basket-minigame.tsx
  141:15  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/minigames/comparison-minigame.tsx
  85:6  warning  React Hook useEffect has missing dependencies: 'audioPlayed' and 'isTEAMode'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

/Users/richardjeremias/git/conta-comigo/frontend/src/components/titia/titia-modal.tsx
  39:5  warning  Visible, non-interactive elements with click handlers must have at least one keyboard listener                                                                                                     jsx-a11y/click-events-have-key-events
  39:5  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/components/ui/card.tsx
  11:5  warning  Visible, non-interactive elements with click handlers must have at least one keyboard listener                                                                                                     jsx-a11y/click-events-have-key-events
  11:5  warning  Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element  jsx-a11y/no-static-element-interactions

/Users/richardjeremias/git/conta-comigo/frontend/src/contexts/AccessibilityContext.tsx
  185:6  warning  React Hook useEffect has missing dependencies: 'effectiveSettings.animationsReduced', 'effectiveSettings.fontSize', 'effectiveSettings.highContrast', 'effectiveSettings.lowStimulationMode', and 'effectiveSettings.theme'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

/Users/richardjeremias/git/conta-comigo/frontend/src/hooks/use-session.tsx
  262:6  warning  React Hook useCallback has an unnecessary dependency: 'logBlockChange'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

✖ 29 problems (5 errors, 24 warnings)

```

---

## Summary

### Issues Found:
- **AutBot Vendor**: ✅ PASSED (all HTML validation rules)
- **Frontend ESLint**: Warnings remain - See details above

### Next Steps:
1. Review ESLint warnings for context-specific issues
2. Fix keyboard event handlers on interactive elements
3. Fix non-interactive element roles
4. Fix React Hook dependencies
5. Run `npm run audit:a11y` to verify all changes

---

**Report Generated**: 2026-09-20 22:23:03
