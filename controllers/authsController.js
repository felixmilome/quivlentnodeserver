const {UsersModel} = require('../models/usersModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {generateOtp} = require('../functions/index.js')
const { mailVerificationLink } = require('./emailsController.js')

require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

exports.registerCtrl = async (req,res) => { 
    

    try {

        const {identifier, identifierType, username, password, countryCode, dialCode} = req.body;
        console.log(req.body);
        if (
            (![identifier, identifierType, username, password].every(val => val && val?.length > 0))
            ||
            (identifierType === 'phone' && ![countryCode, dialCode].every(val => val && val?.length > 0))
        ) 
        {
            return res.json({ status: 'error', message: 'input value error' });
        }

        const identityMatchQuery = identifierType === 'phone' 
            ? { phone: identifier, phoneVerified: true } 
            : identifierType === 'email' 
            ? { email: identifier, emailVerified: true } 
            : null;

        const existingUser = await UsersModel.findOne(identityMatchQuery, { _id: 1 });
        const existingUsername = await UsersModel.findOne({username:username})

        if(existingUser?._id?.length>0) return res.json({status: 'error', message: `${identifierType} already in use`});
        if(existingUsername?._id?.length>0) return res.json({status: 'error', message: `username already in use`});
        if( /^\S+$/.test(password) === false || password?.length < 5 || password?.length > 26)  res.json({status: 'error', message:"Invalid Password Format"});
        
        const hashedPassword = await bcrypt.hash (password, 12);  

        const otp = await generateOtp(5)
        const otpToken = jwt.sign({otpNumber: otp}, jwtSecret, {expiresIn: "24h"});
        const mkTimeNow = Date.now()

        await UsersModel.deleteMany(
            identifierType === 'phone' 
            ?  {phone:identifier}
            : {email:identifier},
        );

        const newUser = {
            username,
            password: hashedPassword,
            createdTime: mkTimeNow,
            authOtp: otp
          };
          
          // Set phone or email based on identifierType
          if (identifierType === 'phone') {
            newUser.phone = identifier;
          } else if (identifierType === 'email') {
            newUser.email = identifier;
          }

        const createdUser = await UsersModel.create(newUser);
        const token = jwt.sign({userId: createdUser._id}, jwtSecret);

       if(identifierType === 'email'){

           // await mailVerificationLink (identifier, otpToken, username);
            
       } else if (identifierType === 'phone') {
            //send link to number
       }
       console.log(token);
       console.log('reg')
        
        res.json({status:'success', token:{userId:createdUser._id, token}, message:'Sign Up Success!'});
       
        
    } catch (error) { 

    console.log(error);
    res.json({status:'error', message: 'Internal Server Error. Please Try Later'}); 

    }

}

exports.loginCtrl = async (req,res) => {


    try{ 

        const {identifier, identifierType, password} = req.body;

        console.log(req.body);
    
        const existingUser = await UsersModel.findOne(
            
            identifierType === 'phone'
                ? {phone:identifier}
                : {email:identifier}, 
            {_id:1, password:1}
        );
        console.log(existingUser);

        if (!existingUser) return res.json({status: 'error', message: "Invalid Log In Credentials"});

        const passwordCorrect = await bcrypt.compare(password, existingUser?.password);

        if (!passwordCorrect) return res.json({status: 'error', message: "Invalid Log In Credentials"});

        //console.log(loggedUser);
        const token = jwt.sign({userId: existingUser._id}, jwtSecret);
        console.log(token);
        console.log('log')
        
        res.json({status:'success', token:{userId:existingUser._id, token}, message:'Log In Success!'});
        

    } catch (error){
        console.log(error.message);
        res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
    
    }
}

// exports.verifyPhoneOtpCtrl = async (req,res) => {


//     try{ 

//         const {otp} = req.body;
//         const userId =  req.userId;
    
//         const existingUser = await UsersModel.findById(userId, {_id:1, authOtpToken:1});

//         const toke(existingUser?.authOtpToken)
//         const otpNumber = tokenData?.otpNumber

//         if (!otpNumber?.length>0 || otp !== otpNumber ) return res.json({status: 'error', message: "Invalid Otp"});
        
//         await UsersModel.findByIdAndUpdate(userId, {authOtpToken:null, phoneVerified:true});

//         const token = jwt.sign({userId: existingUser._id}, jwtSecret, {expiresIn: "720d"});
        
//         res.json({status:'success', token:token, message:'Otp Verification Success!'});
        

//     } catch (error){

//         res.json({message: 'Verification Failed.'});
    
//     }
// }

// exports.requestChangePasswordCtrl = async (req,res) => {

//     //In Middleware check if User Is Verified you can send from frontend.

//         try{ 
    
//             const {phone, newPassword} = req.body;
         
        
//             const existingUser = await UsersModel.findOne({phone: {$eq:phone} }, {_id:1, authOtpToken:1});

//             if(!existingUser?._id?.length>0) res.json({status:'error', message:"User Account Doesnt Exist"})
            
//             const otp = await generateOtp()
//             //send Otp Message

//             const token = jwt.sign({userId: existingUser._id, otpNumber:otp, newPassword:newPassword}, jwtSecret, {expiresIn: "10"});
            
//             res.json({status:'success', message:`An Otp has been sent to ${phone}!`});
            
    
//         } catch (error){
    
//             res.json({message: 'Internal Server Error. Please Try Later'});
        
//         }
//     }

// exports.verifyPasswordOtpCtrl = async (req,res) => {

// //In Middleware check if User Is Verified you can send from frontend.

//     try{ 

//         const {otp, phone} = req.body;
     
    
//         const existingUser = await UsersModel.findOne({phone: {$eq:phone} }, {_id:1, authOtpToken:1});

//         const toke(existingUser?.authOtpToken)
//         const otpNumber = tokenData?.otpNumber

//         if (!otpNumber?.length>0 || otp !== otpNumber ) return res.json({status: 'error', message: "Invalid Otp"});

//         await UsersModel.findByIdAndUpdate(userId, {authOtpToken:null, password:tokenData?.newPassword});

//         const token = jwt.sign({userId: existingUser._id}, jwtSecret, {expiresIn: "720d"});
        
//         res.json({status:'success', token:token, message:'Password Changed Successfully!'});
        

//     } catch (error){

//         res.json({message: 'Internal Server Error. Please Try Later'});
    
//     }
// }

//  exports.verifyChangePasswordCtrl = async (req,res) => {

// //In Middleware check if User Is Verified you can send from frontend.

//     try{ 

//         const {otp, phone} = req.body;
     
    
//         const existingUser = await UsersModel.findOne({phone: {$eq:phone} }, {_id:1, authOtpToken:1});

//         const toke(existingUser?.authOtpToken)
//         const otpNumber = tokenData?.otpNumber

//         if (!otpNumber?.length>0 || otp !== otpNumber ) return res.json({status: 'error', message: "Invalid Otp"});

//         await UsersModel.findByIdAndUpdate(userId, {authOtpToken:null, password:tokenData?.newPassword});

//         const token = jwt.sign({userId: existingUser._id}, jwtSecret, {expiresIn: "720d"});
        
//         res.json({status:'success', token:token, message:'Password Changed Successfully!'});
        

//     } catch (error){

//         res.json({message: 'Internal Server Error. Please Try Later'});
    
//     }
// }