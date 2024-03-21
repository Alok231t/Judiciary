const express=require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');
const bcrypt=require('bcrypt');
const port = 3000;

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

const SECRET_KEY="secret";

const app=express();
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const Case=require('./models/case');
const User=require('./models/user');
const Session = require('./models/session');
const { request } = require('http');

mongoose.connect("mongodb+srv://alokpriydarshi767:zRiH3Vry9EXU5HKx@cluster0.vpte6vz.mongodb.net/").then(()=>{
    console.log("db connected");
})

var loggedinusername="";

localStorage.setItem('loggedby',"");


app.get('/',async(req,res)=>{
    console.log(req.body);
    console.log("requested home")
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    loggedinusername=localStorage.getItem('loggedby');
    const current=await User.findOne({username:loggedinusername});
    const lawer=false;
   console.log(current);
   console.log("home page");
   const cur=await Case.find();
   if(current.isLawer || current.isJudge){
    console.log(current.due);
    console.log(1);
    console.log(cur);
    console.log(current.due);
    res.render("lawer",{cur:cur,due:current.due,current:current});
   }
   else{
    console.log(2);
    res.render("home",{lawer:lawer,current:current});
   }
})

app.get("/about",(req,res)=>{
    res.render("about",{current:localStorage.getItem('loggedby')});
})

app.get('/pastcases', async(req,res)=>{
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    const current=await User.findOne({username:localStorage.getItem('loggedby')});
    const cur=await Case.find({closed:true});
    console.log(cur);
    res.render("cases",{cur:cur,current:current});
})

app.get('/activecases', async(req,res)=>{
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    const current=await User.findOne({username:localStorage.getItem('loggedby')});
    const cur=await Case.find({closed:false});
    var cases=[];
    for(let i=0;i<cur.length;i++){
        var today=new Date();
        if(cur[i].dateOfHearing.getDate()==today.getDate() && cur[i].dateOfHearing.getMonth()==today.getMonth() &&
        cur[i].dateOfHearing.getYear()==today.getYear())
        {
            cases.push(cur[i]);
        }
    }
    res.render("cases",{cur:cases,current:current});
})

app.get('/upcomingcases',async(req,res)=>{
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    const cur=await Case.find({closed:false});
    var cases=[];
    const current=await User.findOne({username:localStorage.getItem('loggedby')});
    for(let i=0;i<cur.length;i++){
        var today=new Date();
        if(cur[i].dateOfHearing.getDate()==today.getDate() && cur[i].dateOfHearing.getMonth()==today.getMonth() &&
        cur[i].dateOfHearing.getYear()==today.getYear())
        {
           console.log("today case");
          continue;
        }
        else {
            cases.push(cur[i]);
        }
    }
    res.render("cases",{cur:cases,current:current});
})

app.get('/allcases',async(req,res)=>{
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    const current=await User.findOne({username:localStorage.getItem('loggedby')});
    const cur=await Case.find();
    res.render("cases",{cur:cur,current:current});
})

app.get('/addcase', async(req,res)=>{
    loggedinusername=localStorage.getItem('loggedby');
    if(localStorage.getItem('loggedby')==""){
        return res.redirect('/signin');
    }
    const exist=await User.findOne({username:loggedinusername});
    if(exist.isRegistrer==false){
        return res.redirect('/');
    }
    console.log(localStorage.getItem('loggedby'));
    if(localStorage.getItem('loggedby')==""){
       return res.redirect('/signin');
    }
    res.render("addcase",{error:""});
})

app.get('/signin',(req,res)=>{
    if(localStorage.getItem('loggedby')!=""){
        return res.redirect('/');
    }
    res.render("signin",{error:""});
})

app.get('/signup',(req,res)=>{
    if(localStorage.getItem('loggedby')!=""){
        return res.redirect('/');
    }
    res.render("signup",{errors:""});
})

app.post('/signup',async(req,res)=>{
    const { email, username,secretkey, password, confirmPassword } = req.body;

    console.log(req.body);
    console.log(email.substring(email.length-10,email.length));
    var errors=[];
    if (!username || !email || !secretkey || !confirmPassword || !password) {
        errors.push("Please Enter all Fields")
        console.log(errors);
        res.render('signup',{errors:errors});
    }
    else if(email.substring(email.length-10,email.length)!="@gmail.com" && email.substring(email.length-10,email.length)!="@yahoo.com" && email.substring(email.length-13,email.length)!="@iitism.ac.in" && email.substring(email.length-12,email.length)!="@outlook.com"){
        errors.push("Enter a valid email address");
        console.log(errors);
        res.render('signup',{errors:errors});
    }
    else if(secretkey!=SECRET_KEY){
        errors.push("Enter a valid Secret Key");
        console.log(errors);
        res.render('signup',{errors:errors});
    }
    else if (password != confirmPassword) {
        errors.push("Password and Confirm password doesn't match");
        console.log(errors);
        res.render('signup',{errors:errors});
    }
    else if (password.length < 6) {
        errors.push("Password must contain minimum 6 characters");
        console.log(errors);
        res.render('signup',{errors:errors});
    }
    else {
        try {
            const newuser = new User({ email, username,password });
            const exist=await User.findOne({email});
            if(!exist) {
                newuser.save();
                console.log("user registered");
                res.redirect('/signin');
            }
            else {
                console.log("failed");
                res.redirect('/signup');
            } 
        } catch (e) {
            console.log(e.message);
            res.redirect('/signup');
        }
    }
})

app.post('/signin', async(req,res)=>{
    console.log("check");
    const { username, password } = req.body;
    loggedinusername=req.body.username;
    console.log(loggedinusername);
    const exist=await User.findOne({username});
    if(!exist){
        console.log('User not found');
        res.render('signin',{error:"User Doesn't Exist"});
    }
    else if(exist.password!=password){
        console.log('Password incorrect');
        res.render('signin',{error:"Incorrect Password"});
    }
    else {
        localStorage.setItem('loggedby',req.body.username);
        console.log(localStorage.getItem('loggedby'));
        console.log("ok")
        res.redirect("/");
    }
})

app.get('/signout',(req,res)=>{
    localStorage.setItem('loggedby',"");
    loggedinusername = "";
    res.redirect('/signin');
})



app.post('/addcase', async (req,res)=>{
    
   const {caseTitle,defendantName,defendantAddress,crimeType,committedDate,committedLocation,arrestingOfficer,dateOfArrest,presidingJudge,publicProsecutor,dateOfHearing,completionDate} = req.body;
   if(!caseTitle || !defendantName || !defendantAddress || !crimeType || !committedDate || !committedLocation || !arrestingOfficer || !dateOfArrest || !presidingJudge || !publicProsecutor || !dateOfHearing || !completionDate)
   {
      return res.render("addcase",{error:"Please Enter All Fields"})
   }
   console.log("hi");
   const today=new Date();
   console.log(today);
   console.log(committedDate);
   var td,tm;
   tm=today.getMonth()+1;
   if(today.getDate()<10) td = "0"+today.getDate();
   else td=today.getDate();
   if(tm<10) tm="0"+tm;
   else tm=today.getMonth();
   const todaysdate=""+today.getFullYear()+"-"+tm+"-"+td;
   console.log(todaysdate);
   if(committedDate>todaysdate){
    return res.render("addcase",{error:"Committed Date of Case Can't be in Future"});
   }
   if(dateOfArrest>todaysdate){
    return res.render("addcase",{error:"Date of Arrest Can't be in Future"});
   }
   if(dateOfArrest<committedDate){
    return res.render("addcase",{error:"Date of Arrest Can't be Earlier than Committed Date of Case"});
   }
   if(dateOfHearing<todaysdate){
    return res.render("addcase",{error:"Date of Hearing Can't be in Past"});
   }
   if(completionDate<todaysdate){
    return res.render("addcase",{error:"Expected Completion Date Can't be in Future"});
   }
   const db=await Case.find();
   const CIN=db.length+1;
   const newcase=new Case({
    caseTitle:caseTitle,
    defendantName:defendantName,
    defendantAddress:defendantAddress,
    crimeType:crimeType,
    committedDate:committedDate,
    committedLocation:committedLocation,
    arrestingOfficer:arrestingOfficer,
    dateOfArrest:dateOfArrest,
    presidingJudge:presidingJudge,
    publicProsecutor:publicProsecutor,
    dateOfHearing:dateOfHearing,
    completionDate:completionDate,
    CIN:CIN,
    closed:false
   });
   await newcase.save();
   console.log(newcase.committedDate);
   res.redirect('/');
})

app.get('/case/:id', async (req, res) => {
     console.log("ok");
    if(localStorage.getItem('loggedby')==""){
        return res.redirect('/signin');
    }
    loggedinusername=localStorage.getItem('loggedby');
    console.log(loggedinusername);
    const exist=await User.findOne({username:loggedinusername});
    var isRegistrer=true;
    if(exist.isRegistrer==false){
         isRegistrer=false;
    }
    if(exist.isLawer==true){
        console.log("hi");
        exist.due+=5;
        await exist.save();
    }
    const {id} = req.params;
    const currCase = await Case.findById(id).populate('sessions');
    console.log(currCase);
    // return res.send(currCase);
    return res.render('casedetails', {currCase:currCase,isRegistrer:isRegistrer,current:exist});

})

app.post('/case/:id/addSession', async (req, res) => {
    const id = req.params.id;
    const currCase = await Case.findById(id);
    if(currCase.closed===true) console.log('Case already closed');
    const {attendingJudge, summary, nextHearingDate} = req.body;
    const newSession = new Session({attendingJudge, summary, nextHearingDate});
    await newSession.save();
    currCase.sessions.push(newSession.id);
    await currCase.save();    
    return res.redirect('/');
})

app.post('/case/:id/closeCase',async(req,res)=>{
    const id=req.params.id;
    const curcase=await Case.findById(id);
    curcase.closed=true;
    await curcase.save();
    return res.redirect('/');
})

app.post('/addjudge',async(req,res)=>{
    console.log("ok");
    console.log(req.body);
    const {emailJudge,userNameJudge,passwordJudge}=req.body;
    const exist=await User.findOne({username:userNameJudge});
    console.log(exist);
    if(!exist) {
        const newuser= new User({
            email:emailJudge,
            username: userNameJudge,
            password: passwordJudge,
            isRegistrer:false,
            isJudge:true,
            isLawer:false,
            due:0
        })
        await newuser.save();
    }
    res.redirect('/');
})

app.post('/addlawer',async(req,res)=>{
    console.log("ok");
    console.log(req.body);
    const {emailLawyer,userNameLawyer,passwordLawyer}=req.body;
    const exist=await User.findOne({username:userNameLawyer});
    console.log(exist);
    console.log("need to be added");
    if(!exist) {
        console.log("need to be added");
        const newuser= new User({
            email:emailLawyer,
            username: userNameLawyer,
            password: passwordLawyer,
            isRegistrer:false,
            isJudge:false,
            isLawer:true,
            due:0
        })
        await newuser.save();
    }
    res.redirect('/');
})


app.use("*", (req, res) => {
    res.send("page not found");
})


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
  });




/* 

     <div class="top_side">
        <div class="input-group">
            <div class="form-outline" id="searchWrapper" style="display: flex;flex-direction: row;">
                <input type="search" class="form-control mb-auto mt-auto" name="searchBar" id="searchBar"
                    placeholder="Search" style="height: 40px; border-right: none;" />
                <label class="form-label my-2 btn btn-primary" for="searchBar"><i class="fas fa-search"></i></label>
            </div>
        </div>
    </div>


    <div class="container">
        <div class="row mb-4 mt-3" id="list" style="justify-content: center;">
            <% for(let u of users){ %>
                <% if(u.id===currentUser.id) { %>
                    <% continue; %>
                        <% } %>
                            <div class="card col-md-5 col-lg-3 col-11 mx-2 my-2">
                                <img class="card-img-top p_pic ms-auto me-auto py-2" src="<%=u.profilePicUrl%>"
                                    alt="Card image cap" style="border-radius:50%">
                                <div class="card-body">
                                    <div class="follow_unfollow">
                                        <a href="/friends/view/<%= u._id %>"
                                            style="text-decoration: none; color: rgba(12, 12, 12, 0.925);">
                                            <h5 class="card-title ">
                                                <%= u.name %>
                                            </h5>
                                        </a>
                                        <% if(currentUser.following.indexOf(u.id)===-1){ %>
                                            <form action="/friends/add/<%= currentUser.id%>/<%= u.id %>" method="post">
                                                <button type="submit" class="btn btn-link " style="font-weight: 540; ">
                                                    Follow
                                                </button>
                                            </form>
                                            <% }else{ %>
                                                <form action="/friends/remove/<%= currentUser.id%>/<%= u.id %>"
                                                    method="post">
                                                    <button type="submit" class="btn text-danger btn-link"
                                                        style="font-weight: 540; ">
                                                        Unfollow
                                                    </button>
                                                </form>
                                                <% } %>
                                    </div>
                                    <h6 class="card-text text-muted" style="line-height: 17px;">
                                        <%= u.email %>
                                    </h6>
                                    <h6>Following: <%= u.following.length %> Users</h6>
                                    <!-- <a href="/friends/view/<%#= u._id %>" class="btn btn-outline-secondary">View</a> -->

                                </div>
                            </div>
                            <% } %>
        </div>
    </div>


    <!-- <a href="/<%= currentUser.id %>/friends">Friends</a> -->


    <script>
        const listOfUsers = <%- JSON.stringify(users) %>;
        const currUser = <%- JSON.stringify(currentUser) %>;
    </script>

    <script>
        var root = document.getElementById('list');
        const searchBar = document.getElementById('searchBar');

        searchBar.addEventListener('keyup', (e) => {
            const searchString = e.target.value.toLowerCase();
            const searchResults = listOfUsers.filter((character) => {
                return (
                    character.name.toLowerCase().includes(searchString) ||
                    character.email.toLowerCase().includes(searchString)
                );
            });
            // console.log( searchResults);
            displayCharacters(searchResults);
        })

        const displayCharacters = (characters) => {
            if (characters.length === 0) {
                root.innerHTML = `
                <div class="py-3">
                    <h3>No results have been found &#9785;</h3>
                </div>`;
                return 0;
            };
            const htmlString = characters
                .map((character) => {
                    var u = character;

                    return `<div class="card col-md-5 col-lg-3 col-11 mx-2 my-2" >
                                <img class="card-img-top p_pic ms-auto me-auto py-2" src="${u.profilePicUrl}"
                                    alt="Card image cap" style="border-radius:50%">
                                <div class="card-body">
                                    <div class="follow_unfollow">
                                        <a href="/friends/view/${u._id}"
                                            style="text-decoration: none; color: rgba(12, 12, 12, 0.925);">
                                            <h5 class="card-title ">
                                                ${u.name}
                                            </h5>
                                        </a>
                                      
                                    </div>
                                    <h6 class="card-text text-muted" style="line-height: 17px;">
                                        ${u.email}
                                    </h6>
                                    <h6>Following: ${u.following.length} Users</h6>
                                </div>
                            </div>`
                })
                .join('');
            root.innerHTML = htmlString;
        };
    </script>

*/