//app.js

require('./db');
require('./auth');

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const Address = mongoose.model('Address');
const Message = mongoose.model('Message');
const Commodity = mongoose.model('Commodity');

const path = require('path');
const bodyParser = require('body-parser');
const app = express();

//socket.io
const http = require('http').Server(app);
const io = require('socket.io')(http);

// enable sessions
const session = require('express-session');
const sessionOptions = {
    secret: 'secret cookie thang (store this elsewhere!)',
    resave: true,
    saveUninitialized: true
};
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// body parser setup
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/ezsell/register-login', function(req, res) {
  res.render('registerAndLogin');
});

app.post('/ezsell/register-login', function(req,res,next) {
	passport.authenticate('local', function(err,user) {
	if(user) {
		req.logIn(user, function(err) {
			//console.log("User: ",user);
			let slug = user.username;
			res.redirect('/ezsell/manage-commodities');
		});
	} else {
	  	res.render('registerAndLogin', {message:'Your login or password is incorrect.'});
	}
	})(req, res, next);
});

app.get('/ezsell/create-new-account', function(req, res) {
  	res.render('createAccount');
});

app.post('/ezsell/create-new-account', function(req, res) {
	let name = req.body.name;
	let phone = req.body.phone;
	let street = req.body.street;
	let city = req.body.city;
	let state = req.body.state;
	let zip = req.body.zip;

	const address = [];

	const addressObj = new Address({
		street_address: street,
		city: city,
		state: state,
		zip_code: zip
	});

	address.push(addressObj);

	User.register(new User({
		username: req.body.username, 
		name: name,
		phone: phone,
		address: address}), req.body.password, function(err, user){
			console.log("user register: ", user);
			if (err) {
				console.log(err);
				res.render('createAccount',{message: 'Your registration information is not valid'});
			} 
			else {
			  	passport.authenticate('local')(req, res, function() {
			    	res.redirect('/ezsell/manage-commodities');
			  	});
			}
	});   
});

app.get('/ezsell/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/ezsell/logout', function(req, res){
    res.redirect('/ezsell/logout');
})


app.get('/ezsell/lastest-posted-commodities', (req, res) => {
	Commodity.find((err, commodity, count) => {
		//console.log(commodity);
		commodity.sort(function(a,b){
  			// Turn strings into dates, and then subtract them
  			// to get a value that is either negative, positive, or zero.
  			return new Date(b.postedAt) - new Date(a.postedAt);
		});
  		res.render('lastestPost', {commodity: commodity});
  	});
});


app.get('/ezsell/manage-commodities', (req, res) => {
	//let slug = req.params.slug;
	//var slug = "rh1921";
	//var slug = req.body.hiddenSlug;
	//console.log("Check1: ", slug);
	//console.log(req.session);
	//console.log(req.session.passport.user);

	User.findOne({username: req.session.passport.user}, (err, user, count) => {
		if (err) return handleError(err);
		console.log("check5");
		Commodity.find({user: user._id}, (err, commodity, count) => {
			console.log("check1");
			//console.log("Manage Page: ", commodity);
			res.render('manageCommodities', {user: user, commodity: commodity});
		});
		//console.log(user);
	});
});

app.post('/ezsell/manage-commodities/add', (req, res) => {
	var productName = req.body.productName;
	var price = req.body.price;
	var description = req.body.description;
	var url = req.body.url;
	//var slug = req.body.hiddenSlug;
	//console.log("hiddenSlug: ", slug);
	console.log("check2");

	User.findOne({username: req.session.passport.user}, function(err, user, count){
		console.log(user);
		//console.log(user._id);
		new Commodity({
			productName: productName,
			price: price,
			description: description,
			url: url,
			postedAt: new Date(),
			user: user._id // assign the _id from the user
		}).save(function(err, commodity, count){
			//console.log(commodity.postedAt)
			//console.log('Check', commodity);
			if (err) return handleError(err);
			res.redirect('/ezsell/manage-commodities')
			});
	});

});

app.post('/ezsell/manage-commodities/edit', (req, res) => {
	var commodityID = req.body.commodityID;
	var productNameEdit = req.body.productName;
	var priceEdit = req.body.price;
	var descriptionEdit = req.body.description;
	var urlEdit = req.body.url;
	//var slug = req.body.hiddenSlug;
	//console.log(commodityID);

	// console.log("Check1",productNameEdit);
	// console.log("Ckeck2",priceEdit);
	// console.log("Check3",descriptionEdit);
	// console.log(typeof(descriptionEdit));

	if(productNameEdit){
		Commodity.update({_id: commodityID}, {
		productName: productNameEdit,
		}, function(err, numberAffected, rawResponse) {
   			//handle it
		});
	}

	if(priceEdit){
		Commodity.update({_id: commodityID}, {
		price: priceEdit,
		}, function(err, numberAffected, rawResponse) {
   			//handle it
		});
	}

	if(descriptionEdit){
		Commodity.update({_id: commodityID}, {
		description: descriptionEdit,
		}, function(err, numberAffected, rawResponse) {
   			//handle it
		});
	}

	if(urlEdit){
		Commodity.update({_id: commodityID}, {
		url: urlEdit,
		}, function(err, numberAffected, rawResponse) {
   			//handle it
		});
	}

	res.redirect('/ezsell/manage-commodities');


	// Commodity.findOne({_id: commodityID}, (err, commodity, count) => {
	// 	console.log("Here");
	// 	console.log(commodity);
	// 	if(!productNameEdit){
	// 		console.log("Check4", commodity.productName);
	// 		productNameEdit = commodity.productName;
	// 	}
	// 	if(!priceEdit){
	// 		priceEdit = commodity.price;
	// 	}
	// 	if(!descriptionEdit){
	// 		console.log("Check6", commodity.description);
	// 		descriptionEdit = commodity.description;
	// 		console.log("Check7", descriptionEdit);
	// 	}
	// 	if(!urlEdit){
	// 		urlEdit = commodity.url;
	// 	}
	// });

	// console.log("Check8", descriptionEdit);

	// Commodity.update({_id: commodityID}, {
	// 	productName: productNameEdit,
	// 	price: priceEdit,
	// 	description: descriptionEdit,
	// 	url: urlEdit
	// }, function(err, numberAffected, rawResponse) {
 // 		res.redirect('/ezsell/'+slug+'/manage-commodities');
	// });



	// Commodity.findOne({_id: commodityID}, (err, commodity, count) => {
	// 	console.log("Edit :", commodity);
		// if(productNameEdit){
		// 	console.log(productNameEdit);
		// 	console.log(commodity.productName);
		// 	commodity.productName = productNameEdit;
		// 	console.log(commodity.productName);
		// }
		// if(priceEdit){
		// 	commodity.price = priceEdit;
		// }
		// if(descriptionEdit){
		// 	commodity.description = descriptionEdit;
		// }

	// 	res.redirect('/ezsell/'+slug+'/manage-commodities');

	// });


});


app.post('/ezsell/manage-commodities/delete', (req, res) => {
	var checkBox = req.body.checkbox;
	var checkBoxArray = [];

	if(!Array.isArray(checkBox)){
		checkBoxArray.push(checkBox);
	}
	else{
		checkBoxArray = checkBox;
	}

	checkBoxArray.forEach(function(n){
		Commodity.remove({_id: n}, function(err) {});
	});

    res.redirect('/ezsell/manage-commodities');
});



app.get('/ezsell/about', (req, res) => {
  res.render('about');
});

app.listen(process.env.PORT || 3000);