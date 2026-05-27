import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import markdownItLib from 'markdown-it';
import markdownItHighlight from 'markdown-it-highlightjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const trainingDir = path.resolve(__dirname, '..', 'docs', 'training');
const pdfOutputPath = path.resolve(trainingDir, 'ERP_TRAINING_MANUAL.pdf');

// Chronological order for training manuals
const manuals = [
  { file: 'FOUNDER_MASTER_GUIDE.md', title: 'Chapter 1: Founder Master Guide' },
  { file: 'PURCHASE_TEAM_GUIDE.md', title: 'Chapter 2: Purchase Team SOP' },
  { file: 'QC_INVENTORY_GUIDE.md', title: 'Chapter 3: Quality Control & Inventory SOP' },
  { file: 'PRICING_TEAM_GUIDE.md', title: 'Chapter 4: Pricing Team SOP' },
  { file: 'CONTENT_TEAM_GUIDE.md', title: 'Chapter 5: Content Team SOP' },
  { file: 'MARKETING_TEAM_GUIDE.md', title: 'Chapter 6: Marketing Team SOP' },
  { file: 'BUYER_HUNTING_GUIDE.md', title: 'Chapter 7: Buyer Hunting SOP' },
  { file: 'SALES_FOLLOWUP_GUIDE.md', title: 'Chapter 8: Sales & Follow-up SOP' },
  { file: 'LOGISTICS_TEAM_GUIDE.md', title: 'Chapter 9: Logistics & Dispatch SOP' },
  { file: 'ACCOUNTS_TEAM_GUIDE.md', title: 'Chapter 10: Accounts & Ledger SOP' }
];

(async () => {
  try {
    console.log('Starting ERP Training Manual PDF Generation...');
    
    // Initialize markdown parser
    const markdownIt = markdownItLib({ html: true, linkify: true, typographer: true });
    markdownIt.use(markdownItHighlight);

    let consolidatedHtmlContent = '';
    
    // Read and convert each markdown file
    for (const manual of manuals) {
      const filePath = path.join(trainingDir, manual.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found: ${filePath}`);
        continue;
      }
      
      const rawMarkdown = fs.readFileSync(filePath, 'utf-8');
      
      // Convert markdown to HTML
      const htmlSnippet = markdownIt.render(rawMarkdown);
      
      // Wrap each manual in a section with page-break-before to start on a new page
      consolidatedHtmlContent += `
        <section class="manual-chapter">
          <div class="chapter-header">${manual.title}</div>
          <div class="chapter-content">${htmlSnippet}</div>
        </section>
      `;
    }

    // Build the final complete HTML
    const finalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Prime Apparel ERP - Training Manual</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          /* CSS Variables for Premium Dark/Gold Theme */
          :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --gold: #f59e0b;
            --gold-light: #fef3c7;
            --border-color: #334155;
            --accent: #38bdf8;
          }

          body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }

          /* Cover Page */
          .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
            padding: 3rem;
            box-sizing: border-box;
            page-break-after: always;
          }

          .cover-badge {
            background-color: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: var(--gold);
            padding: 0.5rem 1.5rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 2.5rem;
            font-family: 'Outfit', sans-serif;
          }

          .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 3.5rem;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 1rem 0;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }

          .cover-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--gold);
            margin: 0 0 4rem 0;
            max-width: 800px;
          }

          .cover-divider {
            width: 80px;
            height: 4px;
            background-color: var(--gold);
            border-radius: 2px;
            margin-bottom: 4rem;
          }

          .cover-meta {
            display: flex;
            gap: 3rem;
            justify-content: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 2rem;
            width: 100%;
            max-width: 600px;
          }

          .meta-item {
            text-align: left;
          }

          .meta-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
          }

          .meta-value {
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
          }

          /* Table of Contents */
          .toc-page {
            padding: 4rem 3rem;
            box-sizing: border-box;
            page-break-after: always;
            background-color: var(--bg-color);
          }

          .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 2rem;
            font-weight: 800;
            color: #ffffff;
            border-bottom: 2px solid var(--gold);
            padding-bottom: 0.75rem;
            margin-bottom: 2.5rem;
          }

          .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .toc-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 1.25rem;
            font-size: 1.05rem;
          }

          .toc-chapter {
            font-weight: 600;
            color: var(--gold);
          }

          .toc-dots {
            flex-grow: 1;
            border-bottom: 1px dashed var(--border-color);
            margin: 0 1rem;
            position: relative;
            top: -4px;
          }

          .toc-page-num {
            font-weight: 700;
            color: var(--text-primary);
          }

          /* Chapter Layout */
          .manual-chapter {
            padding: 4rem 3rem;
            box-sizing: border-box;
            page-break-after: always;
          }

          .manual-chapter:last-child {
            page-break-after: avoid;
          }

          .chapter-header {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 2.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
          }

          /* Content Styling */
          h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 2.25rem;
            font-weight: 800;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 1.5rem;
          }

          h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gold);
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 0.25rem;
          }

          h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--accent);
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
          }

          p {
            margin-top: 0;
            margin-bottom: 1.25rem;
            color: #e2e8f0;
          }

          ul, ol {
            margin-top: 0;
            margin-bottom: 1.25rem;
            padding-left: 1.5rem;
          }

          li {
            margin-bottom: 0.5rem;
            color: #e2e8f0;
          }

          /* Highlights & Callouts */
          blockquote {
            background-color: var(--card-bg);
            border-left: 4px solid var(--gold);
            padding: 1.25rem 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 8px 8px 0;
            font-style: normal;
          }

          blockquote p {
            margin: 0;
            color: var(--gold-light);
            font-weight: 600;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            border-radius: 8px;
            overflow: hidden;
          }

          th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
          }

          th {
            background-color: var(--card-bg);
            color: var(--gold);
            font-weight: 700;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          td {
            color: #e2e8f0;
            background-color: rgba(30, 41, 59, 0.3);
            font-size: 0.9rem;
          }

          tr:last-child td {
            border-bottom: none;
          }

          /* Code & Snippets */
          code {
            font-family: 'Courier New', Courier, monospace;
            background-color: rgba(255, 255, 255, 0.08);
            color: var(--accent);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
          }

          pre {
            background-color: #020617 !important;
            border: 1px solid var(--border-color);
            padding: 1.25rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1.5rem 0;
          }

          pre code {
            background-color: transparent;
            color: #e2e8f0;
            padding: 0;
            font-size: 0.85rem;
          }

          /* Images & Walkthroughs */
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin: 1.5rem 0;
            display: block;
          }

          hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 2.5rem 0;
          }

          /* Custom styling inside snippets */
          .emoji {
            font-family: 'Segoe UI Emoji', sans-serif;
            margin-right: 0.25rem;
          }
        </style>
      </head>
      <body>

        <!-- COVER PAGE -->
        <div class="cover-page">
          <div class="cover-badge">Prime Apparel Exports</div>
          <h1 class="cover-title">B2B ERP TRAINING MANUAL</h1>
          <div class="cover-subtitle">Complete Departmental SOPs & System Operation Handbook</div>
          <div class="cover-divider"></div>
          <div class="cover-meta">
            <div class="meta-item">
              <div class="meta-label">Effective Date</div>
              <div class="meta-value">1 June 2026</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Document Version</div>
              <div class="meta-value">v1.0.0 (Release)</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Target Audience</div>
              <div class="meta-value">All Departments & Admins</div>
            </div>
          </div>
        </div>

        <!-- TABLE OF CONTENTS -->
        <div class="toc-page">
          <h2 class="section-title">Table of Contents</h2>
          <ul class="toc-list">
            ${manuals.map((m, idx) => `
              <li class="toc-item">
                <span class="toc-chapter">${m.title}</span>
                <span class="toc-dots"></span>
                <span class="toc-page-num">${idx + 3}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- CONSOLIDATED CHAPTERS -->
        ${consolidatedHtmlContent}

      </body>
      </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set custom content
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    // Output PDF with custom header/footer page numbers
    await page.pdf({
      path: pdfOutputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '25mm',
        bottom: '25mm',
        left: '20mm',
        right: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #475569; width: 100%; padding: 0 20mm; box-sizing: border-box; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
          <span>PRIME APPAREL B2B ERP - DEPARTMENTAL SOPs</span>
          <span>CONFIDENTIAL / OPERATIONAL MANUAL</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #475569; width: 100%; padding: 0 20mm; box-sizing: border-box; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px;">
          <span>Effective: June 2026</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    await browser.close();
    console.log(`\nSUCCESS: consolidated training manual PDF generated successfully!`);
    console.log(`Output Path: ${pdfOutputPath}`);
  } catch (error) {
    console.error('Error generating consolidated training manual PDF:', error);
    process.exit(1);
  }
})();
