import { useState } from "react";

export default function EditPatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState({
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    bed: patient.bed,
    ward: patient.ward,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">

        <h2 className="text-xl font-semibold">Edit Patient</h2>

        {["name", "age", "gender", "bed", "ward"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium capitalize">
              {field}
            </label>
            <input
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        ))}

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => onSave(form)}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
