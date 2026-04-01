const validatePatientBody = (req, res, next) => {
    const { name, age, gender } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Patient name is required" });
    }

    // Basic type checking
    if (age && isNaN(Number(age))) {
        return res.status(400).json({ message: "Age must be a valid number" });
    }

    next();
};

const validateAuthBody = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    next();
};

module.exports = {
    validatePatientBody,
    validateAuthBody
};
