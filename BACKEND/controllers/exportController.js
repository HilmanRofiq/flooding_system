const SensorData = require("../models/SensorData");
const { getCachedSettings } = require("./settingsController");

/**
 * GET /api/admin/export-csv
 * Admin only — export sensor data as CSV
 * Query params: limit, startDate, endDate
 */
const exportCSV = async (req, res) => {
  try {
    const { limit = 500, startDate, endDate } = req.query;

    // Parse and guard limit
    let queryLimit = parseInt(limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) queryLimit = 500;
    if (queryLimit > 5000) queryLimit = 5000;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.waktu = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.waktu.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set end date to end of day
          end.setHours(23, 59, 59, 999);
          filter.waktu.$lte = end;
        }
      }
      // Remove empty waktu filter
      if (Object.keys(filter.waktu).length === 0) delete filter.waktu;
    }

    // Get settings for context
    const settings = await getCachedSettings();

    // Query data
    const data = await SensorData.find(filter)
      .sort({ waktu: -1 })
      .limit(queryLimit)
      .lean();

    const total = await SensorData.countDocuments(filter);

    // Format CSV with clean columns
    const escapeCSV = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    // CSV Headers
    const headers = [
      'No',
      'Waktu (WIB)',
      'Device ID',
      'Jarak Sensor (cm)',
      'Tinggi Air (cm)',
      'Kelembapan Tanah (raw)',
      'Status',
    ];

    // CSV Rows
    const rows = data.map((item, index) => [
      index + 1,
      formatDate(item.waktu),
      item.device_id || '-',
      item.distance_cm != null ? Number(item.distance_cm).toFixed(1) : '-',
      item.water_level != null ? Number(item.water_level).toFixed(1) : '-',
      item.soil_raw != null ? item.soil_raw : '-',
      item.status || '-',
    ]);

    // Build CSV string
    const csvContent = [
      // Metadata header
      `# Export Data Sensor - ${settings.stationInfo?.name || 'Flooding System'}`,
      `# Tanggal Export: ${formatDate(new Date())}`,
      `# Total Data: ${total} | Ditampilkan: ${data.length}`,
      `# Batas AMAN: <= ${settings.thresholds?.aman_max || 80} cm | WASPADA: <= ${settings.thresholds?.waspada_max || 120} cm | SIAGA: <= ${settings.thresholds?.siaga_max || 140} cm`,
      '',
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\r\n');

    // Send as CSV file
    const filename = `sensor_data_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Add BOM for Excel UTF-8 compatibility
    res.send('\ufeff' + csvContent);

  } catch (error) {
    console.error("exportCSV error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * GET /api/admin/sensor-data
 * Admin only — get sensor data with preview (JSON)
 */
const getSensorDataAdmin = async (req, res) => {
  try {
    const { limit = 100, startDate, endDate } = req.query;

    let queryLimit = parseInt(limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) queryLimit = 100;
    if (queryLimit > 5000) queryLimit = 5000;

    const filter = {};
    if (startDate || endDate) {
      filter.waktu = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.waktu.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.waktu.$lte = end;
        }
      }
      if (Object.keys(filter.waktu).length === 0) delete filter.waktu;
    }

    const data = await SensorData.find(filter)
      .sort({ waktu: -1 })
      .limit(queryLimit)
      .lean();

    const total = await SensorData.countDocuments(filter);

    res.json({
      success: true,
      data,
      meta: { total, showing: data.length },
    });
  } catch (error) {
    console.error("getSensorDataAdmin error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = { exportCSV, getSensorDataAdmin };
