# Verificação Playwright dos exercícios de 2º–5º ano

Renderiza cada exercício de `backend/src/database/seeds/curriculum-progression.seed.ts`
com o mesmo `ActivityRenderer` do app e, em celular (360px, toque), tablet (820px, toque)
e desktop (1280px, arrasto real com mouse):

- resolve o exercício como a criança faria e confere se a resposta enviada é a que o backend aceita;
- verifica que não há rolagem horizontal;
- verifica que todas as imagens ARASAAC carregaram e que nenhum pictograma caiu no emoji de reserva.

```bash
cd frontend
./e2e/progression/generate-data.sh      # gera public/__progression-preview.json
npx next dev -p 3123                    # em outro terminal
npm run test:e2e:progression            # BASE_URL=http://localhost:3123 por padrão
```

Capturas de tela de alguns exercícios vão para `e2e/progression/shots/` (ignorado pelo git).
