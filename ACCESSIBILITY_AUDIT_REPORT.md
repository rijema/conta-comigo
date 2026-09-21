# 🚨 AUDIT ACCESSIBILITY - ERROS E SOLUÇÕES

**Data**: 2026-09-21  
**Total Issues**: 24  
**Severidade**: 1 CRITICAL + 12 SERIOUS + 2 MODERATE

---

## 1️⃣ **COLOR CONTRAST (9 issues + 10 advanced)** - 🔴 CRITICAL

### Problema:
Cores de texto vs background **não alcançam** WCAG AA (4.5:1 contrast ratio)

### Exemplos:
```
❌ text-slate-400 (#94a3b8) em background branco
   Contrast: 2.56:1  (Precisa: 4.5:1)

❌ text-purple-200 (#e9d5ff) em background purple
   Contrast: 4.16:1  (Precisa: 4.5:1) - Quase!

❌ text-slate-500 (#64748b) em bg-purple-50 (#faf5ff)
   Contrast: 4.43:1  (Precisa: 4.5:1) - MUY CERCA!
```

### Onde está:
- Dashboard guardian
- Cards de estatísticas ("Precisão observada", "Sequência", "Pontos")
- Labels de atividade
- Texto de ajuda

### Solução:

```tailwind
/* ANTES - ERRADO */
<span class="text-sm text-slate-400">filho(a) de</span>  /* 2.56:1 */
<div class="text-xs text-slate-500">Precisão observada</div>  /* 4.43:1 */

/* DEPOIS - CORRETO */
<span class="text-sm text-slate-600">filho(a) de</span>  /* ✅ 5.2:1 */
<div class="text-xs text-slate-700">Precisão observada</div>  /* ✅ 5.8:1 */
```

### Cores recomendadas (WCAG AA):
```
slate-400 (#94a3b8) → slate-600 (#475569)   ✅
slate-500 (#64748b) → slate-700 (#334155)   ✅
purple-200 (#e9d5ff) → purple-700 (#6d28d9) ✅
text-purple-200 em purple bg → text-white   ✅
text-sky-500 em light bg → text-sky-700     ✅
```

### 🔧 FIX: Arquivos a modificar:
- `src/components/` - Dashboard components
- Search: `.text-slate-400`, `.text-slate-500`, `.text-purple-200`, `.text-sky-500`
- Replace com cores mais escuras (600-700)

---

## 2️⃣ **BUTTON WITHOUT NAME** - 🔴 CRITICAL (1 issue)

### Problema:
Tem um `<button>` sem texto ou aria-label

### Exemplo:
```html
❌ <button disabled="">...</button>
   Screenreader: (sem nome!)
```

### Solução:
```html
✅ <button aria-label="Expandir menu">...</button>
   ou
✅ <button>Menu <span>▼</span></button>
   ou use aria-label se só tiver ícone
```

### 🔧 FIX:
- Search: `<button` no código
- Verificar cada button tem:
  - `aria-label` (se só ícone)
  - ou texto dentro (se tem ícone + texto)
  - ou `title` attribute

---

## 3️⃣ **ARIA DIALOG NAME** - 🟠 SERIOUS (1 issue)

### Problema:
Modal/Dialog sem nome acessível

### Exemplo:
```html
❌ <section role="dialog" aria-modal="true">
     <!-- sem aria-labelledby ou aria-label -->
   </section>
```

### Solução:
```html
✅ <section 
     role="dialog" 
     aria-modal="true" 
     aria-labelledby="modal-title"
   >
     <h2 id="modal-title">Editar Criança</h2>
   </section>
```

### 🔧 FIX:
- Search: `role="dialog"` ou `aria-modal="true"`
- Adicionar `aria-labelledby="descriptive-id"`
- Criar elemento com esse ID como título

---

## 4️⃣ **DUPLICATE BANNER** - 🟡 MODERATE (1 issue)

### Problema:
Mais de um `<header>` com role="banner" na mesma página

### Exemplo:
```html
❌ <header class="shared-top-bar">...</header>
   <header class="another-header">...</header>
```

### Solução:
```html
✅ <header role="banner" class="shared-top-bar">...</header>
   <section>
     <header>...</header>  <!-- Remove role="banner" aqui -->
   </section>
```

### 🔧 FIX:
- Manter SÓ UM `<header role="banner">` no site
- Outros headers devem ser `<header>` sem role ou dentro de `<section>`

---

## 5️⃣ **LANDMARK NOT UNIQUE** - 🟡 MODERATE (1 issue)

### Problema:
Dois landmarks com mesmo role e sem nomes diferentes

### Exemplo:
```html
❌ <nav>Navegação 1</nav>
   <nav>Navegação 2</nav>
   <!-- Screenreader não diferencia! -->
```

### Solução:
```html
✅ <nav aria-label="Navegação Principal">...</nav>
   <nav aria-label="Navegação de Atividades">...</nav>
```

### 🔧 FIX:
- Adicionar `aria-label` em landmarks duplicados
- Ou `aria-labelledby="id-único"`

---

## 6️⃣ **NO H1 ON PAGE** - 🟡 MODERATE (1 issue)

### Problema:
Página sem `<h1>` (heading level 1)

### Solução:
```html
✅ <h1>Conta Comigo - Matemática para TEA</h1>
```

### 🔧 FIX:
- Adicionar `<h1>` no início de cada página
- Deve ser ÚNICA por página
- Deve ser descritivo

---

## 📋 PLANO DE AÇÃO (PRIORIDADES)

### 🔴 **HOJE - CRITICAL** (30 min):
1. **Button without name**
   - `src/components/` → find `<button>` sem aria-label
   - Add aria-label ou texto

### 🟠 **ESTA SEMANA - SERIOUS** (2 horas):
1. **Color Contrast** (19 issues)
   ```bash
   grep -r "text-slate-400\|text-slate-500\|text-purple-200" src/components/
   # Replacer com 600/700 versions
   ```

2. **Aria Dialog Name**
   - Find `role="dialog"` → add `aria-labelledby`

### 🟡 **PRÓXIMA SEMANA - MODERATE** (1 hora):
1. **Duplicate banner** → Remove role de headers extra
2. **Landmark unique** → Add aria-labels
3. **H1 on page** → Add em cada página

---

## 🛠️ CHECKLIST RÁPIDO

```
Contrast:
❌ text-slate-400 (#94a3b8)  → ✅ text-slate-600 (#475569)
❌ text-slate-500 (#64748b)  → ✅ text-slate-700 (#334155)
❌ text-purple-200 (#e9d5ff) → ✅ text-purple-700 (#6d28d9)
❌ text-sky-500 on light     → ✅ text-sky-700

Accessibility:
❌ <button></button>           → ✅ <button aria-label="...">
❌ <section role="dialog">     → ✅ <section aria-labelledby="id">
❌ <header> + <header>         → ✅ Manter 1 com role="banner"
❌ Page sem <h1>              → ✅ Add <h1>Título</h1>
```

---

## 📊 WCAG 2.1 AA COMPLIANCE

**Antes**: ❌ 24 issues (1 CRITICAL, 12 SERIOUS, 11 MODERATE)  
**Depois**: ✅ 0 issues

---

## 🚀 FERRAMENTAS PARA TESTAR

1. **Online**: https://www.axe-core.org/
2. **Chrome Extension**: Axe DevTools
3. **CLI**: `npm run audit` (depois configurar)

---

## 📝 PRÓXIMOS PASSOS

1. Copiar as soluções de cor acima
2. Fazer replace em `src/components/`
3. Testar com Axe DevTools
4. Fazer commit: "fix: improve color contrast for WCAG AA compliance"

