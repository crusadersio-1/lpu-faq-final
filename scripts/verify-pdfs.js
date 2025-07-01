const fs = require('fs');
const path = require('path');

const requiredPDFs = [
  'FAQ LPU.pdf',
  'FRESHMEN-TUITION-FEE-2425-05-16-24.pdf',
  'GSC-STUDENT-HANDBOOK-2024.pdf',
  'LPU-College-Flyer-2025.pdf',
  'Student-Discipline-Guidebook-2023.pdf'
];

console.log('Checking for required PDF files...\n');

const pdfDir = path.join(process.cwd(), 'pdfs');
let allPresent = true;

requiredPDFs.forEach(pdf => {
  const filePath = path.join(pdfDir, pdf);
  const exists = fs.existsSync(filePath);
  
  console.log(`${pdf}: ${exists ? '✓ Present' : '✗ Missing'}`);
  
  if (!exists) {
    allPresent = false;
  }
});

console.log('\nStatus:', allPresent ? 'All files present!' : 'Some files are missing!'); 