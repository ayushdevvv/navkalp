const m=require('mongoose');module.exports=m.model('EmergencyContact',new m.Schema({category:String,name:String,phone:String,district:String,isDemo:Boolean},{timestamps:true}));
