"use strict";

module.exports = (mongoose) => {
    const userSchema = new mongoose.Schema({
        login: {
            match: /^[a-zA-Z0-9]{1,}$/,
            unique: true,
            required: true,
            type: String,
            trim: true,
            lowercase: true,
        },
        password: {
            select: false,
            required: true,
            type: String,
        },
    }, {
        collection: `users`,
    });

    return mongoose.model(`user`, userSchema);
};
