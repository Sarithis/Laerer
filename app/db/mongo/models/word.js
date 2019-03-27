`use strict`;

module.exports = (mongoose) => {
    const wordSchema = new mongoose.Schema({
        word: {
            required: true,
            type: String,
            trim: true,
            lowercase: true,
        },
        article: {
            required: false,
            type: String,
            trim: true,
            lowercase: true,
        },
        translation: {
            required: true,
            type: String,
            trim: true,
            lowercase: true,
        },
        articleTranslation: {
            required: false,
            type: String,
            trim: true,
            lowercase: true,
        },
        score: {
            required: false,
            type: Number,
            default: 0,
        },
        failed: {
            required: false,
            type: Number,
            default: 0,
        },
        succeeded: {
            required: false,
            type: Number,
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            select: false
        },
    }, {
        collection: `words`,
    });

    return mongoose.model(`word`, wordSchema);
};
