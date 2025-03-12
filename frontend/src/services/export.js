// frontend/src/services/export.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToCSV = (results, filename = 'simulation_results.csv') => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Metric,Value\n";
  csvContent += `Average IRR,${(results?.averageIRR * 100 ?? 0).toFixed(2)}%\n`;
  csvContent += `IRR P10,${(results?.irrPercentiles?.p10 * 100 ?? 0).toFixed(2)}%\n`;
  csvContent += `IRR P50,${(results?.irrPercentiles?.p50 * 100 ?? 0).toFixed(2)}%\n`;
  csvContent += `IRR P90,${(results?.irrPercentiles?.p90 * 100 ?? 0).toFixed(2)}%\n`;
  csvContent += `Average NPV,${(results?.averageNPV ?? 0).toFixed(2)}\n`;
  csvContent += `NPV P10,${(results?.npvPercentiles?.p10 ?? 0).toFixed(2)}\n`;
  csvContent += `NPV P50,${(results?.npvPercentiles?.p50 ?? 0).toFixed(2)}\n`;
  csvContent += `NPV P90,${(results?.npvPercentiles?.p90 ?? 0).toFixed(2)}\n`;
  csvContent += `Average Payback Year,${(results?.averagePayback ?? 0).toFixed(1)}\n`;
  csvContent += `Min DSCR P5,${(results?.minDSCRDist?.p5 ?? 0).toFixed(2)}\n`;
  csvContent += `Prob DSCR < 1,${(results?.minDSCRDist?.probBelow1 * 100 ?? 0).toFixed(2)}%\n`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (elementId, filename = 'simulation_report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for PDF export");
    return;
  }
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};