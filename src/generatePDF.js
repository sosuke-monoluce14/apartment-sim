import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 指定したDOM要素をA4 PDFに変換してダウンロードする
 * @param {HTMLElement[]} pages - キャプチャするページ要素の配列
 * @param {string} filename - 出力ファイル名
 */
export async function exportToPDF(pages, filename = 'simulation.pdf') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const A4_W = 210  // mm
  const A4_H = 297  // mm

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i]
    if (!el) continue

    const canvas = await html2canvas(el, {
      scale: 2,            // 高解像度
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const imgW = A4_W
    const imgH = (canvas.height * A4_W) / canvas.width

    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, Math.min(imgH, A4_H))
  }

  pdf.save(filename)
}
