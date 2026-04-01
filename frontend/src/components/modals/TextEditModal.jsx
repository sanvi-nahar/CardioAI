export default function TextEditModal({ title, value, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-lg space-y-4">

        <h2 className="text-xl font-semibold">{title}</h2>

        <textarea
          className="w-full h-40 border rounded-lg p-3 text-sm"
          defaultValue={value}
          id="editTextField"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave(document.getElementById("editTextField").value)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
