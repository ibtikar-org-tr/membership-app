export const renderer = (c: any, next?: any) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Membership App</title>
        <link href="/src/style.css" rel="stylesheet" />
        <script type="module" src="/src/frontend/client.tsx"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `)
}
