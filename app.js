require('dotenv').config()
const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const {GridFsStorage} = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')

const app = express();

app.set('view engine', 'ejs');

//Connecting to the database
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.87jrf.mongodb.net/uploads?retryWrites=true&w=majority`

const conn = mongoose.createConnection(URI,{useUnifiedTopology:true})
// .then(()=>console.log("DB connected")).catch(err=>console.log('db connection error', err));


//Creating a gridfs file stream

var gfs;


conn.once('open',()=>{
    gfs = Grid(conn.db,mongoose.mongo)
    //This is the collection name we want our gridfs file stream for
    gfs.collection('uploads')
})

//This is the storage 
const storage = new GridFsStorage({
    url: URI,
    file: (req, file)=>({
        filename: 'File_'+ Date.now()  + path.extname(file.originalname),
        bucketName: 'uploads',
    })

})

//Telling the storage to the parsing(parses incoming files) function
const upload = multer({storage})

app.get('/',(req,res)=>{
    res.render("index")
})

app.post('/upload',upload.single('inp_file'),(req,res)=>{
    res.send(req.file)
})


//Get meta data(fs.files) for all files
app.get('/files',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(err)  res.send(err);
        res.send(files);
    })
})

//Get meta data (fs.files) for one file
app.get('/files/:filename', (req,res)=>{
    gfs.files.findOne({filename: req.params.filename},(err,file)=>{
        if(err) res.send(err)
        res.send(file)
    })
})

//Read the file from the database to the user

//This url can be used inside an img tag and the image will be rendered
app.get('/render/:filename',(req,res)=>{
    //Create a read stream for the file
    let read = gfs.createReadStream(req.params.filename)

    //Pipe that read stream to the response
    read.pipe(res)
})

//Delete a file

app.delete('/delete/:id',(req,res)=>{
    gfs.remove({_id: req.params.id, root:'uploads'},(err)=>{
        if(err) res.send(err)
        res.json({mess: 'Successfully deleted'})
    })
})

app.listen(3000,()=>{console.log("App listening at 3000")})