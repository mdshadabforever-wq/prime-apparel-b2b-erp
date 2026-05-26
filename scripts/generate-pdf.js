const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Path to the markdown source and the output PDF
const markdownPath = path.resolve(__dirname, '..', 'docs', 'MASTER_PROJECT_OVERVIEW.md');
const pdfPath = path.resolve(__dirname, '..', 'docs', 'MASTER_PROJECT_OVERVIEW.pdf');

(async () => {
  try {
    // Read markdown and convert to HTML using a simple markdown-it setup with styling
    const markdownIt = require('markdown-it')({ html: true, linkify: true, typographer: true });
    const markdownItHighlight = require('markdown-it-highlightjs');
    markdownIt.use(markdownItHighlight);

    const raw = fs.readFileSync(markdownPath, 'utf-8');
    const htmlContent = markdownIt.render(raw);

    // Basic HTML wrapper with corporate styling (Inter & Roboto via Google Fonts)
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Master Project Overview</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&family=Roboto:wght@400&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Roboto', sans-serif; padding: 2rem; line-height: 1.6; color: #333; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif; color: #0A3D62; }
          a { color: #F39C12; text-decoration: none; }
          a:hover { text-decoration: underline; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #ddd; padding: 0.5rem; }
          th { background: #f0f4f8; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();
    console.log('PDF generated at', pdfPath);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
