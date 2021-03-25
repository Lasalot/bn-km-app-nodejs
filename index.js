const express = require("express");
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require ('mysql2')
const multer = require('multer')
const axios = require('axios')

require ('dotenv').config()

const app = express();



var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))


const con = mysql.createConnection({
  host: process.env.HOST,
  user:process.env.USER,
  password:process.env.PASSWORD,
  database:process.env.DB
})

app.options('*',cors())

var name = []
// MULTER UPLOAD
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
  cb(null, 'img')
},
filename: function (req, file, cb) {

const today = new Date();
const date = today.getFullYear()+''+(today.getMonth()+1)+''+today.getDate();
const time = today.getHours() + "" + today.getMinutes() + "" + today.getSeconds();
  cb(null, date + "" + time + "-"+ name[0]+ '-' +file.originalname)
}
})

const upload = multer({ storage: storage }).single('file')





//GET REQUESTS//

//Get all distance in SUM
app.get("/api/getoveralldistance", async(req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
  //If Email allowed
  await con.connect(function(err) {
    if(err) throw err;

  });
  const sql = 'SELECT SUM(kilometers) AS doneDistance FROM dev_done_distances'
  con.query( sql, function(err,result) {

    if (err) throw err;
    res.send(result[0].doneDistance)


  }

  )


} else (res.json({
  message: "You are not permitted to use this API"
}))



})

//Get All distance without being filtered
app.get('/api/getalldistance', (req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    const sql = 'SELECT * from dev_done_distances  ORDER BY 2 DESC'
    con.query(sql, function(err,result) {
      if(err) throw err;
      res.send(result);

    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))




})

// POST REQUESTS //

//Insert data from Form
app.post("/api/distance", async(req,res) => {
  const email = req.body.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){

    await con.connect(function(err) {
      if(err) throw err;

    });
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const currentDate = date +" "+time
    const activity = req.body.activity_type

    if( activity === "Run" || activity === "Bike" || activity === "Roller Skates" ) {
          const meters = parseInt(req.body.meters,10)
          const kilometers = meters/1000
          const fixedKilometers = kilometers.toFixed(2)
          const sql = `INSERT INTO kmApp.dev_done_distances (kilometers,steps, who, activity_type, date_created) VALUES ('${kilometers}','0','${req.body.who}','${req.body.activity_type}', '${currentDate}')`
      con.query(sql, function (err,result) {
        if (err) throw err;
        axios.post(process.env.DEVSLACKAPP, {
          text: req.body.who + " just added " +  fixedKilometers +"Kms " +"! We are closer to our goal, yaay!:tada:"
        }).then(res.send())
        });
        console.log(`${req.body.who} has added ${kilometers}Kms of ${activity} on ${currentDate}`)
    }

    else if (activity === "Walk") {
      const steps = parseInt(req.body.steps,10)
      const kilometers = (steps*0.62/1000)
      const fixedKilometers = kilometers.toFixed(2)
      const sql = `INSERT INTO kmApp.dev_done_distances (kilometers, steps, who, activity_type, date_created) VALUES ('${kilometers}','${steps}','${req.body.who}','${req.body.activity_type}', '${currentDate}')`
      con.query( sql, function (err,result) {
        if (err) throw err;
        axios.post(process.env.DEVSLACKAPP, {
          text: req.body.who + " just added " + fixedKilometers +"Kms " +"! We are closer to our goal, yaay!:tada:"
        }).then(res.send())
        })
        console.log(`${req.body.who} has added ${kilometers}Kms of ${activity} on ${currentDate}`)
    }
  } else (res.json({
    message: "You are not permitted to use this API"
  }))







 })

app.post('/api/getuserdata', (req,res) => {

  const email = req.body.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    const user1 = req.body.user
    const sql = `SELECT id,kilometers,steps,who,activity_type,date_created , (select SUM(d2.kilometers) from dev_done_distances d2 where who="${user1}")sumkilometer from dev_done_distances WHERE who = "${user1}"`


    con.query(sql, function(err,result){
      if(err) throw(err);
      res.send(result)
      res.status(200);
    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))




})


//Upload picture from Form to img folder
app.post('/api/upload', (req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    upload(req, res, function (err) {

      if (err instanceof multer.MulterError) {
          return res.status(500).json(err)
      } else if (err) {
          return res.status(500).json(err)
      }

  return res.status(200).send(req.file)

  })
name.push(req.query.user)
setTimeout(function(){
  name.length=0
}, 1000)
  }
  else (res.json({
    message: "You are not permitted to use this API"
  }))


})

app.delete("/api/distance", (req,res) => {
  const email = req.query.email
  const who = req.query.who
  const id = req.query.id
  const kilometers = req.query.distance
  const activity_type = req.query.mode
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)


  if(isBn > -1 || isWs > -1){
      if(who && id && kilometers && activity_type) {
        const sql = `DELETE FROM dev_done_distances WHERE id=${id} AND who="${who}"`
con.query(sql, function(err,result){
    if(err) res.status(500);
  res.status(200);
  console.log(`${who} has deleted his/her ${activity_type} entry with the amount of ${kilometers}Kms `)
  res.send()
})
      } else (
        res.status(403),
        res.json({
        message: "You are not permitted to use this API or information is missing!"

      })
      )
  }
})



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
