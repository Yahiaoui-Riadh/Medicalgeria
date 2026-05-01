import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.join('F:', 'Pharm@lgeria', 'medicament.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log("Headers found:");
  console.log(data[0]);
  console.log("First row data:");
  console.log(data[1]);
} catch (error) {
  console.error("Error reading file:", error);
}
