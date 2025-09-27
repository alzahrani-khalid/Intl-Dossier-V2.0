import ExcelJS from 'exceljs'

export function toCSV(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return ''
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const esc = (v: any) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n')
  return headers.join(',') + '\n' + body
}

export function toJSON(rows: Record<string, any>[]): string {
  return JSON.stringify(rows)
}

export async function toExcelBuffer(rows: Record<string, any>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Export')
  if (!rows || rows.length === 0) {
    await wb.xlsx.writeBuffer()
    return Buffer.from([])
  }
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  ws.addRow(headers)
  rows.forEach(r => ws.addRow(headers.map(h => r[h] ?? '')))
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer
  return Buffer.from(buf as any)
}

