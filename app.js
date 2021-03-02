require('dotenv').config()
const express= require("express");
const bodyParser=require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app=express();

// const encrypt = require("mongoose-encryption");
// const secret = "thisisasecretwritteninplainenglish";


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


//use middleware passport-local-mongoose (npm module)

userSchema.plugin(passportLocalMongoose);



const User = new mongoose.model("User", userSchema);



passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/" + req.user.id)
  }
  else{
    res.render("home");

  }
});

app.get("/login", function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/" + req.user.id);
  }
  else{
  res.render("login");
}
});

app.get("/register", function(req, res){
  res.render("register");
});





app.get("/:name", function(req, res){
  if(req.isAuthenticated()){
    if(req.user.privilege==="admin"){
      res.render("partner", {name: req.user.firstname});
    }
    else{
      res.render("employee", {name:req.user.firstname});
    }
  }
})


//Login route
app.post("/login", function(req,res){





    const user = new User({
      username: req.body.username,
      password: req.body.password
    });


    req.login(user, function(err){


      if(!err) {
        passport.authenticate("local")(req, res, function(){
          User.findById(req.user.id,function(err, foundUser){
            if(foundUser.privilege== "admin"){
              res.redirect("/" + req.user.id);
            }
            else{
              if(foundUser.privilege=== "emp"){
                res.redirect("/" + req.user.id);
              }
              else{
                res.send("User privilege not found. Please contact admin.");
              }
            }

          });

      });
    }
      else{
        console.log(err);
    };

  });

});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  } else{
    res.redirect("/login");
  }
});

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

app.listen(process.env.PORT || 3000, function(){
  console.log("Server running at port 3000");
})
