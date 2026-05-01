const XLSX = require('xlsx');
const path = require('path');

const filePath = 'F:\\Pharm@lgeria\\medicament.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 0, header: 1 });

console.log("Columns:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
