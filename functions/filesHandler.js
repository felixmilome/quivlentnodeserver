const { ref, getDownloadURL, uploadBytesResumable } = require("firebase/storage");
const {storage} = require ('../firebase/config.js')
// Function to handle multiple file uploads
exports.uploadFilesToFirebase = async (files, path, userId, caption) => {
    const uploadPromises = files.map(async (file, index) => {
        const dateTime = giveCurrentDateTime();
        const storageRef = ref(storage, `${path}-${dateTime}-${userId}-${index}`); // Use userId

        // Create file metadata including the content type
        const metadata = {
            contentType: file.mimetype,
        };

        try {
            // Upload the file in the bucket storage
            const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);
            
            // Grab the public URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                index: index,
                caption: caption,
                downloadURL: downloadURL,
            };
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error("File upload failed");
        }
    });

    // Wait for all uploads to complete
    return Promise.all(uploadPromises);
};

// Helper function to get the current date and time
const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return `${date}-${time}`;
};
