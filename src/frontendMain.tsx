import manifest from '../dist/client/.vite/manifest.json'

export const renderer = (c: any) => {
  const indexEntry = manifest['index.html']
  const jsFile = indexEntry.file
  const cssFiles = indexEntry.css || []
  
  const cssLinks = cssFiles.map(css => `<link rel="stylesheet" href="/client/${css}">`).join('\n        ')
  
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Membership App</title>
        ${cssLinks}
        <script type="module" src="/client/${jsFile}"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `)
}
