const fs = require('fs');
const path = require('path');

const adminDir = path.resolve(__dirname, '..', 'src', 'app', 'admin');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Ensure useToast import exists
  if (!content.includes('useToast')) {
    const importLine = "import { useToast } from '@/components/ui/Toast';";
    content = content.replace(/(import\s+[^;]+;)/, `$1\n${importLine}`);
    modified = true;
  }

  // Replace legacy modal container with CenteredModal placeholder (basic transformation)
  const legacyModalRegex = /<div\s+className=\"fixed inset-0[^>]*>([\s\S]*?)<\/div>/g;
  content = content.replace(legacyModalRegex, (match, inner) => {
    // Attempt to extract onCancel handler if present
    let onCancel = "() => {}";
    const cancelMatch = match.match(/onClick={(.*?)}\s*\/?>/);
    if (cancelMatch) {
      onCancel = cancelMatch[1];
      // Replace with toast call
      if (!onCancel.includes('showToast')) {
        onCancel = `${onCancel.replace(/^\(\)\s*=>\s*{/, '() => { showToast("Operation cancelled");')}`;
      }
    }
    const titleMatch = match.match(/<h2[^>]*>([^<]+)<\/h2>/);
    const title = titleMatch ? titleMatch[1] : '';
    return `<CenteredModal title={\"${title}\"} onConfirm={() => {/* confirm logic */}} onCancel={${onCancel}}>${inner}</CenteredModal>`;
  });

  // Replace any remaining onCancel that sets errorMessage to toast
  const errorCancelRegex = /onCancel=\{\(\)\s*=>\s*{[^}]*setErrorMessage\(['\"]([^'\"]+)['\"]\);[^}]*}\}/g;
  content = content.replace(errorCancelRegex, (match, msg) => {
    return `onCancel={() => { showToast('${msg}'); }}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk(adminDir);
console.log('Modal migration completed.');
