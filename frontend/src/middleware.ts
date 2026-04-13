import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Uma lista de todas as localidades suportadas
  locales: ['pt', 'en'],

  // Usado quando nenhuma localidade corresponde
  defaultLocale: 'pt'
});

export const config = {
  // Corresponder a todos os caminhos exceto os listados abaixo
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
