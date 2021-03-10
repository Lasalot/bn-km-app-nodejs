const express = require("express");
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require ('mysql2')
const multer = require('multer')

require ('dotenv').config()

const app = express();



var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"))


const con = mysql.createConnection({
  host: process.env.HOST,
  user:process.env.USER,
  password:process.env.PASSWORD,
  database:process.env.DB
})

con.connect(function(err) {
  if(err) throw err;
  console.log("Connected to database!");
})

// MULTER UPLOAD
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
  cb(null, 'img')
},
filename: function (req, file, cb) {
const today = new Date();
const date = today.getFullYear()+''+(today.getMonth()+1)+''+today.getDate();
const time = today.getHours() + "" + today.getMinutes() + "" + today.getSeconds();
  cb(null, date + "" + time + '-' +file.originalname )
}
})

const upload = multer({ storage: storage }).single('file')




//Insert data from Form
app.post("/api/distance", (req,res) => {


const activity = req.body.activity_type
if (req.body.password != process.env.SECRETPASS) {
  res.send("You have no permission to post data")
} else {

  if( activity === "Run") {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
          return res.status(500).json(err)
      } else if (err) {
          return res.status(500).json(err)
      }
 return res.status(200).send(req.file)

})
    const kilometers = parseInt(req.body.kilometers,10)
    con.query(`INSERT INTO kmApp.done_distances (kilometers,steps, who, activity_type) VALUES ('${kilometers}','0','${req.body.who}','${req.body.activity_type}')`, function (err,result) {
      if (err) throw err;
      res.json("Entry added for Run !")
      })

  }


  else if (activity === "Bike") {
    const kilometers = parseInt(req.body.kilometers,10)
    con.query(`INSERT INTO kmApp.done_distances (kilometers,steps, who, activity_type) VALUES ('${kilometers}','0','${req.body.who}','${req.body.activity_type}')`, function (err,result) {
      if (err) throw err;
      res.json("Entry added for Bike!")
      })
  }

  else if (activity === "Roller Skates") {
    const kilometers = parseInt(req.body.kilometers,10)
    con.query(`INSERT INTO kmApp.done_distances (kilometers,steps, who, activity_type) VALUES ('${kilometers}','0','${req.body.who}','${req.body.activity_type}')`, function (err,result) {
      if (err) throw err;
      res.json("Entry added for Roller Skates!")
      })
  }

  else if (activity === "Walk") {
    const steps = parseInt(req.body.steps,10)
    const kilometers = (steps*0.62/1000)
    con.query(`INSERT INTO kmApp.done_distances (kilometers, steps, who, activity_type) VALUES ('${kilometers}','${steps}','${req.body.who}','${req.body.activity_type}')`, function (err,result) {
      if (err) throw err;
      res.json("Entry added for Walk!")
      })
  }

}




 })

//Get all distance in SUM
app.get("/api/getoveralldistance", (req,res) => {
  con.query('SELECT SUM(kilometers)+SUM((steps*0.62)/1000) AS doneDistance FROM done_distances', function(err,result) {
    if (err) throw err;
    res.send(result[0].doneDistance)
  })
})

//Get All distance without being filtered
app.get('/api/getalldistance', (req,res) => {
con.query('SELECT * from done_distances', function(err,result) {
  if(err) throw err;
  res.send(result);

})
})

app.post('/api/getuserdata', (req,res) => {
  console.log(req.body)
  const user1 = req.body.user

  con.query(`SELECT * FROM done_distances WHERE who = "${user1}"`, function(err,result){
    if(err) throw err;
    res.send(result);
  })
})


app.post('/api/upload', (req,res) => {

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
        return res.status(500).json(err)
    } else if (err) {
        return res.status(500).json(err)
    }
return res.status(200).send(req.file)

})
})



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
