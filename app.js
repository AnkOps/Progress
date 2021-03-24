require('dotenv').config()
var $ = require('jquery')
const express= require("express");
const bodyParser=require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app=express();
const date=require(__dirname + "/date.js");

// const encrypt = require("mongoose-encryption");

var arr=[];

app.use(express.static("public"));
mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://localhost:27017/PROgressDB", { useUnifiedTopology: true }, {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

//fetch environment variables
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

//initialize passport and passport session
app.use(passport.initialize());
app.use(passport.session());



//mongoose schema for users

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstname: String,
  lastname: String,
  privilege: String


});
//mongoose schema for taskAssigned
const taskSchema = new mongoose.Schema({
  partner: String,
  clientName: String,
  employeeAssigned: String,
  deadline: String,
  date: String,
  task: String,
  remarks: String,
  status: String
});

const task = new mongoose.model("task", taskSchema);

//use middleware passport-local-mongoose (npm module)
userSchema.plugin(passportLocalMongoose);



const User = new mongoose.model("User", userSchema);

const clientSchema = new mongoose.Schema({
  companyName: String,
  ownerName: String,
  phoneNumber: String,
  email: String,
  password: String,
  address: String,
  city: String,
  state: String,
  pinCode: Number,
  gst: String


});



const client = new mongoose.model("client", clientSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/users/" + req.user.id)
  }
  else{
    res.render("home");

  }
});



app.get("/login", function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/users/" + req.user.id);
  }
  else{
  res.render("login");
}
});

app.get("/register", function(req, res){
  res.render("register");
});

// db.clients.find(funtion(err, foundClient){
//   arr.pushback(foundClient)
// })

//sending clientList as array
app.get("/users/:name", function(req, res){
  if(req.isAuthenticated()){

    if(req.user.privilege==="admin"){
      client.find({}, function(err,foundUser){
        if(err){
          throw err;
        }
        else{
        for (var i=0; i<foundUser.length;i++){
          arr.push(foundUser[i].companyName);


        }}
        res.render("partner", {name: req.user.firstname, arr: foundUser});
      });
      console.log(arr[0]);


    }
    else{
      res.render("employee", {name:req.user.firstname});
    }
  }
})


//client portal
app.get("/clients/:name", function(req,res){
  if(req.isAuthenticated()){

    if(req.user.privilege==="admin"){

      var companyId = req.params.name;


      client.findById(companyId,function(err,company){

        User.find({privilege: "emp"}, function(req, foundEmployee){
            client.findById(companyId, function(req, foundClient){


              task.find({clientName: foundClient.companyName}, function(req,foundTask){

                res.render("clientAdmin", {company: company, empList: foundEmployee, taskList:foundTask});
              })
            })

        })

      });


    }
    else{
      res.render("clientEmp");
    }
  }
})

//logout route
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});





//register a new client
app.get("/register-client", function(req,res){
  res.render("register-client");
})


//Login route
app.post("/login",

    // const user = new User({
    //   username: req.body.username,
    //   password: req.body.password
    // });


    // req.login(user, function(err){




        passport.authenticate("local", { failureRedirect: '/login' }),
        function(req, res){
          User.findById(req.user.id,function(error, foundUser){
            if(foundUser.privilege=== "admin"){

              res.redirect("/users/" + req.user.id);
            }
            else{
              if(foundUser.privilege=== "emp"){
                res.redirect("/users/" + req.user.id);
              }
              else{
                res.send("User privilege not found. Please contact admin.");
              }
            }

          });
        })



      // });

    //   else{
    //
    //     console.log(err);
    //     res.redirect("/logout")
    //
    // };

  // });

  var emp="";



//register task to employees
app.post("/register-task", function(req,res){

  User.findById(req.body.empId, function(err, foundUser){
    emp=foundUser.firstname+" "+foundUser.lastname;
    console.log(emp);
    console.log(foundUser);
  });
console.log(emp);
  const addTask = new task({
    partner: req.user.id,
    clientName: req.body.clientName,
    employeeAssigned: emp,
    deadline: req.body.deadline,
    date: date.getDate(),
    task: req.body.task,
    remarks: req.body.remarks,
    status: "Incomplete"
  })
  addTask.save(function(){
    res.render("success");
  });
})

app.post("/register-lvl2", function(req,res){
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
      res.redirect("/login");

    }
    else{
      if(foundUser){
        foundUser.firstname = req.body.firstName;
        foundUser.lastname = req.body.lastName;
        foundUser.privilege=req.body.privilege;
        foundUser.save(function(){
          res.render("success");
        })
      }
    }
  })
});





app.post("/register", function(req,res){
User.register({username: req.body.username }, req.body.password, function(err, user){
  if(err) {
    console.log(err);
    res.redirect("/register");
  }
  else{
    passport.authenticate("local")(req, res, function(){
      res.render("register-lvl2");
    });
  }
});


});
app.get("/register-client", function(req,res){
  res.render("register-client");
})

app.post("/register-client", function(req,res){
  const addClient = new client({
    companyName: req.body.companyName,
    ownerName: req.body.ownerName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode,
    gst: req.body.gst

  });
  addClient.save();
  res.render("success");

})



app.get("/register-client", function(req, res){

    res.render("register-client");
});








app.post("/register-client", function(req,res){
  const addClient = new client({
    companyName: req.body.companyName,
    ownerName: req.body.ownerName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode,
    gst: req.body.gst

  });
  addClient.save();
  res.render("success");

})

app.listen(process.env.PORT || 3000, function(){
  console.log("Server running at port 3000");
})
