
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter: (req, file, next) => {
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto) {
			next(null, true);
		} else {
			next({ message: "That filetype isn\'t allowed!" }, false);
		}
	}
};

exports.myMiddleware = (req, res, next) => {
	req.name = 'Wes';
	next();
}

exports.homePage = (req, res) => {
//	console.log(req.name);
//	req.flash('error', `Something Happened`);
//	req.flash('info', `Something Happened`);
//	req.flash('warning', `Something Happened`);
//	req.flash('success', `Something Happened`);
  // res.send('Hey! It works!');
  res.render('index');
}

exports.addStore = (req, res) => {
  res.render('editStore', {title: "Add Store"});
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) =>{
	// check if there is no new file to resize
	if(!req.file) {
		next(); // skip to the next middleware
		return;
	}
	//console.log(req.file)
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// once we have written the photo to our filesystem, keep going!
	next();
}

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
//	console.log('Create store');
//	console.log(req.body);
//	res.json(req.body);
	
//	const store = new Store(req.body);
//	await store.save();
	const store = await (new Store(req.body)).save();

	req.flash('success', `Successfully Created ${store.name}. Careto leave a review?`);
//	console.log('It worked!');
	res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 4;
	const skip = (page - 1) * limit;
	// 1. Query the database for a list of all stores
//	const stores = await Store.find().populate('reviews');
//	const stores = await Store
//		.find()
//		.skip(skip)
//		.limit(limit);
	const storesPromise = Store
		.find()
		.skip(skip)
		.limit(limit)
		.sort({ created: 'desc'});
	const countPrmise = Store.count()
	const [stores, count] = await Promise.all([storesPromise, countPrmise]);
	const pages = Math.ceil(count / limit);
	// If data changed and there is pagination going on beyond pages count then fix it
	if (!stores.length && skip) {
		req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`)
		res.redirect(`/stores/page/${pages}`);
		return;
	}

//	console.log(stores);
	res.render('stores', { title: 'Stores', stores, page, pages, count });
}

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)) {
		throw Error('You must own a store in order to edit it!');
	}
}

exports.editStore = async (req, res) => {
	// 1. Find the store given the ID
	const store = await Store.findOne({_id: req.params.id})
//	res.json(store)
	// 2. confirm they are the owner of the store
	confirmOwner(store, req.user);
	// 3. Render out the edit form so the user can update their store
	res.render('editStore', {title: `Edit ${store.name}`, store});
}

exports.updateStore = async (req, res) => {
	// set the location data to be a point
	req.body.location.type = 'Point';
	// finad and update the store
	const store = await Store.findOneAndUpdate({_id: req.params.id }, req.body, {
		new: true, // return the new store instead of the old one
		runValidators: true
	}).exec();
	req.flash('success', `Successfully updated <strong>${store.name}</strong> <a href="/stores/${store.slug}">View Store</a>`)
	// Redirect them the store and store and tell them it worked
	res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
	const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
	console.log(store);
	if(!store) {
		return next();
	}
	//res.json(store);
	res.render('store', {store, title: store.name});
}

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag;
	//res.send("Works!");
	const tagQuery = tag || { $exists: true };
	const tagsPromise = Store.getTagsList();
	// const storesPromise = Store.find({ tags: tag });
	const storesPromise = Store.find({ tags: tagQuery });

	// const result = await Promise.all([tagsPromise, storesPromise]);
	// var tags = result[0];
	// var stores = result[0];
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);


	// const tags = await Store.getTagsList();
	// const stores = await Store.find();

	// res.json(tags);
	// res.json(stores);
	res.render('tags', { tags, title: 'Tags', tag, stores });
}

exports.searchStores = async (req, res) => {
	// res.json(req.query)
	// Firs find stores that match
	const stores = await Store.find({
		$text: {
			$search: req.query.q
		}
	}, {
		score: { 
			$meta: 'textScore' 
		}
	})
	// Sort them
	.sort({
		score: {
			$meta: 'textScore'
		}
	})
	// Limi to only 5 results
	.limit(5);
	res.json(stores);
}

exports.mapsStores = async (req,res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates
				},
				$maxDistance: 10000 // 10km
			}
		}
	};

	const stores = await Store
		.find(q)
		// .select('-author -tags');
		.select('slug name description location photo')
		.limit(10);
	res.json(stores);
}

exports.mapPage = (req, res) => {
	res.render('map', { title: 'Map' });
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	//console.log(hearts);
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User
		.findByIdAndUpdate(req.user._id,
			{ [operator]: { hearts: req.params.id }},
			{ new: true }
		);
	res.json(user)
}

exports.getHearts = async (req, res) => {
	const stores = await Store.find({
		_id: { $in: req.user.hearts }
	});
	res.render('stores', { title: 'Hearted Stores', stores});
}

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();
	// res.json(stores);
	res.render('topStores', {stores, title: 'Top Stores'});
}