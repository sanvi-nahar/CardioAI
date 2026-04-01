const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');

/** get alerts with pagination */
const getAlerts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const query = {};
  
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.acknowledged === 'true') query.acknowledged = true;
  if (req.query.acknowledged === 'false') query.acknowledged = false;
  if (req.query.resolved === 'true') query.resolved = true;
  if (req.query.resolved === 'false') query.resolved = false;

  const [alerts, totalRecords] = await Promise.all([
    Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("patient", "name age gender bed ward heartRate spo2 bp temp"),
    Alert.countDocuments(query)
  ]);

  res.json({
    data: alerts,
    page,
    totalPages: Math.ceil(totalRecords / limit),
    totalRecords
  });
});

/** acknowledge alert */
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) { res.status(404); throw new Error('Alert not found'); }

  alert.acknowledged = true;
  await alert.save();

  res.json({ message: 'Acknowledged' });
});

/** delete alert */
const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) { res.status(404); throw new Error('Alert not found'); }

  await alert.deleteOne();
  res.json({ message: "Alert deleted" });
});
/** Delete ALL alerts */
const deleteAllAlerts = asyncHandler(async (req, res) => {
  await Alert.deleteMany({});
  res.json({ message: "All alerts deleted successfully" });
});


module.exports = {
  getAlerts,
  acknowledgeAlert,
  deleteAlert,
  deleteAllAlerts
};
