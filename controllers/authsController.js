const {UsersModel} = require('../models/usersModel.js');
const {ChatsModel} = require('../models/chatsModel.js');
const {PostsModel} = require('../models/postsModel.js');
const {CommentsModel} = require('../models/commentsModel.js');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {jwtDecode} = require ('jwt-decode');
const {generateOtp, generateRandomString, generateUsernameFromEmail} = require('../functions/index.js')
const { mailVerificationLink } = require('./emailsController.js')
const {OAuth2Client} = require('google-auth-library');
const { promisify } = require('util');
const { sendSms } = require('./phoneController.js');
const {ipGeolocator} = require ('../functions/index.js')

//reqpass phone

require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const jwtOtpSecret = process.env.JWT_OTP_SECRET;
const googleClientId = '713960857676-8funqpldk4d6cobt0f467giarc1u16tu.apps.googleusercontent.com'
const googleClient = new OAuth2Client(googleClientId);
const verifyJwt = promisify(jwt.verify);


exports.registerCtrl = async (req,res) => { 
    

    try {

        const {identifierType} = req.body;
    
        const ipGeolocation = await ipGeolocator(req?.body?.ip) //function returns null if missing
     

        if (identifierType === 'gmail'){

            const googleData = jwtDecode(req.body.googleCredential);      

            const googleTicket = await googleClient.verifyIdToken({
                idToken:req.body.googleCredential,
                audience: googleClientId   // Specify the CLIENT_ID of the app that accesses the backend
            });

            const payload = googleTicket.getPayload();
            const {aud,exp,iss, email} = googleData;

      
            //console.log(payload);

            if (aud === payload.aud && exp === payload.exp && iss === payload.iss && email === payload.email){
                
                const existingUser = await UsersModel.findOne({ email: email, emailVerified: true } , {_id:1});
                //console.log(existingUser);
                if(existingUser){ //Log them in if they exist

                    const token = jwt.sign({userId: existingUser._id}, jwtSecret);                       
                    return res.json({status:'success', token:{userId:existingUser._id, token}, message:'Google Sign In Success!'});

                }
                else{
                
                    const randUsername = generateUsernameFromEmail(email);
                    const randPassword = generateRandomString(12);

                    const hashedPassword = await bcrypt.hash (randPassword, 12);
                    const mkTimeNow = Date.now();
    

                    const newUserNoLocation = {
                        username: randUsername,
                        email,
                        password: hashedPassword,
                        createdTime: mkTimeNow,
                        emailVerified:true,
                        
                    };

                    const newUser =  ipGeolocation?.state === true ?
                     {...newUserNoLocation,
                        countryCode:ipGeolocation?.countryCode,
                        region: ipGeolocation?.region,
                        coordinates: ipGeolocation?.coordinates
                    } : newUserNoLocation;

                    console.log(newUser);

                
                    const createdUser = await UsersModel.create(newUser);
                    const token = jwt.sign({userId: createdUser._id}, jwtSecret);
                        
                    return res.json({status:'success', token:{userId:createdUser._id, token}, message:'Google Sign Up Success!'});
                
                }

            }else{
                return res.json({ status: 'error', message: 'Not authorized' });
            }
           


        }else{

            const {identifier, username, password, countryCode, dialCode} = req.body;
             //console.log(req.body);
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
            //console.log(existingUser);
            
            const existingUsername = await UsersModel.findOne({username:username})
            //console.log(existingUsername);

            if(existingUser) return res.json({status: 'error', message: `${identifierType} already in use`});
            if(existingUsername) return res.json({status: 'error', message: `username already in use`});
            if( /^\S+$/.test(password) === false || password?.length < 5 || password?.length > 26)  res.json({status: 'error', message:"Invalid Password Format"});
            
            const hashedPassword = await bcrypt.hash (password, 12);  

            const otp = await generateOtp(5)
            const mkTimeNow = Date.now()

            await UsersModel.deleteMany(
                identifierType === 'phone' 
                ?  {phone:identifier}
                : {email:identifier},
            );

            const newUserNoLocation = {
                username,
                password: hashedPassword,
                createdTime: mkTimeNow,
                authOtp: otp
            };
            
            const newUser =  ipGeolocation?.state === true ?
            {...newUserNoLocation,
               countryCode:ipGeolocation?.countryCode,
               region: ipGeolocation?.region,
               coordinates: ipGeolocation?.coordinates
           } : newUserNoLocation;

        
            
            // Set phone or email based on identifierType
            if (identifierType === 'phone') {
                newUser.phone = identifier;
            } else if (identifierType === 'email') {
                newUser.email = identifier;
            }

            const createdUser = await UsersModel.create(newUser);
          

            const otpToken = jwt.sign({otpNumber: otp, userId:createdUser?._id, identifierType}, jwtOtpSecret, {expiresIn: "24h"});

            if(identifierType === 'email'){
                const subject = "Verify Your Email";
                const path = "verify-account";
                await mailVerificationLink (identifier, subject, path, otpToken, username);
                    
            } 
            else if (identifierType === 'phone') {
          
                    const urlPath = `verify/${otpToken}`
                    await sendSms(urlPath, identifier);
             
            }
            const token = jwt.sign({userId: createdUser._id}, jwtSecret);
          
            
            return res.json({status:'success', token:{userId:createdUser._id, token}, message:'Sign Up Success!'});
        }
        
    } catch (error) { 

    console.log(error);
    return res.json({status:'error', message: 'Internal Server Error. Please Try Later'}); 

    }
    

}

exports.loginCtrl = async (req,res) => {


    try{ 

        const {identifierType} = req.body;

      


        if (identifierType === 'gmail'){

            const googleData = jwtDecode(req.body.googleCredential);      

            const googleTicket = await googleClient.verifyIdToken({
                idToken:req.body.googleCredential,
                audience: googleClientId   // Specify the CLIENT_ID of the app that accesses the backend
            });

            const payload = googleTicket.getPayload();
            const {aud,exp,iss, email} = googleData;

      
       

            if (aud === payload.aud && exp === payload.exp && iss === payload.iss && email === payload.email){
                
                const existingUser = await UsersModel.findOne({ email: email, emailVerified: true } , {_id:1});
             
                if(existingUser){

                    const token = jwt.sign({userId: existingUser._id}, jwtSecret);                       
                    return res.json({status:'success', token:{userId:existingUser._id, token}, message:'Google Sign In Success!'});

                }
                else{
                
                    const randUsername = generateUsernameFromEmail(email);
                    const randPassword = generateRandomString(12);

                    const hashedPassword = await bcrypt.hash (randPassword, 12);
                    const mkTimeNow = Date.now();
    

                    const newUser = {
                        username: randUsername,
                        email,
                        password: hashedPassword,
                        createdTime: mkTimeNow,
                        emailVerified:true
                    };

                  

                
                    const createdUser = await UsersModel.create(newUser);
                    const token = jwt.sign({userId: createdUser._id}, jwtSecret);
                        
                    return res.json({status:'success', token:{userId:createdUser._id, token}, message:'Google Sign Up Success!'});
                
                }

            }else{
                return res.json({ status: 'error', message: 'Not authorized' });
            }
           


        }else{

            const {identifier, identifierType, password} = req.body;

         
        
            const existingUser = await UsersModel.findOne(
                
                identifierType === 'phone'
                    ? {phone:identifier}
                    : {email:identifier}, 
                {_id:1, password:1}
            );
       

            if (!existingUser) return res.json({status: 'error', message: "Invalid Log In Credentials"});

            const passwordCorrect = await bcrypt.compare(password, existingUser?.password);

            if (!passwordCorrect) return res.json({status: 'error', message: "Invalid Log In Credentials"});

            //console.log(loggedUser);
            const token = jwt.sign({userId: existingUser._id}, jwtSecret);
           
            
            return res.json({status:'success', token:{userId:existingUser._id, token}, message:'Log In Success!'});
        }

    } catch (error){
        console.log(error.message);
        return res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
    
    }
}


exports.verifyRegisterLinkCtrl = async (req, res) => {
    try {
        const { token } = req.body;

      
        // Step 1: Verify the JWT token
        jwt.verify(token, jwtOtpSecret, async (err, decodedData) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.json({ status: 'error', message: 'Token expired' });
                } else {
                    return res.json({ status: 'error', message: 'Invalid token' });
                }
            }

            const { otpNumber, userId, identifierType } = decodedData; // Extract necessary data from decoded token
         
            // Step 2: Fetch user by userId
            const existingUser = await UsersModel.findById(userId, { _id: 1, authOtp: 1 });
       

            if (!existingUser) {
                return res.json({ status: 'error', message: 'User not found' });
            }

            // Step 3: Compare the decoded OTP with user's stored OTP
            if (!otpNumber?.length > 0 || otpNumber !== existingUser.authOtp) {
                return res.json({ status: 'error', message: 'Invalid OTP' });
            }

            // Step 4: Update user and clear OTP after successful verification
            await UsersModel.findByIdAndUpdate(userId, { authOtp: null, [identifierType === 'phone' ? 'phoneVerified' : 'emailVerified']: true });


            // Step 5: Generate a new token for further use
            const newToken = jwt.sign({ userId: existingUser._id }, jwtSecret);

            // Step 6: Send success response
            return res.json({status:'success', token:{userId:existingUser._id, token:newToken}, message:'Verification Success!'});
        });

    } catch (error) {
        return res.json({ status: 'error', message: 'Verification failed' });
    }
};


exports.requestChangePasswordCtrl = async (req,res) => {

        try{ 
    
            const {identifierType, identifier, newPassword} = req.body;

           

            if( /^\S+$/.test(newPassword) === false || newPassword?.length < 5 || newPassword?.length > 26) return res.json({status: 'error', message:"Invalid Password Format"});

            const query = identifierType === 'phone' ? { phone: identifier } : { email: identifier };

            const existingUser = await UsersModel.findOne(query, { _id: 1, authOtp: 1, username:1, password:1 });
           
            if(!existingUser) return res.json({status:'error', message:"User Account Doesnt Exist"})
            const passwordCorrect = await bcrypt.compare(newPassword, existingUser?.password);

            if(passwordCorrect) return res.json({status: 'error', message:"New password is same as the old one"});
            const otp = await generateOtp(5);
            //send Otp Message

            const otpToken = jwt.sign({otpNumber: otp, newPassword, userId:existingUser?._id, identifierType}, jwtOtpSecret, {expiresIn: "24h"});

            if(identifierType === 'email'){

            

                const subject = "Change Your Password";
                const path = "verify-password";
                await mailVerificationLink (identifier, subject, path, otpToken, existingUser?.username);
                    
            } 
            else if (identifierType === 'phone') {
              
                const urlPath = `verify-password/${otpToken}`
                await sendSms(urlPath, identifier);
            }
            console.log("success mail sent");

            await UsersModel.findByIdAndUpdate(existingUser?._id, {authOtp:otp});
          
            return res.json({status:'success', message:`A verification link has been sent to ${identifier}!`});
            
    
        } catch (error){
    
            return res.json({message: 'Internal Server Error. Please Try Later'});
        
        }
    }

    
exports.verifyPassChangeCtrl = async (req, res) => {
    try {
        const { token } = req.body;

        console.log(token)

        // Step 1: Verify the JWT token
        jwt.verify(token, jwtOtpSecret, async (err, decodedData) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.json({ status: 'error', message: 'Token expired' });
                } else {
                    return res.json({ status: 'error', message: 'Invalid token' });
                }
            }

            const { otpNumber, userId, identifierType, newPassword } = decodedData; // Extract necessary data from decoded token
            console.log(decodedData);
            // Step 2: Fetch user by userId
            const existingUser = await UsersModel.findById(userId, { _id: 1, authOtp: 1 });
            console.log(existingUser);

            if (!existingUser) {
                return res.json({ status: 'error', message: 'User not found' });
            }

            // Step 3: Compare the decoded OTP with user's stored OTP
            if (!otpNumber?.length > 0 || otpNumber !== existingUser.authOtp) {
                return res.json({ status: 'error', message: 'Invalid OTP' });
            }

            // Step 4: Update user and clear OTP after successful verification
            const hashedPassword = await bcrypt.hash (newPassword, 12);
            const updatedUser = await UsersModel.findByIdAndUpdate(userId, { authOtp: null, password:hashedPassword, [identifierType === 'phone' ? 'phoneVerified' : 'emailVerified']: true });
            console.log(newPassword);
            console.log(updatedUser);

            // Step 5: Generate a new token for further use
            const newToken = jwt.sign({ userId: updatedUser._id }, jwtSecret);

            // Step 6: Send success response
            return res.json({status:'success', token:{userId:existingUser._id, token:newToken}, message:'Password Change Successful!'});
        });

    } catch (error) {
        return res.json({ status: 'error', message: 'Password Change Failed' });
    }
};

exports.requestDeleteCtrl = async (req,res) => {

    try{ 


        
        const otp = await generateOtp(5);
        const userId = req.userId;
        const {identifierType} = req.body;
        //send Otp Message


        

        const existingUser = await UsersModel.findById(userId, { phone:1, email: 1, authOtp: 1, username:1, password:1 });
        
        if (!existingUser) {
            return res.json({ status: 'error', message: 'User not found' });
        }

        const otpToken = jwt.sign({otpNumber:otp, userId:userId, identifierType}, jwtOtpSecret, {expiresIn: "24h"});

        if(identifierType === 'email'){

            //console.log(identifierType);

            const subject = "Delete Account";
            const path = "delete-account";
            await mailVerificationLink (existingUser?.email, subject, path, otpToken, existingUser?.username);
                
        } 
        else if (identifierType === 'phone') {
         
            const urlPath = `delete-account/${otpToken}`
            await sendSms(urlPath, existingUser?.phone);
        }
   

        await UsersModel.findByIdAndUpdate(existingUser?._id, {authOtp:otp});

        const identifier = identifierType === 'phone' ? existingUser?.phone : existingUser?.email;
        
        return res.json({status:'success', message:`A verification link has been sent to ${identifier}!`});
        

    } catch (error){

        return res.json({message: 'Internal Server Error. Please Try Later'});
    
    }
}

exports.verifyDeleteCtrl = async (req, res) => {
    try {
        const { token } = req.body;

    

        // Step 1: Verify the JWT token
        jwt.verify(token, jwtOtpSecret, async (err, decodedData) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.json({ status: 'error', message: 'Token expired' });
                } else {
                    return res.json({ status: 'error', message: 'Invalid token' });
                }
            }

            const { otpNumber, userId, identifierType} = decodedData; // Extract necessary data from decoded token
      
            // Step 2: Fetch user by userId
            const existingUser = await UsersModel.findById(userId, { _id: 1, authOtp: 1 });
       

            if (!existingUser) {
                return res.json({ status: 'error', message: 'User not found' });
            }

            // Step 3: Compare the decoded OTP with user's stored OTP
            if (!otpNumber?.length > 0 || otpNumber !== existingUser.authOtp) {
                return res.json({ status: 'error', message: 'Invalid OTP' });
            }

            await UsersModel.findByIdAndDelete(userId); 
            await PostsModel.deleteMany({ creatorMiniProfile: userId });
            await ChatsModel.deleteMany({ participants: userId });
            await CommentsModel.deleteMany({ creatorMiniProfile:  userId });

            // Step 6: Send success response
            return res.json({status:'success', message:'Account Deleted Succesfully!'});
        });

    } catch (error) {
        return res.json({ status: 'error', message: 'Password Change Failed' });
    }
};





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