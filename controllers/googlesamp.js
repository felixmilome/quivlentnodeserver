const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwt_decode = require ('jwt-decode');
const {OAuth2Client} = require('google-auth-library');
// const {
//   ref,
//   uploadBytes,
//   listAll,
//   deleteObject,
// } = require("firebase/storage");
// const storage = require("../firebase/config.js");
//const { uuid } = require('uuidv4');
//const { v4 as uuid_v4 } = require("uuid");
//const { v4: uuidv4 } = require('uuid'); 

//const {createUserWithEmailAndPassword, sendEmailVerification, sendSignInLinkToEmail, sendPasswordResetEmail} = require("firebase/auth");
// console  change verify
const {sendVerifyEmail, sendSecurityEmail, sendWarningEmail, sendDeleteAccountEmail} = require('./emailControllers.js')


const {UsersModel} = require('../models/usersModel.js');
const {DiariesModel} = require('../models/diariesModel.js');
const {StoriesModel} = require('../models/storiesModel.js');
const {ConvosModel} = require('../models/convosModel.js');
const {TipsModel} = require('../models/tipsModel.js');
const {MessagesModel} = require('../models/messagesModel.js');
const {ReviewsModel} = require('../models/reviewsModel.js');
const {NotificationsModel} = require('../models/notificationsModel.js');


//Search Area: follow getUsers miniProfile dpUrl create register password


const dotenv = require('dotenv');
const { uploadImage, deleteImage } = require('./controllerHandlers');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;






//const filterItemOut = (key, { [key]: deletedKey, ...others }) => others;



function getCodec() {
   // return Math.floor(Math.random() * 969696);
    return Math.floor(Math.random()*1e9).toString(32);
   };

  
const codeMatcher = async(tokenString, bcryptString)=> {

  try{

    const decodedData = jwt.verify(tokenString, JWT_SECRET);
    const otp = decodedData?.otp;
    const value = await bcrypt.compare(otp,bcryptString);
    return value;
  }catch(error){

    console.log(error?.message);
    return false;

  }

  
  };


  // CONTROLLERS==================================

  exports.deleteAccount = async (req,res) => {

   
 
  
      try{ 

        const id = req.userId;
        const {password} = req.body;
    
        //console.log(id);
        //console.log(password);

        const thisUser = await UsersModel.findById(id, {_id:1, password:1});
        const passwordSame = await bcrypt.compare(password, thisUser.password);
        
        //console.log(thisUser);
         //console.log(passwordSame);

        if(!passwordSame) {

          res.json({message:'WrongPassword'});

        }else if(passwordSame && thisUser){

          const uniqueStr = getCodec ();      
          const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);
          const hashedPassword = await bcrypt.hash (password, 12);
          const editedUser = await UsersModel.findByIdAndUpdate(thisUser._id, {$set:{ "profileVerified": false, "verCode":uniqueStrEncrypted, "verTime":Date.now(), "verExpiry":Date.now() + 172800000 }}, { new: true });
            
           
          await sendDeleteAccountEmail (editedUser.email, uniqueStr, editedUser.userName, editedUser._id);  
           res.json({message:'Success'});

        }else { 
          res.json({message:'error'});
        }
          
    
      } catch (error){
          res.json({message: 'error'});
      }
  }

  exports.sendOtp = async (req,res) => {
   
  
      try{ 

        const id = req.userId;
        //console.log('userId :' + id);
      
          const user = await UsersModel.findById(id, {email:1, userName:1});
          //console.log(user);
          const {email} = user;
          const userName = user.userName.toLowerCase();
  
            const uniqueStr = getCodec ();
            
            //console.log(uniqueStr);
        
            const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);
          
    
            const otpPatchedUser = await UsersModel.findByIdAndUpdate(id, {$set: {verCode: uniqueStrEncrypted}}, { new: true });
            //console.log(otpPatchedUser);
            const emailSent = sendVerifyEmail (email,uniqueStr, userName);
            //console.log(emailSent);

            if(emailSent){
              res.json({message:"sent"});
            }else {
              res.json({message:"error"});
            }
          
         
          
    
      } catch (error){
          res.json({message: 'error'});
      }
  }

  exports.getUsers = async (req,res) => {

      try{ 

        //console.log(req.body);
        //console.log('getUsers')
        const {type} = req.body;
        //console.log(type);

        if(type === 'ChatHunt'){

          const {filterData} = req.body;
          if (filterData === false){ 
            const users = await UsersModel.find({},{_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1}).limit(40);
            //console.log(users);
            res.json({users: users, message:'ChatHunt'});
          } else if (filterData === true){
           
            const {city,country,gender,interest} = req.body;
            // const users = await UsersModel.find({ $and: [ (city?.length> 0 && {city:{$regex: city, $options:'i'}}), (country?.length> 0 && {country:{$regex: country, $options:'i'}}), (gender?.length> 0 && {gender:{$regex: gender, $options:'i'}}),(interest?.length> 0 && {interest:{$regex: interest, $options:'i'}})] },
            const users = await UsersModel.find({ $and: [ 

              {city: (city?.length> 0 ? {$regex: city, $options:'i'} : {$exists: true })},
              {country: (country?.length> 0 ? {$regex: country, $options:'i'} : {$exists: true })},
              {gender: (gender?.length> 0 ? {$regex: gender, $options:'i'} : {$exists: true })},
              {interest: (interest?.length> 0 ? {$regex: interest, $options:'i'} : {$exists: true })},
              {_id:{$ne:req.userId}},

              ] }, {_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1}).limit(40);
            //console.log(users);

            if (users?.length>0){
            res.json({users: users, message:'ChatHunt'});
            }
             else {
               //console.log('no users')
              res.json ({users: 0, message:'ChatHunt'})
            }



          }

        }else if(type === 'Following'){
 
          const profileName = req.body.profileName.toLowerCase();
          const {pageInt} = req.body;
          //console.log({profileName});
 
          const user = await UsersModel.findOne({userName: { $in: [ profileName ] } }, {follows:1})

        //  const user = (await UsersModel.aggregate([{
        //       $search: {
        //         index: "userName",
        //         text: {
        //           query: profileName,
        //           path: "userName"
        //         },
        //       },
        //     },
        //     {
        //       $project: {
        //         follows:1
        //       }
        //     }
        //   ]))[0]
          // .populate('follows', '_id dpUrl userName blockers blocked convoTip'); //use findOne and not Find so as to avoid array
          const followingIdArray = user.follows;
          //console.log(user.follows)
          if (pageInt === 0) {
            const slicedIdArray = followingIdArray.slice(0,9);

            //console.log(slicedIdArray);

            const followers = slicedIdArray?.length > 0 ? 
              await UsersModel.find({_id:{$in:slicedIdArray}}, {_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1})
              :
               [];
               //console.log(followers);
               res.json({users:followers, message:'Following'});
          
          } else if (pageInt >0){
            const slicedIdArray = followingIdArray.slice((pageInt)*10, ((pageInt+1)*10)-1);
            //console.log(slicedIdArray);

            const followers = slicedIdArray?.length > 0 ? 
              await UsersModel.find({_id:{$in:slicedIdArray}}, {_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1})
              :
               [];
               //console.log(followers);
               res.json({users:followers, message:'Following'});
          }
          //console.log(user);
          //console.log(following);

        

        }else if(type === 'Followers'){

          const profileName = req.body.profileName.toLowerCase();
          const {pageInt} = req.body;
 
          const user = await UsersModel.findOne({userName: { $in: [ profileName ] } }, {followers:1})

        //   const user = (await UsersModel.aggregate([{
        //     $search: {
        //       index: "userName",
        //       text: {
        //         query: profileName,
        //         path: "userName"
        //       },
        //     },
        //   },
        //   {
        //     $project: {
        //       followers:1
        //     }
        //   }
        // ]))[0];
         
          const followingIdArray = user.followers;

          if (pageInt === 0) {
            const slicedIdArray = followingIdArray.slice(0,9);

            //console.log(slicedIdArray);

            const followers = slicedIdArray?.length > 0 ? 
              await UsersModel.find({_id:{$in:slicedIdArray}}, {_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1})
              :
               [];
               //console.log(followers);
               res.json({users:followers, message:'Followers'});
          
          } else if (pageInt >0){
            const slicedIdArray = followingIdArray.slice((pageInt)*10, ((pageInt+1)*10)-1);
            //console.log(slicedIdArray);

            const followers = slicedIdArray?.length > 0 ? 
              await UsersModel.find({_id:{$in:slicedIdArray}}, {_id:1, dpUrl:1, userName:1, blockers:1, blocked:1, convoTip:1})
              :
               [];
               //console.log(followers);
               
               res.json({users:followers, message:'Followers'});
          }
    

        }
      
      } catch (error){
          res.status(404).json({message: 'Something went wrong'});
          console.log(error.message)
      }
 
  }
  exports.getUserProfile = async (req,res) => {

  
      try{ 
        //console.log(req.userId);
      
          const user = await UsersModel.findById(req.userId, {_id:1, dailyLogin:1, verified:1, suspensionEndDate:1, activityPointsTotal:1, suspendedReason:1, follows:1, postSpam:1, lastStoryExpiry:1});
          //console.log(user);
          res.json (user); 
          
    
      } catch (error){
          res.status(500).json({message: 'Something went wrong'});
      }

  }
 

  exports.checkEmail = async (req,res) => {
    const {email} = req.params;
    //console.log(email);
    if(email){
      try{ 
      
          const existingEmail = await UsersModel.findOne({email: {$in:email} }, {_id:0, verExpiry:0, verified:0});
          //user.verExpiry > Date.now () && user.profileVerified == false
        //   const existingEmail = (await UsersModel.aggregate([{
        //     $search: {
        //       index: "email",
        //       text: {
        //         query: email,
        //         path: "email"
        //       },
        //     },
        //   },
        //   {
        //     $project: {
        //       _id:1, verExpiry:1, verified:1
        //     }
        //   }
        // ]))[0];
          
          
          if (existingEmail){
            if( Date.now() > existingEmail.verExpiry  && existingEmail.verified === false){
              
              await UsersModel.findByIdAndRemove(existingEmail._id); 
              res.json("noEmail");
            }else{
              res.json("emailExists");
            }
           

          }
          else if(!existingEmail){
            //console.log('good');
            res.json("noEmail");

          }
          
    
      } catch (error){
          res.status(500).json({message: 'Something went wrong'});
      }
   }else{
     //console.log('empty');
   }
  }
  
   exports.checkUsername = async (req,res) => {

      try{ 

        const username = req.params.username.toLowerCase();
        //console.log(req.body);
      
         const existingUsername = await UsersModel.findOne({userName: { $in: [ username ] } }, {_id:1, verified:1, verExpiry:1}); 
          
      //    const existingUsername = (await UsersModel.aggregate([{
      //     $search: {
      //       index: "userName",
      //       text: {
      //         query: username,
      //         path: "userName"
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id:1, verExpiry:1, verified:1
      //     }
      //   }
      // ]))[0]; //its 0 for array 
         
         if (existingUsername){

            if ( Date.now() > existingUsername.verExpiry  && existingUsername.verified === false){
             
              await UsersModel.findByIdAndRemove(existingUsername._id);
              res.json("noUsername");

            } else {
              res.json("usernameExists");
            }
            
            
          }
          else if(!existingUsername){
            res.json("noUsername");
          }
          
    
      } catch (error){
          res.status(500).json({message: 'Something went wrong'});
      }

  }

exports.editProfile = async (req,res) => {
 

    try{ 
      const {type} = req.body;
      if (type === 'profile'){
            //console.log(req.body);
            const {bio, convoTip} = req.body;
            const userName = req.body.userName.toLowerCase();
            const thisUser = await UsersModel.findById(req.userId, {userName:1});
            const existingUser = await UsersModel.findOne ({userName: { $in: [ userName ] } }, {id:1});

          //   const existingUser = (await UsersModel.aggregate([{
          //     $search: {
          //       index: "userName",
          //       text: {
          //         query: userName,
          //         path: "userName"
          //       },
          //     },
          //   },
          //   {
          //     $project: {
          //       _id:1,
          //     }
          //   }
          // ]))[0]; //0 for array remove
            
            if(existingUser && thisUser.userName !== userName){

              return res.json({message:"UsernameTaken"});

            }else if ((!existingUser || (existingUser && thisUser.userName === userName))
              && userName.length > 1 && userName.length < 31 && /^\d*[a-zA-Z][a-zA-Z\d]*$/.test(userName) == true
              && bio.length > 0 && bio.length < 100
              && convoTip >=0 && convoTip <151)
            {
            const editedUser_Detailed = await UsersModel.findByIdAndUpdate(req.userId, {$set:{"userName":userName, "bio":bio, "convoTip":convoTip}}, { new: true });

            const editedUser = await UsersModel.findById(editedUser_Detailed._id, {password:0, lastStoryViewers:0, verCode:0, deposits:0, withdrawals:0, purchaseTokenReceipts:0, activityPointsRecord:0});
          
            const token = jwt.sign({email: editedUser.email, id: editedUser._id}, JWT_SECRET, {expiresIn: editedUser.jwtExpiry});
              res.status(200).json({result:editedUser, token, message:'editedProfile'}); // check jwt
              //console.log('editedProfile');
            }else{
              return res.json({message:"error"})
            }
    } else if (type === 'more'){ //in frontend set allInterests in state from [] to .interests
          //console.log(req.body);
          const {city, country, gender, age, interests} = req.body;
          if ((!city?.length || city.length < 31)
           &&(!country?.length || country.length < 31)
           &&(!gender?.length || gender.length < 31) 
           && (!age || (age > 16 && age < 121))
            && (!interests?.length  || interests?.length < 11)){

              //console.log(req.body);

            const editedUser_Detailed = await UsersModel.findByIdAndUpdate(req.userId, {$set:{"city":city.trim(), "country":country.trim(), "gender":gender.trim(), "age":age, "interests":interests}}, { new: true });
            const editedUser = await UsersModel.findById(editedUser_Detailed._id, {password:0, lastStoryViewers:0, verCode:0, deposits:0, withdrawals:0, purchaseTokenReceipts:0, activityPointsRecord:0});
            const token = jwt.sign({email: editedUser.email, id: editedUser._id}, JWT_SECRET, {expiresIn: editedUser.jwtExpiry});
              res.status(200).json({result:editedUser, token, message:'editedProfile'}); // check jwt
              //console.log('editedProfile');
          }else {
            return res.json({message:"error"});
          }
    
        }
    } catch (error){
      //console.log(error.message);
      return res.json({message:"error"});
    }

  }

  exports.editSecurity = async (req,res) => {


    try{

      const {email, password, currentPassword} = req.body;
      //console.log(req.body);
      const remail = email;
  
      const thisUser = await UsersModel.findById (req.userId, {email:1, userName:1, password:1});
      const existingEmail = await UsersModel.findOne ({email: { $in:email} }, {_id:1});

      const passwordCorrect = await bcrypt.compare(currentPassword, thisUser.password);
   
        const passwordSame = await bcrypt.compare(password, thisUser.password);

        // console.log({thisUser})
        // console.log({existingEmail})
        // console.log({passwordCorrect})
        // console.log({passwordSame})

    


      if(!passwordCorrect){
        return res.json({message:"WrongPassword"});
      }

      if(existingEmail && remail !== thisUser.email && passwordCorrect){ //Prevent taking anothers email
        return res.json({message:"EmailTaken"});
      }
      
      if(password.length > 0 
        && passwordSame
        && passwordCorrect
        ){
        return res.json({message:"PasswordSame"});
      }
      //If password Present
    if ((!existingEmail || (existingEmail && remail === thisUser.email)) 
        && email.length > 4 && email.length < 41 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) == true
        && password.length > 7 && password.length < 26 && /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/.test(password) == true
          && !passwordSame
          && passwordCorrect){

          const uniqueStr = getCodec ();  
          const uniqueStrToken = jwt.sign({otp:uniqueStr}, JWT_SECRET, {expiresIn: Date.now() + 172800000 });    
          //console.log(uniqueStr);
          const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);
          const hashedPassword = await bcrypt.hash (password, 12);
          const editedUser_Detailed = await UsersModel.findByIdAndUpdate(req.userId, {$set:{"tempEmail":email, "tempPassword":hashedPassword, "profileVerified": false, "verCode":uniqueStrEncrypted, "verTime":Date.now(), "verExpiry":Date.now() + 172800000 }}, { new: true });
          
          if (editedUser_Detailed.email === remail){ //if same emails PASS EDIT
             
            const change = 'Password'
            sendSecurityEmail (remail,uniqueStrToken, editedUser_Detailed.userName, editedUser_Detailed._id, change);  
            return res.json({message:"PasswordEdited", remail:remail});
         
         
          } else if (editedUser_Detailed.email !==remail){ //if a different email and added pass EMAIL AND PASS
            
            const change = 'Email and Password'
            const warning ='Email and Password Changed!'
            sendWarningEmail (thisUser?.email, warning, thisUser?.userName,
               `You Changed Your Email to ${remail} and also Changed Password.
                 Report Immediately to security@zoorura.com if it was not you,
                 or if it was a mistake`);
            sendSecurityEmail (remail,uniqueStrToken, editedUser_Detailed.userName, editedUser_Detailed._id, change);  
            return res.json({message:"EmailPasswordEdited", remail:remail});
          }
          
         //If changepassword empty  EMAIL EDIT     
      } else if (!existingEmail && email.length > 4 && email.length < 41 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) == true
               && password.length === 0){ 
        
              const uniqueStr = getCodec (); 
              const uniqueStrToken = jwt.sign({otp:uniqueStr}, JWT_SECRET, {expiresIn: Date.now() + 172800000 });       
              //console.log(uniqueStr);
              
             const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);
              const editedUser_Detailed = await UsersModel.findByIdAndUpdate(req.userId, {$set:{"tempEmail":email, "verCode":uniqueStrEncrypted, "profileVerified": false, "verTime":Date.now(), "verExpiry":Date.now() + 172800000 }}, { new: true });
              const change = 'Email'
              const warning ='Email Changed!'
              sendWarningEmail (thisUser?.email, warning, thisUser?.userName,
                `You Changed Your Email to ${remail}
                  Report Immediately to security@zoorura.com if it was not you,
                  or if it was a mistake`);
              
              
              sendSecurityEmail (remail,uniqueStrToken, editedUser_Detailed.userName, editedUser_Detailed._id, change); 
              //add verified true after clicking  change link.
              
              return res.json({message:"EmailEdited", remail:remail});

      } else {
        //console.log(error.message);
        return res.json({message:"error"});
      }  


      
  
    } catch (error){
      return res.json({message:"error"});
    }

  }


  exports.forgotPassword = async (req,res) => {

      try{
          const {email, password} = req.body;
          const remail = email;

          
          const thisUser = await UsersModel.findOne ({email: { $in: [ email ] } }, {password:1});

      
        
            if(!thisUser){

              return res.json({message:"NoEmail"});
              
            }
            else if(thisUser){

                const passwordSame = await bcrypt.compare(password, thisUser.password);

                if(thisUser &&  passwordSame){
                  return res.json({message:"PasswordSame"});
                }else if (thisUser && !passwordSame  //no need to validate email if its in db
                  && password.length > 7 && password.length < 26 && /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/.test(password) == true
                  ){

                    const uniqueStr = getCodec ();  
                    const uniqueStrToken = jwt.sign({otp:uniqueStr}, JWT_SECRET, {expiresIn: Date.now() + 172800000 });     
                    const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);

                    const hashedPassword = await bcrypt.hash (password, 12);
                    const editedUser = await UsersModel.findByIdAndUpdate(thisUser._id, {$set:{"tempEmail":email, "tempPassword":hashedPassword, "profileVerified": false, "verCode":uniqueStrEncrypted, "verTime":Date.now(), "verExpiry":Date.now() + 172800000 }}, { new: true });
                      
                      const change = 'Password'
                      sendSecurityEmail (remail,uniqueStrToken, editedUser.userName, editedUser._id, change);  
                      return res.json({message:"Success", remail:remail});
              
                } else {
                  //console.log(error.message);
                  return res.json({message:"error"});
                } 

          }   
    
      } catch (error){

        return res.json({message:"error"});
        
      }

  }


exports.login = async (req,res) => {

 
 try{ 

      const {password} = req.body;
      const email = req.body.email.trim().toLowerCase();
      //const email = req.body.email.toLowerCase();
      const autologout = '2d'; 
      //console.log(req.body);
  
     const existingEmail = await UsersModel.findOne({email: { $in: [ email ] } }, {_id:1, verExpiry:1, verified:1, password:1});
     
  //    const existingEmail =  (await UsersModel.aggregate([{
  //     $search: {
  //       index: "email",
  //       text: {
  //         query: email,
  //         path: "email"
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id:1, verExpiry:1, verified:1, password:1
  //     }
  //   }
  // ]))[0]; //zero for first value in array.
     //console.log({existingEmail});

    

      if (!existingEmail){
     
            //console.log('wrong Email');

            res.json({message:"LoginError"});

      } else if(existingEmail) {
      

            if (Date.now() > existingEmail.verExpiry  && existingEmail.verified === false){ //check if expired
                
              await UsersModel.findByIdAndDelete (existingEmail._id);
              res.json({message:"LoginError"});

            }
            else {

                const passwordCorrect = await bcrypt.compare(password, existingEmail?.password);

                if (!passwordCorrect){ //check password
    
                  //console.log('wrong Pass');
    
                  res.json({message:"LoginError"});
    
                } else if (passwordCorrect){
    
                  const loggedUser_Detailed = await UsersModel.findByIdAndUpdate(existingEmail._id, {jwtExpiry: autologout}, { new: true });
                  const loggedUser = await UsersModel.findById(loggedUser_Detailed._id, {password:0, lastStoryViewers:0, verCode:0, deposits:0, withdrawals:0, purchaseTokenReceipts:0, activityPointsRecord:0});
                  //console.log(loggedUser);
                  const token = jwt.sign({email: loggedUser.email, id: loggedUser._id}, JWT_SECRET, {expiresIn: autologout});
              
                  res. status(200).json({result:loggedUser, token, message:'RegistrySuccess'});
                  
                }

            }

            

      }
     

 } catch (error){
    //console.log('unknown Error Login');
     res.json({message: 'UnknownError'});
     //console.log(error.message);
 }
}
exports.register = async (req,res) => { 
    

    try {

      const {password, confirmPassword, googleData} = req.body;
      const userName = req.body.userName.toLowerCase();
      const email = req.body.email.toLowerCase();



        const existingUser = await UsersModel.findOne ({userName: { $in: [ userName ] } }, {_id:1});
      //   const existingUser = (await UsersModel.aggregate([{
      //     $search: {
      //       index: "userName",
      //       text: {
      //         query: userName,
      //         path: "userName"
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id:1,
      //     }
      //   }
      // ]))[0]; //0 for array remove
       const existingEmail = await UsersModel.findOne ({email: { $in: [ email ] } }, {_id:1});

      //   const existingEmail = (await UsersModel.aggregate([{
      //     $search: {
      //       index: "email",
      //       text: {
      //         query: email,
      //         path: "email"
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id:1, 
      //     }
      //   }
      // ]))[0]; //0 for array remove


         if(existingUser && !existingEmail){
 
            return res.json({message:"UsernameTaken"});

          } else if (existingEmail && !existingUser) {

            return res.json({message:"EmailTaken"});

          }else if (existingEmail && existingUser) { 

            return res.json({message:"UsernameEmailTaken"});
  
          }else if(!existingEmail && !existingUser 
            // &la.length > 1 &la.length < 16 && /^[aA-zZ]+$/.tesla) == true
            // && lastName.length > 1 && lastName.length < 16 && /^[aA-zZ]+$/.test(lastName) == true
            && userName.length > 1 && userName.length < 31 && /^\d*[a-zA-Z][a-zA-Z\d]*$/.test(userName) == true
            && email.length > 2 && email.length < 41 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) == true
            && password.length > 7 && password.length < 26 && /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/.test(password) == true
            && confirmPassword === password   
            ){  
                  //console.log({googleData})
                  if(!googleData?.clientId?.length > 0 && !googleData?.credential?.length > 0 ){
                        const hashedPassword = await bcrypt.hash (password, 12);
                        const uniqueStr = getCodec ();
                       // console.log(uniqueStr);
                        const uniqueStrEncrypted = await bcrypt.hash (uniqueStr, 12);
                        
                        const resultX = await UsersModel.create({email, userName, password: hashedPassword, convoTip:5, wallet:[500], verCode: uniqueStrEncrypted, verTime: Date.now(), verExpiry: Date.now() + 172800000});
                        const result = await UsersModel.findById(resultX._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
                          
                        //console.log(result);
                        

                          if (result) {
                              const remail = result.email;
                              sendVerifyEmail (remail,uniqueStr, userName);    
                              const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: "12h"});
                              res.status(200).json({result, token, message:'RegistrySuccess'});
                          }
                  }else if(googleData?.clientId.length>0 && googleData?.credential.length > 0 ) {

                    // For expo set ClientId to response.id and credential to response.accessToken
                    const jwtDecodedGoogleData = jwt_decode(googleData.credential);
                    const gmail = jwtDecodedGoogleData.email;
                    const client = new OAuth2Client('210073924030-skglff2vort34f8a3pin1umcdtp8ckhg.apps.googleusercontent.com');

                          async function verifyGmailToken() {

                              try{
                                const ticket = await client.verifyIdToken({
                                    idToken: googleData.credential,
                                    audience: '210073924030-skglff2vort34f8a3pin1umcdtp8ckhg.apps.googleusercontent.com',  // Specify the CLIENT_ID of the app that accesses the backend
                                    // Or, if multiple clients access the backend:
                                    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
                                });
                                const payload = ticket.getPayload();
                                const userid = payload['sub'];
                                const {aud,exp,iss} = jwtDecodedGoogleData;

                                // console.log({userid});
                                // console.log({payload});

                                if (aud === payload.aud && exp === payload.exp && iss === payload.iss && gmail === payload.email){
                                  return true
                                }else{
                                  return false
                                }
                              } catch (error){
                                //console.log(error);
                                return false
                              }
                            // If request specified a G Suite domain:
                            // const domain = payload['hd'];
                          }
                         // verifyGmailToken().catch(console.error);

                    

                          const jwtVerified = await verifyGmailToken();
                          //console.log({jwtVerified});

                            if (jwtVerified===true && gmail.includes('@gmail.com')){ 

                              const hashedPassword = await bcrypt.hash (password, 12);
                              
                              const resultX = await UsersModel.create({email:gmail, userName, password: hashedPassword, convoTip:5, wallet:[500], verCode:'none', verTime: Date.now(), verExpiry: Date.now(), verified:true, dailyLogin: Date.now()});
                              const result = await UsersModel.findById(resultX._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1}); //to remove some data and send result 
                              const newDiary = await DiariesModel.create({creator:resultX._id, postType:'diary', diaryMiniProfile:resultX._id, publicity:'public', title:"Hello There!👋 ", caption:"I Have Joined Zoorura",dateRank: Date.now(), roughRank:parseInt(Date.now())/86400000, time: new Date().toISOString(), newComer:true }); 
                              // console.log({result});
                              // console.log({newDiary});
                              
      
                                if (result) { 
                              
                  
                                    const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: "12h"});
                                    res.status(200).json({result, token, message:'RegistrySuccess'});
                                }

                            }else {
                              res.json({message: 'UnknownError'});
                            }

                  }

            }else{
              return res.json({message:"InputError"});
            }

        

    } catch (error) { 
      res.json({message: 'UnknownError'}); 
      //console.log(error.message);
    }
  
}

exports.verify = async(req,res) => {

  try{
    const {otp, userId, type} = req.body
      
  
        if (type === 'delete'){ 
                
                
              try{
                  
                  //console.log(userId);
                  //console.log(req.body);
                  const user = await UsersModel.findById (userId, {_id:1,verCode:1,verExpiry:1,profileVerified:1});
                 
                  if (!user){
  
                          res.json({message: 'NoUser'});

                  }else{
                            //console.log(user);
                            const id = user._id;
                            const verCode = user?.verCode;
                          
                            const codeMatch = await codeMatcher(otp, verCode) //otp will be token
                            //console.log(codeMatch);
                            //console.log('delete')
                          if (codeMatch && user.verExpiry > Date.now () && user.profileVerified == false){
                                  try {
                                  
                                      await UsersModel.findByIdAndRemove(id);
                                      await DiariesModel.deleteMany({'creator': id});
                                      await ConvosModel.deleteMany({'host': id});
                                      await ConvosModel.deleteMany({'guest': id});
                                      await MessagesModel.deleteMany({'senderId': id}); 
                                      // await MessagesModel.deleteMany({'receiverId': id});
                                      await NotificationsModel.deleteMany({'sender': id});
                                      //await NotificationsModel.rdeleteMany({'receiver': id});
                                      await TipsModel.deleteMany({'tipperId': id});
                                      await ReviewsModel.deleteMany({'reviewerId': id});

                                      res.json({message:'DeleteSuccess'});
                                      //console.log('Delete Success');
                                      
                                    }
                                    catch(error){
                                        console.log(error.message);
                                    }

                            }  else if (!codeMatch && user.verExpiry > Date.now() && user.profileVerified == false){
                                  const updateUser = await UsersModel.findByIdAndUpdate(userId, {profileVerified:true});
                                     res.json({message: "OtpError"});
                            } else if (user.verExpiry < Date.now() && user.profileVerified == false){

                                //console.log ("expired");
                                const updateUser = await UsersModel.findByIdAndUpdate(userId, {profileVerified:true});
                                res.json({message: "RegisterOtpExpired"});

                            } else{
                              const updateUser = await UsersModel.findByIdAndUpdate(userId, {profileVerified:true});
                              res.json({message: "UnknownError"});
                            }             
                  }

              } catch(error){
                
                console.log(error.message);
                res.json({message: "UnknownError"});
                     
              }
          }else if (type === 'typed'){ 
                  const id = userId;
                  //console.log(id);
                
                  const user = await UsersModel.findById (id, {verCode:1,verExpiry:1,verified:1});
                  //console.log(user);
                  const verCode = user?.verCode;
                  const codeMatch = await bcrypt.compare(otp,user.verCode);
                  //console.log(codeMatch);

                  if (user.verified == true){
                    try {
      
                    
                    res.json({message: 'AlreadyVerified'});
                    
                    //console.log('already verified');
                    
                    }
                    catch(error){
                        console.log(error.message);
                    }
      
                  } else if (codeMatch && user.verExpiry > Date.now () && user.verified == false){
                      try {
                      const verifiedUser = await UsersModel.findByIdAndUpdate (id, {verified: true, dailyLogin: Date.now()}, { new: true });
                      
                      const newDiary = await DiariesModel.create({creator:id, postType:'diary', diaryMiniProfile:id, publicity:'public', title:"Hello There!👋 ", caption:"I Have Joined Zoorura",dateRank: Date.now(), roughRank:parseInt(Date.now())/86400000, time: new Date().toISOString(), newComer:true});
                      

                      const result = await UsersModel.findById(verifiedUser._id,{userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});

                      const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: "12h"});
                      res.status(200).json({result, token, message:'RegistrySuccess'});
                      //console.log (result);
                      //console.log('verified');
                      }
                      catch(error){
                          console.log(error.message);
                      }

                  }  else if (!codeMatch && user.verExpiry > Date.now() && user.verified == false){
                    res.json({message: "OtpError"});
                  }else if (user.verExpiry < Date.now() && user.verified == false){

                      //console.log ("expired");
                      await UsersModel.findByIdAndRemove(id);
                      res.json({message: "RegisterOtpExpired"});

                  }else{
                    res.json({message: "UnknownError"});
                  }
          }else if (type === 'linked'){ 
            
            const id = userId;
            //console.log(id);
          
            const user = await UsersModel.findById (id, {verCode:1, tempEmail:1, tempPassword:1, verExpiry:1, profileVerified:1});
            //console.log({user})
            const verCode = user?.verCode;
            //const codeMatch = await bcrypt.compare(otp,user.verCode);
            const codeMatch = await codeMatcher(otp, verCode)
            //console.log({codeMatch});
            
            if (user.profileVerified == true){
              try {

              
              res.json({message: 'AlreadyVerified'});
              
              //console.log('linked already verified');
              
              }
              catch(error){
                  console.log(error.message);
              }

            } else if (codeMatch && user.verExpiry > Date.now() && user.profileVerified == false){
                try {

                const verifiedUser = await UsersModel.findByIdAndUpdate (id, {profileVerified:true, verified:true, password: user.tempPassword, email: user.tempEmail}, { new: true });
                const result = await UsersModel.findById(verifiedUser._id,{userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
                const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: "12h"});
                res.status(200).json({result, token, message:'SecuritySuccess'});
                //console.log (result);
                //console.log('verified');

                }
                catch(error){
                    console.log(error.message);
                }

            }  else if (!codeMatch && user.verExpiry > Date.now() && user.profileVerified == false){

              res.json({message: "OtpError"});

            }else if (codeMatch && user.verExpiry < Date.now () && user.profileVerified == false){

                //console.log ("expired");
                await UsersModel.findByIdAndRemove(id);
                res.json({message: "ChangeOtpExpired"});

            }else{
              res.json({message: "UnknownError"});
            }
        }else{
          res.json({message: "UnknownError"});
        }
      }catch(error){
        console.log(error.message);
        res.json({message: "UnknownError"});
      }
}
 
 
exports.changeDp = async(req,res) => {
 

      try{
        console.log(req?.file);
        const id = req.userId;

        // console.log(req.userId);
        // console.log(req.body);
        const userDpRef = await UsersModel.findById(req.userId, {dpRef:1});

        if(req?.body?.dp === 'avatar'){

          

          const deleteRes = await deleteImage(userDpRef.dpRef)
          //console.log(deleteRes)

            if(deleteRes ==='avatar'){

              const updated_User_Profile = await UsersModel.findByIdAndUpdate (id, {dpUrl: 'avatar', dpRef:null}, { new: true });   
              const result = await UsersModel.findById(updated_User_Profile._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
              const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: result.jwtExpiry});
              res.status(200).json({result, token});

            }

        }else{
       
        

            const urlObj = await uploadImage(req.file, req.userId, '/profilePics/DP');
            const{dpUrl, dpRef} = urlObj;
            
            if(dpUrl?.length){

              //console.log({urlObj});

              if(userDpRef?.dpRef?.length > 0){ //first check if former image exists

                const deleteRes = await deleteImage(userDpRef.dpRef);
                //console.log(deleteRes);

              }else{ 
                console.log('no dpRef');
              }

              const updated_User_Profile = await UsersModel.findByIdAndUpdate (id, {dpUrl: dpUrl, dpRef:dpRef}, { new: true });   
              const result = await UsersModel.findById(updated_User_Profile._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
              const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: result.jwtExpiry});
            
              res.status(200).json({result, token});

            }else{

              console.log('error');

            }
        }
      
      } catch(error){
        console.log(error);
      }

 
}

exports.block = async(req,res) => {
    
    
 
  try{

    const {blocked} = req.body;
    //console.log(req.body);

   const blockedUser = await UsersModel.findByIdAndUpdate (blocked, { $push: { "blockers": req.userId }}, { new: true });
   
   //console.log(blockedUser.blockers);
   
   const blockerUser = await UsersModel.findByIdAndUpdate (req.userId, { $push: { "blocked": blocked }}, { new: true });
   
   //console.log(blockerUser.blocked);

   const result = await UsersModel.findById(blockerUser._id,{userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
 
    const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: result.jwtExpiry});
    res.status(200).json({result, token, message:'Success'});
   
    //console.log('Success');

  } catch(error){

      //console.log(error.message);
      res.json({message:'error'})

  }
 
  
 }
 exports.unblock = async(req,res) => {
    
  

try{

  const {unblocked} = req.body;
  //console.log(req.body);

    const unblockedUser = await UsersModel.findByIdAndUpdate (unblocked, { $pull: { "blockers": req.userId }}, { new: true });
    
    //console.log(unblockedUser.blockers);
    
    const unblockerUser = await UsersModel.findByIdAndUpdate (req.userId, { $pull: { "blocked": unblocked }}, { new: true });
    
    //console.log(unblockerUser.blocked);

    const result = await UsersModel.findById(unblockerUser._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});

      const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: result.jwtExpiry});
      res.status(200).json({result, token, message:'Success'});
    
      //console.log('Success');

  } catch(error){

      //console.log(error.message);
      res.json({message:'error'})

  }
}

exports.populateBlock = async(req,res) => {


    try{

    const blockedUsers = await UsersModel.findById(req.userId, {blocked:1})
    .populate('blocked', 'dpUrl userName');

    res.status(200).json(blockedUsers);
    //console.log(blockedUsers);

    } catch(error){

        console.log(error.message);

    }

}
 
exports.getMiniProfile = async(req,res) => {

   
  
    
    try{

      const profileName = req.params.profileName?.toLowerCase();
      //console.log(req.params);
  
    const miniProfile = await UsersModel.findOne ({userName: { $in: [ profileName ] } },  {userName:1, dpUrl:1, follows:1, followers:1, blockers:1, activityPointsTotal:1, blocked:1, bio:1, postTotal:1, convoTip:1, convoRequesters:1, lastStoryExpiry:1});
    
  //   const miniProfile = (await UsersModel.aggregate([{
  //     $search: {
  //       index: "userName",
  //       text: {
  //         query: profileName,
  //         path: "userName"
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       userName:1, dpUrl:1, follows:1, followers:1,
  //        blockers:1, activityPointsTotal:1, blocked:1,
  //        bio:1, postTotal:1, convoTip:1,
  //         convoRequesters:1, lastStoryExpiry:1,
  //     }
  //   }
  // ]))[0]; //0 for array remove



    if (!miniProfile || miniProfile.blocked.includes(req.userId) || miniProfile.blockers.includes(req.userId)){  

      res.json("NO_USER");

    } else {

      res.json(miniProfile);
      //console.log(miniProfile);

    }

    } catch(error){
      console.log(error.message);
    }
 
}


exports.follow =  async (req, res)=> {

  
  
      
    try{

      const { followed} = req.body;

      const user = await UsersModel.findById(req.userId, {followSpam:1});
      const  newFollowSpam = user.followSpam + 1;
      
      if(newFollowSpam > 100){

          res.json('Spam');

      }else{
          const followerUser = await UsersModel.findById (req.userId, {follows:1});
          //console.log(followerUser.follows);

          if (followerUser.follows.includes(followed)){
            
            const updatedFollower= await UsersModel.findByIdAndUpdate (req.userId, { $pull: { "follows": followed }}, { new: true });
            const updatedFollowed= await UsersModel.findByIdAndUpdate (followed, { $pull: { "followers": updatedFollower._id }}, { new: true });
            const miniProfile = await UsersModel.findById (updatedFollowed._id , {userName:1, dpUrl:1, follows:1, followers:1, blockers:1, blocked:1, bio:1, postTotal:1, convoTip:1, convoRequesters:1});
            res.json({miniProfile}); 
            const updatedUser = await UsersModel.findByIdAndUpdate(req.userId, { $set: {followSpam:newFollowSpam}}, { new: true });
            //console.log(updatedUser); 
            //console.log('unfollowed')
 
        
        } else {

            const updatedFollower = await UsersModel.findByIdAndUpdate (req.userId, { $push: { "follows": followed }}, { new: true });
            const updatedFollowed= await UsersModel.findByIdAndUpdate (followed, { $push: { "followers": updatedFollower._id }}, { new: true });
            const miniProfile = await UsersModel.findById (updatedFollowed._id , {userName:1, dpUrl:1, follows:1, followers:1, blockers:1, blocked:1, bio:1, postTotal:1, convoTip:1, convoRequesters:1});
            
            const unpopulatedNewNotification = await NotificationsModel.create({sender:req.userId, receiver:followed, body:'', postId:followed, read: false, class:'normal',  type: 'follow', createdOn: new Date(), dateRank: Date.now()});
            const newNotification = await NotificationsModel.findById(unpopulatedNewNotification._id)
            .populate('sender', 'dpUrl userName');
            
            
            res.json({miniProfile:miniProfile, newNotification:newNotification});
            const updatedUser = await UsersModel.findByIdAndUpdate(req.userId, { $set: {followSpam:newFollowSpam}}, { new: true });
            //console.log(updatedUser);
            //console.log("followed");
        }
    }
  
  } catch(error){
      res.status(409).json({message:error.message});
      //console.log(error.message);
  }

}
 
exports.dailyPoints = async(req,res) => {
 
 
  
  try{

    const id = req.userId;
    const userTime = await UsersModel.findById (id, {dailyLogin:1, activityPointsTotal:1, storyTips:1});

    //console.log({userTime});
    const addedTotalPoints = (userTime.activityPointsTotal+1);
    const loginRecord = {type: "(1) Daily Login Point ", points: 1}; 

    const dateNow = parseInt(Date.now())

    if (dateNow > (userTime.dailyLogin + 86400000)){ //if 24 hrs have passed since last dailylogin means dateNow is more.
      
      const expiredStories_TipsArray = await StoriesModel.find({ "$and": [ {"creator": {$eq:id}}, {"expiry": {$lt:dateNow}} ] }, {_id:0, tipsArray:1}); 

      const arrayOfArrays = expiredStories_TipsArray?.map(({ tipsArray }) => tipsArray)
      const arrayOfNumbers = arrayOfArrays?.flat(1);
      const expiredTipsTotal = arrayOfNumbers?.reduce((a, b) => a + b, 0);
      const userStoryTips = userTime?.storyTips;
  
     

      const storyTipsCut = (expiredStories_TipsArray?.length > 0 
        && userStoryTips && userStoryTips > expiredTipsTotal 
        ? userStoryTips - expiredTipsTotal
        : 0); 
      
      
      const awarded_User_Profile = await UsersModel.findByIdAndUpdate (id,{ $push:{"activityPointsRecord": loginRecord}, $set: {followSpam:0, postSpam:0, reviewSpam:0, storySpam:0, dailyLogin: Date.now(), activityPointsTotal: addedTotalPoints, storyTips: storyTipsCut}}, { new: true });
    
      const result = await UsersModel.findById(awarded_User_Profile._id, {userName:1 ,email:1 ,dpUrl:1 ,bio:1 ,convoTip:1 ,city:1 ,country:1 ,gender:1 ,age:1 ,interests:1 ,blocked:1 ,blockers:1 ,jwtExpiry:1});
                            
      //This Deletes stories that were not being Gotten that expired and are still in server

      //Find StoriesThat have expired and tipsArray length greater than 0. 
      //Add all those tips then take away from user storyTips. 

      // let objArray = [person1, person2, person3]

      // let arrayForm = objArray.map(({ age }) => age)
      // let arrayAdd = arrayForm.flat(1)
      // let sum = arrayAdd.reduce((a, b) => a + b, 0)

     




      await StoriesModel.deleteMany({ "$and": [ {"creator": {$eq:id}}, {"expiry": {$lt:dateNow}} ] }); 
      const token = jwt.sign({email: result.email, id: result._id}, JWT_SECRET, {expiresIn: result.jwtExpiry});
      res.status(200).json({result, token, message:'Success'});  

    } else {
      res.json("Error");

    }
  } catch(error){
    console.log(error);
  }
 
  
 }