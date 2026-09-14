const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace " (Sec A)" or "(Sec A)" with ""
  content = content.replace(/\s*\(Sec [A-C]\)/g, '');
  content = content.replace(/\s*\(Batch [A-C1-3]\)/g, '');
  content = content.replace(/PY-DAS/g, 'PY- DAS');
  content = content.replace(/PY-MS/g, 'PY- MS');
  content = content.replace(/PY-SY/g, 'PY- SY');
  content = content.replace(/PY-AH/g, 'PY- AH');
  content = content.replace(/PY-VP/g, 'PY- VP');
  content = content.replace(/PY-ST/g, 'PY- ST');
  content = content.replace(/PY-RN/g, 'PY- RN');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned: ${filePath}`);
}

const target1 = path.resolve('frontend/src/data/departmentTimetables.js');
const target2 = path.resolve('backend/database/seed_timetable_faculty.js');

cleanFile(target1);
cleanFile(target2);
