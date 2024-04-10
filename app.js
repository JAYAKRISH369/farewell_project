import express from "express";
// import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import {fileURLToPath} from 'url';
import {dirname} from "path";
import bodyparser from "body-parser";
import {MongoClient} from "mongodb";
// import routes from "./routes.js";
import nodemailer from "nodemailer"
// import {v4 as uuidv4}from "uuid";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();
const app=express();
const __filename=fileURLToPath(import.meta.url);
const __dirname =dirname (__filename);
const port=process.env.PORT||3000;
const uri=process.env.MONGO_URL;
const dbName="farewell";
const collectionName='students';

app.use(cors({
origin:['file:///D:/programing%20files/html%20programs/test-farewell.html'],
credentials:true,
}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://your-domain.com'); // Replace with your domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// mongoose.connect('mongodb://localhost:27017/farewell')
// .then(()=>console.log('connected to mongoDB message'))
// .catch(err=> console.error("Error connecting to mongoDB: message",err));

// app.use('/',routes);

app.get("/",(req,res)=>{
  res.render("main");
});

app.get("/Student-login",(req,res)=>{
res.render("student_login");
});

app.get("/Student-register",(req,res)=>{
  res.render("student_register");
  });

app.post("/student-register",async (req,res)=>{
   if(req.body && req.body.rollnumber&& req.body.key){
     const rollNumber=req.body.rollnumber;
     const passkey=req.body.key;
     try{
      const client=new MongoClient(uri);
      await client.connect().then(()=>console.log("connected")).catch(()=>console.log("error in connecting the database"));
      const db=client.db(dbName);
      const collection=db.collection(collectionName);
      const user=await collection.findOne({rollno: rollNumber});
     if(user){
     if(user.passkey==passkey){
      res.render("reset_password",{rollnumber:req.body.rollnumber});
     }
     else{
      res.status(404).send("Incorrect passkey");
     }
     }
     else{
res.status(404).send("user not found");
     }
     client.close();
   }
  
   catch(error){
    res.status(500).send('Internal server Error');
   }
   }
   else{
    res.status(400).send("ROLL NUMBER AND KEY WAS NOT ENTERED CORRECTLY..");
   }
});

// Function to validate email format
function isValidEmail(email){
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.post("/reset-password",(req,res)=>{
  const email=req.body.mail;
  const rollnumber=req.body.rollnumber;
  console.log("protocol: ",req.protocol);
  console.log("host: ",req.get('host'));
  if(!email){
    return res.status(400).json({error: "email is required"});
  }
  if(!isValidEmail(email)){
    return res.status(400).json({error: "Invalid email format"});
  }

  //generate verification token
  // const verificationToken = uuidv4();
  // console.log("verificationToken: ",verificationToken);
  //Create email transproter

  function generatePassKey(){
    return Math.floor(Math.random()*9000)+1000;
  }
  const randomPassKey=generatePassKey();

  const transporter= nodemailer.createTransport({
    service:'gmail',
    // host:"smtp.gmail.com",
    // port:587,
    // secure:false,
    auth:{
      user:process.env.USER,
      pass:process.env.APP_PASSWORD
    }
  });

  //compose email
  const mailOptions={
    from:'kdevelop499@gmail.com',
    to: email,
    subject:"Email Verification (Farewell Party)",
    text: `
    pass key: ${randomPassKey}
    Please click on the following link to verify your email: ${req.protocol}://${req.get('host')}/verify?token=${randomPassKey}&email=${email}&rollnumber=${rollnumber}`
  };
  //send email
  transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
      console.error("Error sending verification email:",error);
      return res.status(500).json({error:'Failed to send verification email'});
    }
    console.log("verification email sent:",info.response);
    return res.status(200).json({message: "verification email sent"});
  });
});

app.get("/verify",async(req,res)=>{
  console.log(req.query.email);
  const email=req.query.email;
  const rollnumber=req.query.rollnumber;
  const token= req.query.token;
  if(email){
    const client=new MongoClient(uri);
      await client.connect().then(()=>console.log("connected")).catch(()=>console.log("error in connecting the database"));
      const db=client.db(dbName);
      const collection=db.collection(collectionName);
      const user=await collection.findOne({rollno: rollnumber});
      if(user){
         await collection.updateOne({rollno:rollnumber},{
          $set:{
            email: email
          },
          $currentDate:{lastUpdated:true}
         });
      }
      else{
        res.status(404).send("User Not found");
      }
      client.close();
  }
res.render('verify-passkey',{email:email, token:token, rollnumber:rollnumber});
});

app.post("/verify",(req,res)=>{
  const token =req.body.token;
  const email=req.body.email;
  const rollnumber=req.body.rollnumber;
  const passkey=req.body.verificationToken;
console.log("token: ",token);
console.log("passKey: ",passkey);
  if(token === passkey ){
    res.render("password-entry",{email:email,rollnumber:rollnumber});
  }
  else{
    res.render("verify-passkey",{error:"Invalid passkey"});
  }

});

app.post("/password-entry",async(req,res)=>{
  const rollnumber=req.body.rollnumber;
if(req.body.pass1 && req.body.pass2){
  if(req.body.pass1===req.body.pass2){
    const hashedPassword=await bcrypt.hash(req.body.pass1,10);
    const client=new MongoClient(uri);
      await client.connect().then(()=>console.log("connected")).catch(()=>console.log("error in connecting the database"));
      const db=client.db(dbName);
      const collection=db.collection(collectionName);
      await collection.updateOne({rollno:rollnumber},{
        $set:{
          password: hashedPassword
        },
        $currentDate:{lastUpdated:true}
       }).then(()=>{res.render("student_login");}).catch(()=>{return res.status(404).send("problem while saving the New-Password");})
  client.close();
      }
}
else{
  return res.status(400).json({error:'new password and re-enter password does not match..'});
}
});

app.post("/Farewell-party",async(req,res)=>{
  const rollnumber=req.body.rollnumber;
  const email=req.body.email;
  const password=req.body.password;
  console.log(rollnumber);
  console.log(email);
  console.log(password);
  const client=new MongoClient(uri);
      await client.connect().then(()=>console.log("connected")).catch(()=>console.log("error in connecting the database"));
      const db=client.db(dbName);
      const collection=db.collection(collectionName);
      const user= await collection.findOne({rollno:rollnumber,email:email});
      if(user){ 
        const passwordMatch=await bcrypt.compare(password,user.password);
        if(passwordMatch){
        // res.render("Farewell-party",{rollno:rollnumber,name:user.name});
        res.redirect(`https://mlmanage.netlify.app?rollno:${rollnumber},name:${user.name}`);
        }
        else{
          return res.status(404).send("password don't mathc");
        }
      }
      else{
        return res.status(404).send("user not found...")
      }
      client.close();
});

app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})