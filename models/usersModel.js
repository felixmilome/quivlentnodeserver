const mongoose = require("mongoose");

const coordinatesSchema = new mongoose.Schema({
    lat: { type: Number, default:null },
    lng: { type: Number, default:null }
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
  photoPathsArray:[],
  location: {
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
    type: Date,
    default: new Date(),
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
  suspended:{
    type:String,
    default:false
  },
  suspendedReason: {
    type: String,
    default: "none",
  },
  suspensionEndDate: {
    type: Number,
    default:parseInt(Date.now()),
  }

});

exports.UsersModel = mongoose.model("UsersModel", usersSchema, "UsersModel");