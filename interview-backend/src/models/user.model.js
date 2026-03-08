const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Defines the schema for a User in the system.
 * This model will store user identity, credentials, roles, and personal information.
 */
const userSchema = new mongoose.Schema({
    // Primary identifier, email must be unique.
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
        trim: true,
        // Regex for basic email format validation.
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.']
    },
    // Securely stored password hash. Never store plain text passwords.
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [8, 'Password must be at least 8 characters long.'],
        select: false // Exclude password from query results by default for security.
    },
    firstName: {
        type: String,
        required: [true, 'First name is required.'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required.'],
        trim: true
    },
    // User role determines permissions within the application.
    role: {
        type: String,
        enum: {
            values: ['admin', 'interviewer', 'candidate', 'hr_manager', 'ml_engineer'],
            message: '{VALUE} is not a supported role.'
        },
        required: [true, 'User role is required.']
    },
    phone: {
        type: String,
        trim: true,
        // Optional phone number field.
    },
    profileImageUrl: {
        type: String,
        trim: true,
        // Optional URL for a user's profile picture.
    },
    isActive: {
        type: Boolean,
        default: true
        // Flag to deactivate users without deleting their records.
    },
    // Email verification fields
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        select: false,
    },
    verificationCodeExpire: {
        type: Date,
        select: false,
    },
    // Resume parsing fields (for candidates)
    resumeUrl: {
        type: String,
        trim: true,
        // Path to the uploaded resume PDF file
    },
    parsedResume: {
        skills: [{ type: String }],
        experience: [{
            title: String,
            company: String,
            duration: String,
            description: String,
        }],
        education: [{
            degree: String,
            institution: String,
            year: String,
        }],
        summary: String,
    },
    // Password reset fields
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpire: {
        type: Date,
        select: false,
    },
    // Timestamps for record creation and updates.
}, {
    timestamps: true
});

/**
 * Mongoose 'pre-save' middleware to automatically hash the password before saving a new user.
 * This ensures that plain-text passwords are never stored in the database.
 */
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    // Hash the password with a salt round of 12.
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Mongoose instance method to compare a candidate password with the user's stored password hash.
 * @param {string} candidatePassword - The password to check.
 * @returns {Promise<boolean>} - True if the password is correct, false otherwise.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    // 'this.password' refers to the hashed password of the document instance.
    // We must explicitly select it in the query since we set 'select: false' in the schema.
    return await bcrypt.compare(candidatePassword, this.password);
};

// The user model name is singular ('User') and Mongoose will automatically
// create a collection named 'users' in the database.
const User = mongoose.model('User', userSchema);

module.exports = User;