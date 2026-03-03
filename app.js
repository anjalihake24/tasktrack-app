const express = require('express');
const app = express();
const path = require('path')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userModel = require("./models/user")
const postModel = require("./models/post")


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

//////----------Registeration user--------------//
app.get('/', (req, res) => {
    res.render("index")
})

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body

    let user = await userModel.findOne({ email })
    if (user) return res.status(400).send("user already registered")   // ✅ 500→400

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {

            let users = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            })

            const token = jwt.sign(
              { email: email, userid: users._id },   // ✅ correct id
              "suga"
            );

            res.cookie("token", token);              // ✅ cookie method correct
            res.send("registered")

        });
    });
})

//////--------Log in----------------//

// ❌ middleware removed here
app.get('/login', (req, res) => {
    res.render("login")
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body

    if(!email || !password) return res.status(400).send("email and password required")  // ✅ better error handling

    let user = await userModel.findOne({ email })
    if (!user) return res.status(400).send("user not found")

    bcrypt.compare(password, user.password, function(err, result){
        if(result){

            const token = jwt.sign(                 // ✅ token variable added
              { email: email, userid: user._id },
              "suga"
            );

            res.cookie("token", token);            // ❌ cookies → cookie
            return res.redirect("/profile");       // ✅ redirect added
        } 
        else {
            return res.redirect("/register");
        }
    })
})






////------------Profile Rout--------------//

// app.get('/profile', isLoggedIn, async (req, res) => {
//     let user = await userModel.findOne({email:req.user.email})
   
//     res.render("profile" , {user})
// })



// ---------- PROFILE ROUTE ----------
app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("posts");

   
    res.render("profile", { user });
});

////////----llikes---------//////
app.get('/like/:id', isLoggedIn, async (req, res) => {

    let post = await postModel.findById(req.params.id);

    if (!post) {
        return res.send("Post not found");
    }

    post.isCompleted = !post.isCompleted;

    await post.save();

    res.redirect("/profile");
});


///////----edit ----------//////
// edit page open
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findById(req.params.id);
    res.render("edit", { post });
});

// update post
app.post('/edit/:id', isLoggedIn, async (req, res) => {
    await postModel.findByIdAndUpdate(req.params.id, {
        content: req.body.content
    });
    res.redirect("/profile");
});


// ---------- POST ROUTE ----------
app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });

    let { content } = req.body;

    let post = await postModel.create({
        user: user._id,
        content: content,
    });

    user.posts.push(post._id);
    await user.save();

    // 🔥 MOST IMPORTANT
    res.redirect("/profile");
});



//-----Log out------//

app.get('/logout', (req, res) => {
    res.clearCookie("token");      // ✅ better than blank string
    res.redirect("/login")  
})


//----------Protected Routs  apan jr log in naslo tr 
// te apalya l;a sangel ki log in must  karan must ahe he apam log in vr ani profile pic vr lau shakoto tyane ky 
// hoil apl;
// ------//

function isLoggedIn(req, res, next){

   if(!req.cookies.token){
  return res.redirect("/login");
} else {
        let data = jwt.verify(req.cookies.token, "suga")  // ❌ cookie → cookies
        req.user = data;
        next();                   // ✅ next only after verify
   
     
    }
}

app.listen(3000);
