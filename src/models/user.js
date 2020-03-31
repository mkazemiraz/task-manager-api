const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.default.isEmail(value)) {
                throw new Error('email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('password cannot contain "password"');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive number');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }], 
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});


userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.toJSON = function() {
    const user = this;
    const userPublic = user.toObject();

    delete userPublic.password;
    delete userPublic.tokens;
    delete userPublic.avatar;

    return userPublic;
}

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {expiresIn: '7 days'});
    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
}

// findByCredential
userSchema.statics.findByCredential = async (email, password) => {
    const user = await User.findOne({email});
    
    if (!user) {
        throw new Error('Unable to login');
    }

    isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
        throw new Error('password is incorrect');
    }

    return user;
}

// Hash password
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')){
        user.password = await bcryptjs.hash(user.password, 8);
    }

    next();
});

userSchema.pre('remove', async function(next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
});

const User = mongoose.model('User', userSchema);


module.exports = User;