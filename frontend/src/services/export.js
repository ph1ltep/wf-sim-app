// frontend/src/services/export.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToCSV = (data, filename = 'simulation_results.csv') => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Year,Average Cash Flow\n";
  data.averageCashFlow.forEach((cf, index) => {
    csvContent += `${index},${cf}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
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
