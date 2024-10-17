const {UsersModel} = require('../models/usersModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {jwtDecode} = require ('jwt-decode');
const {generateOtp, generateRandomString, generateUsernameFromEmail} = require('../functions/index.js')
const { mailVerificationLink } = require('./emailsController.js')
const {OAuth2Client} = require('google-auth-library');
const { promisify } = require('util');


require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const jwtOtpSecret = process.env.JWT_OTP_SECRET;
const googleClientId = '713960857676-8funqpldk4d6cobt0f467giarc1u16tu.apps.googleusercontent.com'
const googleClient = new OAuth2Client(googleClientId);
const verifyJwt = promisify(jwt.verify);

exports.registerCtrl = async (req,res) => { 
    

    try {

        const {identifierType} = req.body;

        if (identifierType === 'gmail'){

            const googleData = jwtDecode(req.body.googleCredential);      

            const googleTicket = await googleClient.verifyIdToken({
                idToken:req.body.googleCredential,
                audience: googleClientId   // Specify the CLIENT_ID of the app that accesses the backend
            });

            const payload = googleTicket.getPayload();
            const {aud,exp,iss, email} = googleData;

      
            console.log(payload);

            if (aud === payload.aud && exp === payload.exp && iss === payload.iss && email === payload.email){
                
                const existingUser = await UsersModel.findOne({ email: email, emailVerified: true } , {_id:1});
                console.log(existingUser);
                if(existingUser){

                    const token = jwt.sign({userId: existingUser._id}, jwtSecret);                       
                    res.json({status:'success', token:{userId:existingUser._id, token}, message:'Google Sign In Success!'});

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

                    console.log(newUser);

                
                    const createdUser = await UsersModel.create(newUser);
                    const token = jwt.sign({userId: createdUser._id}, jwtSecret);
                        
                    res.json({status:'success', token:{userId:createdUser._id, token}, message:'Google Sign Up Success!'});
                
                }

            }else{
                return res.json({ status: 'error', message: 'Not authorized' });
            }
           


        }else{

            const {identifier, username, password, countryCode, dialCode} = req.body;
            // console.log(req.body);
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
            console.log(existingUser);
            
            const existingUsername = await UsersModel.findOne({username:username})

            if(existingUser) return res.json({status: 'error', message: `${identifierType} already in use`});
            if(existingUsername?._id?.length>0) return res.json({status: 'error', message: `username already in use`});
            if( /^\S+$/.test(password) === false || password?.length < 5 || password?.length > 26)  res.json({status: 'error', message:"Invalid Password Format"});
            
            const hashedPassword = await bcrypt.hash (password, 12);  

            const otp = await generateOtp(5)
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
          

            const otpToken = jwt.sign({otpNumber: otp, userId:createdUser?._id, identifierType}, jwtOtpSecret, {expiresIn: "24h"});

            if(identifierType === 'email' || identifierType === 'phone' ){

                console.log(`http://localhost:5173/verify/${otpToken}`);

                await mailVerificationLink (identifier, otpToken, username);
                    
            } 
            //else if (identifierType === 'phone') {
            //         //send link to number
            // }
            const token = jwt.sign({userId: createdUser._id}, jwtSecret);
            console.log(token);
            console.log('reg')
            
            res.json({status:'success', token:{userId:createdUser._id, token}, message:'Sign Up Success!'});
        }
        
    } catch (error) { 

    console.log(error);
    res.json({status:'error', message: 'Internal Server Error. Please Try Later'}); 

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

      
            console.log(payload);

            if (aud === payload.aud && exp === payload.exp && iss === payload.iss && email === payload.email){
                
                const existingUser = await UsersModel.findOne({ email: email, emailVerified: true } , {_id:1});
                console.log(existingUser);
                if(existingUser){

                    const token = jwt.sign({userId: existingUser._id}, jwtSecret);                       
                    res.json({status:'success', token:{userId:existingUser._id, token}, message:'Google Sign In Success!'});

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

                    console.log(newUser);

                
                    const createdUser = await UsersModel.create(newUser);
                    const token = jwt.sign({userId: createdUser._id}, jwtSecret);
                        
                    res.json({status:'success', token:{userId:createdUser._id, token}, message:'Google Sign Up Success!'});
                
                }

            }else{
                return res.json({ status: 'error', message: 'Not authorized' });
            }
           


        }else{

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
        }

    } catch (error){
        console.log(error.message);
        res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
    
    }
}


exports.verifyRegisterLinkCtrl = async (req, res) => {
    try {
        const { token } = req.body;

        console.log(token)

        // Step 1: Verify the JWT token
        jwt.verify(token, jwtSecret, async (err, decodedData) => {
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
            res.json({status:'success', token:{userId:existingUser._id, token:newToken}, message:'Verification Success!'});
        });

    } catch (error) {
        res.json({ status: 'error', message: 'Verification failed' });
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