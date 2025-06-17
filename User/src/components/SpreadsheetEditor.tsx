import React, { useRef, useState } from 'react';
import { HotTable, HotTableClass } from '@handsontable/react';
import * as XLSX from 'xlsx';
import 'handsontable/dist/handsontable.full.min.css';

const SpreadsheetEditor: React.FC = () => {
  const hotRef = useRef<HotTableClass | null>(null);
  const [tableData, setTableData] = useState<any[][]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target?.result as string;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      setTableData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleDownload = () => {
    const instance = hotRef.current?.hotInstance;
    if (!instance) return;

    const data = instance.getData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Lead.xlsx');
  };

  return (
    <div style={{ padding: '20px' }}>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      <div style={{ marginTop: '20px' }}>
        <HotTable
          ref={hotRef}
          data={tableData}
          colHeaders={true}
          rowHeaders={true}
          width="100%"
          height="400px"
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
      <button onClick={handleDownload} style={{ marginTop: '15px' }}>
        Download
      </button>
    </div>
  );
};

export default SpreadsheetEditor;
