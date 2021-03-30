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

var name = [] // Needed for picture upload name
var randomText = [] // Needed for random Slack message
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
    const sql = 'SELECT * from dev_done_distances  ORDER BY 6 DESC LIMIT 10'
    con.query(sql, function(err,result) {
      if(err) throw err;
      res.send(result);

    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))




})

//Get All distance without being filtered
app.get('/api/getalldistance/overall', (req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    const sql = 'SELECT * from dev_done_distances  ORDER BY 6 DESC'
    con.query(sql, function(err,result) {
      if(err) throw err;
      res.send(result);

    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))




})

//GET TOP PERFORMER
app.get('/api/monthlytracker/topperformer', (req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    const sql = 'SELECT SUM(kilometers) as kilometers,who  FROM dev_done_distances WHERE MONTH(date_created) = MONTH(CURRENT_DATE()) GROUP BY who ORDER BY 1 DESC LIMIT 1'
    con.query(sql, function(err,result) {
      if(err) throw err;

      res.send(result)

    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))
})

//GET SUM OF ACTIVITY_TYPES FOR CURRENT MONTH
app.get('/api/monthlytracker/sumactivity', (req,res) => {
  const email = req.query.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)
  if(isBn > -1 || isWs > -1 ){
    const sql = 'SELECT ROW_NUMBER() OVER (ORDER BY SUM(kilometers) DESC )row_num, SUM(kilometers) as sumActivity,activity_type, id FROM dev_done_distances WHERE MONTH(date_created) = MONTH(CURRENT_DATE()) GROUP BY activity_type'
    con.query(sql, function(err,result) {
      if(err) throw err;

      res.send(result)

    })
  } else (res.json({
    message: "You are not permitted to use this API"
  }))
})

// POST REQUESTS //


//Insert data from Form
app.post("/api/distance", (req,res) => {
  const email = req.body.email
  const isBn = email.indexOf(process.env.BNEMAIL)
  const isWs = email.indexOf (process.env.WSEMAIL)


  if(isBn > -1 || isWs > -1 ){

    con.connect(function(err) {
      if(err) throw err;

    });
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const currentDate = date +" "+time
    const activity = req.body.activity_type
    const who = req.body.who
    const kms = (parseInt(req.body.meters,10)/1000)
    /// RANDOM SLACK MESSAGE ///
    const randomNumber = Math.round(Math.random(4))
    if(randomNumber === 0) {randomText.push(`Nice job ${who}! With your ${kms}kms we are closer to our goal!`)}
    else if (randomNumber === 1) {randomText.push(`${kms} kms! Good going, ${who} you are truly a champ! Keep up the great work.`)}
    else if (randomNumber === 2) {randomText.push(`${who} you just did ${kms} kms, that is more than 0, right? Every steps counts!`)}
    else if (randomNumber === 3) {randomText.push(`You went for a ${activity_type} today, huh? You did ${kms} kms , so you are definitely not a couchpotato! Keep going!`)}
    /////RANDOM SLACK MESSAGE END /////

    if( activity === "Run" || activity === "Bike" || activity === "Roller Skates" ) {

          const meters = parseInt(req.body.meters,10)
          const kilometers = meters/1000
          const fixedKilometers = kilometers.toFixed(2)


          const sql = `INSERT INTO kmApp.dev_done_distances (kilometers,steps, who, activity_type, date_created) VALUES ('${kilometers}','0','${who}','${req.body.activity_type}', '${currentDate}')`
      con.query(sql, function (err,result) {
        if (err) throw err;
        axios.post(process.env.DEVSLACKAPP, {
          text : randomText[0]
        }).then(res.send())
        });
        console.log(`${req.body.who} has added ${kilometers}Kms of ${activity} on ${currentDate}`)
        setTimeout(() => {randomText.length=0},1000)
    }

    else if (activity === "Walk") {
      const steps = parseInt(req.body.steps,10)
      const currentKms = parseInt(req.body.currentKms,10)
      const kilometers = (steps*0.62/1000)
      const fixedKilometers = kilometers.toFixed(2)
      const kmAfterUpload = (currentKms+kilometers)

      const sql = `INSERT INTO kmApp.dev_done_distances (kilometers, steps, who, activity_type, date_created,overall_km_after_upload) VALUES ('${kilometers}','${steps}','${req.body.who}','${req.body.activity_type}', '${currentDate}', '${kmAfterUpload}')`
      con.query( sql, function (err,result) {
        if (err) throw err;
        axios.post(process.env.DEVSLACKAPP, {
          text: randomText[0]
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



const PORT = process.env.PORT || 8100;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
