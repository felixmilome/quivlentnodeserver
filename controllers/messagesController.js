const { ChatsModel } = require('../models/chatsModel');
const { MessagesModel } = require('../models/messagesModel');
const { UsersModel } = require('../models/usersModel'); // Adjust path as necessary
const {createNotification} = require('./controllerHandlers/notificationHandlers.js')
exports.getChatsCtrl = async (req, res) => {
  try {
    const userId = req.userId; // Assuming you have user ID from req.user
    
    // Fetch chats for the user and populate necessary fields
    const chats = await ChatsModel.find({ participants: userId })
      .populate({
        path: 'lastMessage', // Populate the last message
        select: 'messageText sentAt seen', // Fields to select from MessagesModel
      })
      .populate({
        path: 'participants', // Populate participants
        select: '_id username dpPath blockedArray', 
        // Blocked only on get others of post wont be posible. Coz even starting chat wont be possible since profile is blocked.
      });

    return res.status(200).json({status:'success', data:chats, message:'success'});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status:'error', message: 'Error fetching chats'});
  }
};


exports.getMessagesCtrl = async (req, res) => {
    try {
      const { chatId } = req.body; // Get chatId from request body
   
      // Check if you can find by Id
      const messages = await MessagesModel.find({ chatId }) // Assuming MessagesModel has a field for chatId
        .populate({
          path: 'senderId', // Populate sender's details
          select: '_id username dpPath', // Fields to select from UsersModel
        })
        .populate({
          path: 'receiverId', // Populate receiver's details
          select: '_id username dpPath', // Fields to select from UsersModel
        })
       // .sort({ sentAt: 1 }); // Sort messages by sentAt in ascending order
      //  console.log(messages);

        const chat = await ChatsModel.findById(
          chatId,
        ).populate({
          path: 'participants',
          select: 'username _id dpPath' // Populate participants with specific fields
        })
        .populate({
          path: 'lastMessage',
          select: 'messageText sentAt' // Populate lastMessage with specific fields
        });
  
      return res.status(200).json({ status: 'success', data: {messages, chat}, message: 'Messages fetched successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Error fetching messages' });
    }
  };

  exports.postMessageCtrl = async (req, res) => {
    try {
      
      const {type, receiverId, messageText} = req?.body;
      const senderId = req.userId;

    

      const existingChat = await ChatsModel.findOne({
        participants: { $all: [senderId, receiverId] } // Ensure both participants are in the array
      })
  

      // if(existingChat && existingChat?.accepted === false) {
      // if(existingChat && type === 'request') {
      //   return res.status(201).json({ status: 'success', message: 'Request was already sent'});
      // }
      
      
      if (existingChat 
        // && type ==='matched'
      ){

          const chatId = existingChat?._id
         
          
          const newMessage = new MessagesModel({

            senderId,
            receiverId,
            chatId:existingChat?._id,
            messageText,
        
          });
    
        // Save the message to the database
        const savedMessage = await newMessage.save();

        const populatedMessage = await MessagesModel.findById(savedMessage._id)
        .populate('senderId', '_id username dpPath')
        .populate('receiverId', '_id username dpPath');
    
        // Update the last message in the corresponding chat
        const editedChat = await ChatsModel.findByIdAndUpdate(
          chatId,
          {
            lastMessage: savedMessage._id, // Set the lastMessage to the newly created message ID
          },
          { new: true } // Option to return the updated document
        )
        .populate({
          path: 'participants',
          select: 'username _id dpPath' // Populate participants with specific fields
        })
        .populate({
          path: 'lastMessage',
          select: 'messageText sentAt' // Populate lastMessage with specific fields
        });

        const newNotification = await createNotification({
          senderMiniProfile: senderId,
          receiverId,
          type:'chat',
          referenceId: editedChat?._id
        });

     

        
        return res.status(201).json({ status: 'success', data: {newMessage:populatedMessage, newChat:editedChat, newNotification}, message: 'Message sent successfully' });
      
      } else if(!existingChat 
        // && type === 'request'
      ){

        const chatData = new ChatsModel({
          participants: [senderId, receiverId], // participants should be an array of user IDs
          lastMessage: null, // Initially, there might be no last message
          createdAt: Date.now(), // Set the creation date
          accepted: false, // or true depending on your logic
          initiator: senderId
        });
    
        const savedChat = await chatData.save();
      

        const newMessage = new MessagesModel({
          senderId: senderId, // ID of the sender
          receiverId: receiverId, // ID of the receiver
          chatId: savedChat._id, // ID of the associated chat
          messageText: messageText, // Text of the message
          //media: media, // Optional media array
          //sentAt: Math.floor(Date.now() / 1000), // Use mktime UTC format (in seconds)
          seen: false // Initially mark as not seen
        });
    
        // Save the message to the database
        const savedMessage = await newMessage.save();

        const populatedMessage = await MessagesModel.findById(savedMessage._id)
        .populate('senderId', '_id username dpPath')
        .populate('receiverId', '_id username dpPath');

        const updatedChat = await ChatsModel.findByIdAndUpdate(
          savedChat._id,
          { lastMessage: savedMessage._id }, // Set lastMessage to the newly created message ID
          { new: true } // Option to return the updated document
        )
        .populate({
          path: 'participants',
          select: 'username _id dpPath' // Populate participants with specific fields
        })
        .populate({
          path: 'lastMessage',
          select: 'messageText sentAt' // Populate lastMessage with specific fields
        });
        const newNotification = await createNotification({
          senderMiniProfile: senderId,
          receiverId,
          type:'chat',
          referenceId: updatedChat?._id
        });

        return res.status(201).json({ status: 'success', data: {newMessage:populatedMessage, newChat:updatedChat, newNotification}, message: 'Sent Successfully' });

      }
  
    } catch (error) {

      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Error sending message' });
    
    }
  };

  
exports.editMessageCtrl = async (req, res) => {
    try {

      const {messageId} = req.body;

      if(req.body?.type ==='read'){
        const updatedMessage = await MessagesModel.findByIdAndUpdate(
          messageId,
          { seen: true},
          { new: true } // Option to return the updated document
        ).populate({
          path: 'senderId', // Populate sender's details
          select: '_id username dpPath', // Fields to select from UsersModel
        })
        .populate({
          path: 'receiverId', // Populate receiver's details
          select: '_id username dpPath', // Fields to select from UsersModel
        });

        if (!updatedMessage) {
          return res.status(404).json({ status: 'error', message: 'Message not found' });
        }
    
        return res.status(200).json({ status: 'success', data: updatedMessage, message: 'Message updated successfully' });

      }

      const {newMessageText } = req.body; // Extract messageId and newMessageText from request body
  
      // Find the message by its ID and update the messageText
      const updatedMessage = await MessagesModel.findByIdAndUpdate(
        messageId,
        { messageText: newMessageText },
        { new: true } // Option to return the updated document
      ).populate({
        path: 'senderId', // Populate sender's details
        select: '_id username dpPath', // Fields to select from UsersModel
      })
      .populate({
        path: 'receiverId', // Populate receiver's details
        select: '_id username dpPath', // Fields to select from UsersModel
      });
  
      // Check if the message was found and updated
      if (!updatedMessage) {
        return res.status(404).json({ status: 'error', message: 'Message not found' });
      }
  
      return res.status(200).json({ status: 'success', data: updatedMessage, message: 'Message updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Error updating message' });
    }
  };

  exports.deleteMessageCtrl = async (req, res) => {
    try {
      const { messageId, chatId } = req.body; // Extract messageId and chatId from request body
  
      // Find and delete the message by its ID
      const deletedMessage = await MessagesModel.findByIdAndDelete(messageId);
  
      // Check if the message was found and deleted
      if (!deletedMessage) {
        return res.status(404).json({ status: 'error', message: 'Message not found' });
      }
  
      // Optionally, you can update the lastMessageAt in the corresponding chat
      const chat = await ChatsModel.findById(chatId);
      if (chat) {
        // Update lastMessageAt to the ID of the last message in the chat
        const lastMessage = await MessagesModel.findOne({ chatId }).sort({ sentAt: -1 }); // Get the last message
        chat.lastMessageAt = lastMessage ? lastMessage._id : null; // Set to null if no last message exists
        await chat.save(); // Save the updated chat
      }
  
      return res.status(200).json({ status: 'success', message: 'Message deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Error deleting message' });
    }
  };

