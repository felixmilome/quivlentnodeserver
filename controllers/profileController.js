const { UsersModel } = require('../models/usersModel'); // Adjust the path as necessary

const {uploadFilesToFirebase} = require('../functions/filesHandler.js')
const {convertToUnixTime} = require('../functions/index.js')
const {createNotification} = require('./controllerHandlers/notificationHandlers.js')

const {ipGeolocator} = require ('../functions/index.js')
//accepted

const getUserPopulated = async (userId) => {

  const user = await UsersModel.findById(userId)
    .select('-password -authOtp') // Exclude sensitive fields
    .populate({
      path: 'matchesArray.userId', // Populate userId in matchesArray
      model: 'UsersModel',
      select: '_id username dpPath', // Select specific fields
    })
    .populate({
      path: 'blockedArray.userId', // Populate userId in blockedArray
      model: 'UsersModel',
      select: '_id username dpPath', // Select specific fields
    });


  // //Transform matchesArray to include userData
  // if (user?.matchesArray) {
  //   console.log('mamyyyy')
  //   user.matchesArray = user.matchesArray.map((match) => ({
  //     ...match,
  //     userData: match.userId, // Add populated user data to userData
  //     userId: match.userId._id, // Return only the userId
  //   }));
  //   return user;
  // }

  // // Transform blockedArray to include userData
  // if (user?.blockedArray) {
  //   user.blockedArray = user.blockedArray.map((blocked) => ({
  //     ...blocked,
  //     userData: blocked.userId, // Add populated user data to userData
  //     userId: blocked.userId._id, // Return only the userId
  //   }));
  //   return user;
  // }

  return user
};
 


exports.getProfileCtrl = async (req, res) => {
  try { 
 
    // console.log(req.body);
    const userId = req.body.userId; // Assuming the user ID is passed as a route parameter

    const user = await getUserPopulated(userId);
    // console.log(user);

    if (!user) {
      return res.status(404).json({status:'error', message:'user not found'});
    }

    return res.status(200).json({status:'success', data:user, message:'success'});
  } catch (error) {
    console.error('Error retrieving user:', error);
    return res.status(500).json({status:'error', message:'Server Error'});
  }
};

exports.getUsersProfileCtrl = async (req, res) => {
  try {
    const {type} = req.body

    if (type === 'match') {
      
      const users = await UsersModel.aggregate([
        { $sample: { size: 50 } },
        {
          $project: {
            password: 0,
            authOtp: 0,
            suspensionEndDate: 0, 
            suspendedReason: 0,
            // All other fields will be included by default
          },
        },
      ]);

      res.status(200).json({status:'success', data:users, message:'success'});

    }else if (type === 'simple'){

      const {userIdsArr} = req.body;

      const users = await UsersModel.find(
        { _id: { $in: userIdsArr } }, 
        { _id: 1, username: 1, dpPath: 1 }
      );
      res.status(200).json({status:'success', data:users, message:'success'});

    }

  } catch (error) {
    res.status(500).json({ status:'error', message: 'Error retrieving matches'});
  }
};



// Send Match Request (or accept if it already exists)
exports.sendOrAcceptMatchRequestCtrl = async (req, res) => { 
  try {
    const { targetUserId} = req.body;
    const userId = req?.userId;

    // Find the sender's matches
    const sender = await UsersModel.findById(userId);
    const existingMatch = sender.matchesArray.find(
      (match) => match.userId.toString() === targetUserId
    );

    if (existingMatch) {
      // Check the status of the existing match
      if (existingMatch.status === 'accepted') {

        if(req.body?.type ==='unmatch'){

          if (req.body?.type === 'unmatch') {

            const myProfileUnpopulated = await UsersModel.findByIdAndUpdate(
              userId,
              {
                $pull: { matchesArray: { userId: targetUserId } }, // Remove the match entry
              },
              {
                new: true, // Return the updated document
                select: '-password -authOtp', // Exclude sensitive fields
              }
            ); 
            
            const myProfile = await getUserPopulated(myProfileUnpopulated?._id);
          
            const targetProfile = await UsersModel.findByIdAndUpdate(
              targetUserId,
              {
                $pull: { matchesArray: { userId: userId } }, // Remove the match entry
              },
              {
                new: true, // Return the updated document
                select: '-password -authOtp -suspensionEndDate -suspendedReason ', // Exclude sensitive fields
              }
            );
            return res.status(200).json({status:'success', data:{ myProfile, targetProfile}, message: 'Unmatched' });
         
          }

         
          

        }else{

          return res.status(200).json({status:'error', message: 'Match already accepted' });

        }
      
      } else if (existingMatch.status === 'sent') {
        return res.status(200).json({status:'error', message: 'Match request already sent' });
      } else if (existingMatch.status === 'received') {
        // If a request exists and status is 'received', update both users' matches to 'accepted'
        const myProfileUnpopulated = await UsersModel.findByIdAndUpdate(
          userId,
          {   $set: { 
            'matchesArray.$[elem].status': 'accepted',
            'matchesArray.$[elem].matchedDate': Date.now() // Set to current Unix timestamp
          }  },
          {
            arrayFilters: [{ 'elem.userId': targetUserId }],
            new: true, // Return the updated document
            select: '-password -authOtp', // Exclude sensitive fields
          }
        );
        const myProfile = await getUserPopulated(myProfileUnpopulated?._id);

        
        const targetProfile = await UsersModel.findByIdAndUpdate(
          targetUserId,
          {  $set: { 
            'matchesArray.$[elem].status': 'accepted',
            'matchesArray.$[elem].matchedDate': Date.now() // Set to current Unix timestamp
          }  },
          {
            arrayFilters: [{ 'elem.userId': userId }],
            new: true, // Return the updated document
            select: '-password -authOtp -suspensionEndDate -suspendedReason', // Exclude sensitive fields
          }
        );

        const sentNotification = await createNotification({
          senderMiniProfile: userId,
          receiverId: targetUserId,
          type:'match',
          referenceId: targetUserId
        });
        const myNotification = await createNotification({
          senderMiniProfile: targetUserId,
          receiverId: userId,
          type:'match',
          referenceId: targetUserId
        }); 

        return res.status(200).json({status:'success', data:{myProfile, targetProfile, sentNotification, myNotification}, message: 'Matched' });
      }
    }

    // If no existing request or if it's a new request, create new match requests
    const myProfileUnpopulated = await UsersModel.findByIdAndUpdate(userId, {
      $push: {
        matchesArray: { userId: targetUserId, status: 'sent' }
      }
    }, { new: true, select: '-password -authOtp' });

    const myProfile = await getUserPopulated(myProfileUnpopulated?._id);

    const targetProfile = await UsersModel.findByIdAndUpdate(targetUserId, {
      $push: {
        matchesArray: { userId: userId, status: 'received' }
      }, 
    }, { new: true, select: '-password -authOtp -suspensionEndDate -suspendedReason ' });

    return res.status(200).json({status:'success', data:{myProfile, targetProfile}, message: 'Sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing match request', error });
  }
};


 
// Controller to block or unblock a user
exports.blockOrUnblockUserCtrl = async (req, res) => {
  try {
    const { blockedUserId, type } = req.body;
  
    const userId = req.userId;

  

    if (type === "block") {
      // Add the user to the blocked array
      const resultUnpopulated = await UsersModel.findOneAndUpdate(
        {
          _id: userId, // Match the user document
          'blockedArray.userId': { $ne: blockedUserId }, // Ensure `blockedUserId` is not already in `blockedArray`
        },
        {
          $push: {
            blockedArray: {
              userId: blockedUserId,
              blockedDate: Date.now(),
            },
          },
        },
        {
          new: true, // Return the updated document
        }
      );
      const user_Id = resultUnpopulated?._id?.length>0 ? resultUnpopulated?._id : userId
      const result = await getUserPopulated(user_Id);
     

      if (result) {
       
        return res.status(200).json({ status:'success', message: "Blocked", data:result });

      } else {

        return res.status(404).json({ message: "Blocked" });
        
      }
    } else if (type === "unblock") {
      // Remove the user from the blocked array
      const resultUnpopulated = await UsersModel.findByIdAndUpdate(
        userId,
        {
          $pull: {
            blockedArray: { userId: blockedUserId },
          },
        },
        { new: true } // Return the updated document
      );

      const result = await getUserPopulated(resultUnpopulated?._id);

      if (result) {
        return res.status(200).json({ status:'success', message: "Unblocked", data:result });
      } else {
        return res.status(404).json({ message: "User not found." });
      }
    } else {
      return res.status(400).json({ message: "Invalid type specified." });
    }
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};





exports.editProfileCtrl = async (req, res) => {
  try {
 
    const userId = req.userId; // Assuming user ID is available from auth middleware
    const editedFields = req.body;

   
  

 
    // Build the update object
    const updateData = {};

    if (editedFields.location) { 

      const locationIp = editedFields?.locationData?.ip;
      
      const ipGeolocation = await ipGeolocator(locationIp)
      updateData.countryCode = ipGeolocation?.countryCode,
      updateData.region = ipGeolocation?.region,
      updateData.coordinates = ipGeolocation?.coordinates
 
    }

    // Check for dateOfBirth and convert it if present
    if (editedFields.dateOfBirth) {
      updateData.dateOfBirth = convertToUnixTime(editedFields.dateOfBirth);
    }
    if (editedFields.interestsArray) {
      // If it's a string, split it into an array
      if (typeof editedFields.interestsArray === 'string') {
        editedFields.interestsArray = editedFields.interestsArray.split(',').map(item => item.trim());
      }
      updateData.interestsArray = editedFields.interestsArray;
    }

    // Handle file uploads
    if (req.files) {
      const dpFile = req.files.dpPath ? req.files.dpPath[0] : null;
      const timelinePhotos = req.files.photoPathsArray || [];

      // Upload dpFile if present and update dpPath
      if (dpFile) {
        const uploadedDpInfo = await uploadFilesToFirebase([dpFile], '/dpPhoto', userId);
        updateData.dpPath = uploadedDpInfo[0].downloadURL;
      }

      // Upload and handle timeline photos
      if (timelinePhotos.length > 0) {
        const changedIndexes = editedFields.changedIndexes.map(index => parseInt(index, 10));

        // Upload files and get their download URLs
        const uploadedPhotoInfo = await uploadFilesToFirebase(timelinePhotos, '/timelinePhoto', userId);
        
        // Create an updated photoPathsArray based on uploaded info and changed indexes
        const newPhotoPathsArray = uploadedPhotoInfo.map((file, i) => ({
          indexId: changedIndexes[i],
          photoPath: file.downloadURL,
        }));

        // Fetch the existing user's photoPathsArray for reference
        const user = await UsersModel.findById(userId, 'photoPathsArray');

        if (!user) {
          return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Create a map of existing photos for easy look-up
        const existingPhotosMap = new Map(user.photoPathsArray.map(photo => [photo.indexId, photo]));

        // Merge new photos into the existing array
        newPhotoPathsArray.forEach(({ indexId, photoPath }) => {
          if (existingPhotosMap.has(indexId)) {
            // Replace existing photo if it exists
            existingPhotosMap.get(indexId).photoPath = photoPath;
          } else {
            // Otherwise, add the new photo
            existingPhotosMap.set(indexId, { indexId, photoPath });
          }
        });

        // Convert the map back to an array
        updateData.photoPathsArray = Array.from(existingPhotosMap.values());
      }
    }

    // Add other fields from the body to updateData
    Object.keys(editedFields).forEach((field) => {
      if (field !== 'dpPath' && field !== 'photoPathsArray' && field !== 'dateOfBirth'  && field !== 'interestsArray') {
        updateData[field] = editedFields[field];
      }
    });

    // console.log(updateData);

    // Update the user document with the new updateData
    const updatedUserUnpopulated = await UsersModel.findByIdAndUpdate(userId, updateData, { new: true, select: '-password -authOtp' });
    // console.log(updatedUserUnpopulated);
    const updatedUser = await getUserPopulated(updatedUserUnpopulated?._id);

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    

    return res.status(200).json({ status: 'success', data: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};


