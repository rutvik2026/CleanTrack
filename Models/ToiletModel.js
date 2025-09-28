const mongoose=require("mongoose");

const ToiletSchema = new mongoose.Schema({

  gasValue: Number,
  cleanerEmail:{
    type:String,
    required:[true,"cleaner email is required"]
  },
  adminEmail:{
    type:String,
    required:[true,"admin email is required"]
  },
  status:{
    type:String,
  },
  timestamp: { type: Date, default: Date.now }
});

const cleanerSchema=new mongoose.Schema({
  email:{
    type:String,
    required:[true,"email of cleaner is required"]
  },
  name:{
    type:String,
    required:[true,"name of cleaner is required"]
  },

  password:{
    type:String,
    required:[true,"password of cleaner is required"]
  },
  role:{
    type:String,
    required:[true,"role of admin is required"]
  },
  toilets:[{ type: mongoose.Schema.Types.ObjectId, ref: "ToiletModel" }]

})
const adminSchema=new mongoose.Schema({
  email:{
    type:String,
    required:[true,"email of admin is required"]
  },
  password:{
    type:String,
    required:[true,"password od admin is required"]
  },
  name:{
    type:String,
    required:[true,"name of admin is required"]
  },
  role:{
    type:String,
    required:[true,"role of admin is required"]
  },
  toilets:[{ type: mongoose.Schema.Types.ObjectId, ref: "ToiletModel" }]

})
const AdminModel=mongoose.model("AdminModel",adminSchema);
const CleanerModel=mongoose.model("CleanerModel",cleanerSchema);
const ToiletModel = mongoose.model("ToiletModel", ToiletSchema);

module.exports={
    ToiletModel,
    AdminModel,
    CleanerModel,
};
