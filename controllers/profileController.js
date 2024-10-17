const { UsersModel } = require('../models/usersModel'); // Adjust the path as necessary

const {uploadFilesToFirebase} = require('../functions/filesHandler.js')
const {convertToUnixTime} = require('../functions/index.js')

exports.getProfileCtrl = async (req, res) => {
  try {
    console.log('getProfile');
    // console.log(req.body);
    const userId = req.body.userId; // Assuming the user ID is passed as a route parameter
    const user = await UsersModel.findById(userId).select('-password -authOtp');
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

exports.editProfileCtrl = async (req, res) => {
  try {
    console.log("edit profile");
    const userId = req.userId; // Assuming user ID is available from auth middleware
    const editedFields = req.body;
    // console.log(req?.body);
    // console.log(req?.files);

    // Build the update object
    const updateData = {};

    // Check for dateOfBirth and convert it if present
    if (editedFields.dateOfBirth) {
      updateData.dateOfBirth = convertToUnixTime(editedFields.dateOfBirth);
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

      // Upload and push timeline photos to photoPathsArray
      if (timelinePhotos.length > 0) {
        const uploadedPhotoInfo = await uploadFilesToFirebase(timelinePhotos, '/timelinePhoto', userId);
        const downloadURLs = uploadedPhotoInfo.map(file => file.downloadURL);
        console.log(downloadURLs);

        // Push the download URLs to photoPathsArray
        updateData.photoPathsArray = downloadURLs;
      }
    }

    // Add other fields from the body to updateData
    Object.keys(editedFields).forEach((field) => {
      if (field !== 'dpPath' && field !== 'photoPathsArray' && field !== 'dateOfBirth') {
        updateData[field] = editedFields[field];
      }
    });

    // Update the user document
    const updatedUser = await UsersModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password -authOtp');

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    return res.status(200).json({ status: 'success', data: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

