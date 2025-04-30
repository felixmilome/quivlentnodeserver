const mongoose = require("mongoose");

// {
//   ip: '41.90.187.65',
//   city: 'Nairobi',
//   region: 'Nairobi County',
//   country: 'KE', 
//   loc: '-1.2833,36.8167',
//   org: 'AS33771 Safaricom Limited',
//   postal: '00800',
//   timezone: 'Africa/Nairobi'
// }

const coordinatesSchema = new mongoose.Schema({
    lat: { type: Number, default:null },
    lng: { type: Number, default:null }
  }, { _id: false });

const timelinePhotoSchema = new mongoose.Schema({
  indexId:Number,
  photoPath:String
}, { _id: false });

const matchesSchema = new mongoose.Schema({
  userId:String,
  status:String,
  matchedDate: Number

}, { _id: false });

const blockedSchema = new mongoose.Schema({
  userId:String,
  blockedDate: {
    type: Number,
    default:Date.now,
  }
  

}, { _id: false });

const usersSchema = mongoose.Schema({ 

  firstname: {
    type: String,
    default:null,
  },
  lastname: {
    type: String,
    default:null,
  },
  username:{
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  relationshipStatus: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: "Hello. I am on Quivlent.",
  },
  interestsArray: [String],
  career: {
    type:String,
    default:null
  },
  school: {
    type:String,
    default:null
  },
  phone:{
    type: String, 
    default: null
  },
  dialCode:{
    type:String,
    default:null
  },
  countryCode:{
    type:String,
    default:null
  },
  email:{
    type:String,
    default:null
  },

  dpPath: {
    type: String,
    default:null,
  },
  matchesArray:[matchesSchema],
  photoPathsArray:[timelinePhotoSchema],
  blockedArray:[blockedSchema],
  region: {
    type: String,
    default: null,
  },
  coordinates: {
    type:coordinatesSchema,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  authOtp:{
    type:String,
    default:null
  },
  createdTime: {
    type: Number,
    default: Date.now
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  profileVerified: {
    type: Boolean,
    default: true,
  },
  muted: {
    type: Boolean,
    default: false,
  },
  suspended:{
    type:Boolean,
    default:false
  },
  suspendedReason: {
    type: String,
    default: "none",
  },
  suspensionEndDate: {
    type: Number,
    default: Date.now
  }

});

exports.UsersModel = mongoose.model("UsersModel", usersSchema, "UsersModel");