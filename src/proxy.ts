import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Skip api, _next, cv/ and any path with a file extension.
  matcher: ['/((?!api|_next|cv/|.*\\..*).*)'],
}
