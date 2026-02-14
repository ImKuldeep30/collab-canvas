const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    refreshToken: String,
    tokenBlacklist: [String], // Store blacklisted access tokens
}, { timestamps: true }); 

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return; // no need to hash again

    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
        // throwing will cause the save operation to reject and propagate the error
        throw error;
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);