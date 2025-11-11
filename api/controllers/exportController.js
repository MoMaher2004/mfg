const ExcelJS = require('exceljs')
const { getTables, getTableData } = require('../models/exportModel')

async function exportDatabase(req, res) {
  try {
    const workbook = new ExcelJS.Workbook()

    // Get all tables
    const tables = await getTables()

    for (const table of tables) {
      const sheet = workbook.addWorksheet(table)

      const rows = await getTableData(table)

      if (rows.length > 0) {
        // Add header row
        sheet.addRow(Object.keys(rows[0]))

        // Add data rows
        rows.forEach((row) => {
          sheet.addRow(Object.values(row))
        })
      }
    }

    // Set response headers
    res.setHeader('Content-Disposition', 'attachment; filename=database_export.xlsx')
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    // Send file directly as stream
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Export Error:', error)
    res.status(500).json({ error: 'Failed to export database' })
  }
}

module.exports = { exportDatabase }
