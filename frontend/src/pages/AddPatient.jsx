import React, { useState } from "react";
import { createPatient } from "../api/api";
import { UserPlus, Activity, ClipboardList } from "lucide-react";

const AddPatient = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    bed: "",
    ward: "",
    heartRate: "",
    bloodPressure: "",
    spo2: "",
    temperature: "",
    medicalHistory: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await createPatient(formData);
      setSuccessMsg("Patient added successfully!");

      setFormData({
        name: "",
        age: "",
        gender: "",
        phone: "",
        address: "",
        bed: "",
        ward: "",
        heartRate: "",
        bloodPressure: "",
        spo2: "",
        temperature: "",
        medicalHistory: "",
      });
    } catch (error) {
      console.error("SERVER ERROR:", error.response?.data || error);
      setErrorMsg(
        error.response?.data?.message ||
          "Failed to add patient. Check all fields."
      );
    }

    setLoading(false);
  };

  const inputClass = "w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserPlus className="text-slate-700" />
          Add New Patient
        </h2>
        <p className="text-slate-600 mt-1">Register a new patient in the monitoring system</p>
      </div>

      <div className="bg-white w-full max-w-4xl shadow-sm rounded-2xl p-5 sm:p-8 border border-slate-200">

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-xl">✓</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddPatient} className="space-y-8">

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="text-slate-500" size={20} />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Age</label>
                <input
                  name="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  name="phone"
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Address</label>
                <input
                  name="address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Bed Number</label>
                <input
                  name="bed"
                  type="text"
                  placeholder="Enter bed number"
                  value={formData.bed}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ward</label>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Emergency">Emergency</option>
                  <option value="General Ward">General Ward</option>
                  <option value="CCU">CCU</option>
                  <option value="NICU">NICU</option>
                  <option value="Private Room">Private Room</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="text-slate-500" size={20} />
              Initial Vital Signs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Heart Rate (BPM)</label>
                <input
                  name="heartRate"
                  type="number"
                  placeholder="Enter heart rate"
                  value={formData.heartRate}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Blood Pressure</label>
                <input
                  name="bloodPressure"
                  type="text"
                  placeholder="120/80"
                  value={formData.bloodPressure}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">SpO₂ (%)</label>
                <input
                  name="spo2"
                  type="number"
                  placeholder="Enter SpO2"
                  value={formData.spo2}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Temperature (°C)</label>
                <input
                  name="temperature"
                  type="number"
                  placeholder="Enter temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList className="text-slate-500" size={20} />
              Medical History
            </h3>

            <textarea
              name="medicalHistory"
              placeholder="Any known medical history, allergies, etc..."
              value={formData.medicalHistory}
              onChange={handleChange}
              rows="4"
              className={inputClass}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Adding Patient..." : "Add Patient"}
          </button>

        </form>
      </div>
    </div>
  );
};

import { User } from "lucide-react";
export default AddPatient;
