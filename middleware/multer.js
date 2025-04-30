
const multer = require("multer");

const memoStorage = multer.memoryStorage();


function checkMulterFileType(file, cb){
   
  const filetypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
    // console.log({file});
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
  }

 
exports.multerUpload = multer({ 
      
    storage:memoStorage,
    limits: {
       
        fileSize: 5*1024*1024, // Limit size to 5 MB
    },
    fileFilter: function(_req, file, cb){
      // console.log(_req,file)
        checkMulterFileType(file, cb);
    }

});