const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHangler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
	email: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true,
		validate: [validator.isEmail, 'Invalid Email Address'],
		required: 'Please Supply an email address'
	},
	name: {
		type: String,
		require: 'Please supply a name',
		trim: true
	},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	hearts: [
		{
			type: mongoose.Schema.ObjectId, 
			ref: 'Store'
		}
	]
});

userSchema.virtual('gravatar').get(function() {
	// return 'http://images5.fanpop.com/image/photos/29700000/Dwayne-The-Rock-Johnson-dwayne-the-rock-johnson-29742797-232-245.png';
	const hash = md5(this.email);
	return `https://gravatar.com/avatar/${hash}?s=200`;
})

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHangler);

module.exports = mongoose.model('User', userSchema);