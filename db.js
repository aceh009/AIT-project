//db.js
//A 1st draft mongoose schema

const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const passportLocalMongoose = require('passport-local-mongoose');

//An address in a user
const Address = new mongoose.Schema({
	street_address: {type: String, required:true},
	city: {type: String, required:true},
	state: {type: String, required:true},
	zip_code: {type: Number, required:true}
});

// a message in a commodity list
const Message = new mongoose.Schema({
	sender: {type: String, required: true},
	content: {type: String, required: true},
	time_created: {type: Date, required: true}
})

// users
// * our site requires authentication...
// * so users have a username and password
// * they also can have 0 or more lists
const User = new mongoose.Schema({
	// username provided by authentication plugin
	// password hash provided by authentication plugin
	//userID: {type: String, required: true},
	//_id: mongoose.Schema.Types.ObjectId,
	name: {type: String, required: true},
	//latest_postedAt: Date,
	//total_commodities: {type: Number, required: true},
	phone: {type: String, required: true},
	address: [Address],
	comomodities:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commodity' }]
});

// a comomodity list
// * each list must have a related user
// * a list can have 0 or more messages
const Commodity = new mongoose.Schema({
	// a reference to a User object
	user: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
	//commodityID: {type: String, required: true},
	productName: {type: String, required: true},
	price: {type: String, required: true},
	// price: {type: Number, required: true},
	description: {type: String, required: true},
	url: {type: String, required: true},
	postedAt: {type: Date, required: true}
	//embedded
	//message: [Message]
});

//generate a slug property
User.plugin(URLSlugs('username'));
User.plugin(passportLocalMongoose);

// "register" it so that mongoose knows about it
mongoose.model('User', User);
mongoose.model("Address", Address);
mongoose.model('Commodity', Commodity);
mongoose.model('Message', Message);

// is the environment variable, NODE_ENV, set to PRODUCTION? 
if (process.env.NODE_ENV === 'PRODUCTION') {
 	// if we're in PRODUCTION mode, then read the configration from a file
 	// use blocking file io to do this...
 	const fs = require('fs');
 	const path = require('path');
 	const fn = path.join(__dirname, 'config.json');
 	const data = fs.readFileSync(fn);

 	// our configuration file will be in json, so parse it and set the
 	// conenction string appropriately!
 	const conf = JSON.parse(data);
 	var dbconf = conf.dbconf;
} 
else {
 	// if we're not in PRODUCTION mode, then use
 	dbconf = 'mongodb://localhost/finalProject';
}

mongoose.connect(dbconf);
