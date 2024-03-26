import express from "express";
import mongoose from "mongoose";
const app=express();

const routes=require ('./routes');
mongoose.connect('mongoose://localhost:27017/farewell',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=>console.log('connected to mongoDB'))
.catch(err=> console.error("Error connecting to mongoDB:",err));

app.use(express.json());

app.use('/',routes);

const port=3000;
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})