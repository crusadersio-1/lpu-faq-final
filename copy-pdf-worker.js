const fs = require('fs');
const path = require('path');

// Source path of the PDF.js worker file
const workerPath = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');

// Destination path in the public directory
const destPath = path.join(__dirname, 'public', 'pdf.worker.min.js');

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Copy the worker file
fs.copyFileSync(workerPath, destPath);

console.log('PDF.js worker file copied successfully!'); 