const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS
	}
});

/*
transport.sendMail({
	from: 'Pate <patrik.forsman@atoz.fi>',
	to: 'Foke <patrik.forsman@atoz.fi>',
	subject: 'Just trying things out!',
	html: 'Hey I <strong>love</strong> you too',
	text: 'Hey I **love you** too'
});
*/

const generateHTML = (filename, options = {}) => {
	const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
//	console.log(html);
	const inline = juice(html);
//	return html;
	return inline;
}


exports.send = async (options) => {
	const html = generateHTML(options.filename, options);
	const text = htmlToText.fromString(html);

	const mailOptions = {
		from: 'AtoZ <patrik.forsman@atoz.fi>',
		to: options.user.email,
		subject: options.subject,
		html,
		text
	};
	const sendMail = promisify(transport.sendMail, transport);
	return sendMail(mailOptions);
}