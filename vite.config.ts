import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { getAllRoutes } from './src/data/routesData'

const SITE_URL = 'https://www.roadamericatransport.com'

// Regenerates sitemap.xml at build time from ROUTES_DATA, so adding a route
// there is enough to get it into the sitemap — no manual XML editing.
// Runs in closeBundle (not writeBundle) so it always executes after Vite's
// own publicDir copy, which would otherwise overwrite this with the static
// fallback copy kept in public/sitemap.xml (used by `vite dev`/`vite preview`).
function routeSitemapPlugin(): Plugin {
  let root = process.cwd()
  let outDir = 'dist'

  return {
    name: 'generate-route-sitemap',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = config.build.outDir
    },
    closeBundle() {
      const staticEntries: Array<{ loc: string; priority: string; changefreq: string }> = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/express-quote', priority: '0.9', changefreq: 'weekly' },
        { loc: '/quote', priority: '0.9', changefreq: 'weekly' },
        { loc: '/about', priority: '0.7', changefreq: 'monthly' },
        { loc: '/blog', priority: '0.8', changefreq: 'daily' },
        { loc: '/track', priority: '0.6', changefreq: 'monthly' },
        { loc: '/car-shipping-routes', priority: '0.8', changefreq: 'weekly' },
        { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
        { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
      ]

      const routeEntries = getAllRoutes().map((route) => ({
        loc: `/car-shipping-routes/${route.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
      }))

      const today = new Date().toISOString().slice(0, 10)
      const urlEntries = [...staticEntries, ...routeEntries]
        .map(
          (entry) => `  <url>
    <loc>${SITE_URL}${entry.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
        )
        .join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`

      const resolvedOutDir = path.isAbsolute(outDir) ? outDir : path.join(root, outDir)
      fs.writeFileSync(path.join(resolvedOutDir, 'sitemap.xml'), xml, 'utf-8')
      console.log(`[sitemap] wrote ${staticEntries.length + routeEntries.length} URLs to ${path.join(resolvedOutDir, 'sitemap.xml')}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), routeSitemapPlugin()],
})
