const Alert = require("../models/Alert");
const { calculateNews2 } = require("./news2Service");

/**
 * Handles patient state transitions, alert generation, and recovery detection
 */
async function processPatientState(patient, evaluation, vitalsSnapshot, io) {
    const { status, message, news2 } = evaluation;
    const now = new Date();

    const news2Score = news2?.score ?? calculateNews2(vitalsSnapshot).score;

    if (!patient.statusStartTime) {
        patient.statusStartTime = now;
    }

    if (patient.status !== status) {
        patient.statusStartTime = now;
        patient.status = status;

        if (status === "normal") {
            const unresolvedAlerts = await Alert.find({ patient: patient._id, resolved: false });
            for (const alert of unresolvedAlerts) {
                alert.resolved = true;
                alert.resolvedAt = now;
                await alert.save();
            }

            if (unresolvedAlerts.length > 0) {
                io.emit("alerts-resolved", { patientId: patient._id, message: `${patient.name} has stabilized (NEWS2: ${news2Score})` });
            }
        } else {
            const alertMessage = status === "critical" 
                ? `NEWS2 score critical (score: ${news2Score})`
                : message || `NEWS2 score elevated (score: ${news2Score})`;
            await createAlert(patient, status, alertMessage, vitalsSnapshot, io);
        }
    } else {
        if (status === "warning" || status === "critical") {
            const diffMs = now.getTime() - new Date(patient.statusStartTime).getTime();
            const diffMins = diffMs / 60000;

            if (diffMins > 2) {
                patient.statusStartTime = now;
                const reminderType = status === "critical" ? "critical" : "warning";
                await createAlert(patient, reminderType, `Reminder: ${status === "critical" ? "Critical" : "Warning"} state ongoing - NEWS2: ${news2Score}`, vitalsSnapshot, io);
            }
        }
    }
}

async function createAlert(patient, severity, message, vitalsSnapshot, io) {
    console.log(`🔔 Creating alert: ${severity} - ${message} for ${patient.name}`);
    
    const recentAlert = await Alert.findOne({
        patient: patient._id,
        severity: severity,
        resolved: false,
        createdAt: { $gte: new Date(Date.now() - 120000) }
    });

    if (recentAlert) {
        console.log("Skipping duplicate alert within 2 minutes");
        return;
    }

    const newAlert = await Alert.create({
        patient: patient._id,
        patientName: patient.name,
        severity,
        message,
        vitalsSnapshot,
        createdAt: new Date(),
        resolved: false
    });

    const populated = await newAlert.populate(
        "patient",
        "name age gender bed ward bp heartRate spo2 temp status healthScore"
    );

    console.log("Emitting new-alert event:", populated);
    io.emit("new-alert", populated);
    if (global.io) {
        global.io.emit("new-alert", populated);
    }
    console.log(`⚠️ ALERT [${severity.toUpperCase()}]:`, message, "for", patient.name);
}

module.exports = {
    processPatientState,
};
