const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
	creates: {
		type: Date,
		default: Date.now
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You mus supply an author!'
	},
	store: {
		type: mongoose.Schema.ObjectId,
		ref: 'Store',
		required: 'You mus supply a store!'
	},
	text: {
		type: String,
		required: 'You review mus have text!'
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	}
});

function autopopulate(next) {
	this.populate('author');
	next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);