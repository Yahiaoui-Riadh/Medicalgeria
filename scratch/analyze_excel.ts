import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.join('F:', 'Pharm@lgeria', 'medicament.xlsx');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

const codes = rawData.map(r => String(r.Code || "").trim()).filter(c => c);
const uniqueCodes = new Set(codes);

console.log(`Total rows with Code: ${codes.length}`);
console.log(`Unique Codes: ${uniqueCodes.size}`);
