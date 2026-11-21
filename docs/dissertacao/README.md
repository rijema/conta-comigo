# Dossiê para a dissertação

`Dossie-ContaComigo-Acessibilidade-Ontologia-2026-11.pdf` reúne o trabalho de novembro de 2026 em um único documento, para ser usado como fonte na redação da dissertação:

- conformidade WCAG 2.2 A/AA e o método de teste (axe-core, checagens próprias, WAVE e inspeção);
- as 28 recomendações do GAIA;
- personalização e interação segura (engrenagem de ajustes, editor da tela da criança, “segurar para trocar”);
- ontologia v0.6.0, com as 126 habilidades BNCC e os alinhamentos com OntoMathEdu e LASDONT.

As tabelas são extraídas de `docs/research/BATCH_17_ACESSIBILIDADE_WCAG_GAIA_PT.md` e `BATCH_18_ONTOLOGIA_V06_BNCC_E_ALINHAMENTOS_PT.md`, que são a fonte primária. Nas capturas do WAVE “antes”, os nomes de alunos foram borrados e a barra do navegador foi removida. As demais capturas usam dados fictícios da auditoria (`frontend/e2e/a11y`).

Para regenerar a partir da raiz do repositório:

```bash
python3 docs/dissertacao/build/build_dossie.py .   # gera dossie.html
node docs/dissertacao/build/render_pdf.js          # gera o PDF
```
