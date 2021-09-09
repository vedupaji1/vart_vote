//Modules, Start
let express = require('express')
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let mongo_op = require('mongoose')
let database_model = require('./mongo')//This Is User Definde Module And I Has Written Code Of Mongoose Database Model In "mongo.js" File
let path = require('path');
const { Socket } = require('dgram');
//const bcrypt = require("bcryptjs");
const bcrypt = require('bcrypt');
const rsa_op = require('node-rsa');
const rsa_key = new rsa_op({ b: 512 });//It's RSA Module Use Of Encryption Of Any Data, Used In Login Part And Main Content Part.
const session_st = require('sessionstorage');//This Is Session Storage Module
const session = require('express-session')//And This Is Express Session Module
const { v4: uuidv4 } = require('uuid');//UUID Module For Generating Unique Id Or Number
const { devNull } = require('os');
const nodemailer = require('nodemailer');//For Sending Mail
//End


// Some Variable And Declarations, Start

let port = process.env.PORT || 80;
let static_file_path = path.join(__dirname, 'public')
let database_url = "mongodb+srv://vartVote:9081249082@cluster0.i1p7c.mongodb.net/VARt_vote?retryWrites=true&w=majority";
//
//mongodb://localhost:27017/vart_vote
app.use(express.static(static_file_path));
app.set('view engine', 'hbs');
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    //It Is Written For Using Express Session For More Info Check Line No 14 or Modules Part, Used In Login Part, Main Content Part.
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

app.use(express.urlencoded({
    extended: true
}));
//End

let tell_op = {
    inco_1: 0,
    sub_10: 0,
    pass_no: 0,
}
let che_op = {
    inco_2: 0,
    tr_no: 0
}

//Database Connection, Start
mongo_op.connect(database_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then((res) => {
    console.log("Done");
}).catch((err) => {
    console.log("Sorry");
})
//End


//Starting Express Js Routing
//Login Part, Start
app.get('/', (req, res) => {
    let user_data_1010 = req.session.auth_data; // Getting Data Which Stored In Express Session.
    if (user_data_1010 != null) {
        res.redirect('/main_dashboard');
    }
    else {
        res.render("login");
    }

})

app.post('/', (req, res) => {
    let data = req.body
    let arr_data = [];
    if (data.email == "" || data.email == "") {
        if (data.email == "") {
            arr_data.push(0);
        }
        if (data.password == "") {
            arr_data.push(1);
        }
        if (che_op.inco_2 == 0) {
            res.render("login", { warning: "Incomplete Details", data: arr_data })
        }
        else if (che_op.inco_2 == 1) {
            res.render("login");
        }
    }
    else {
        database_model.findOne({ email: data.email }).then((data1) => {
            if (data1 != null) {
                if (data.password == data1.password) {
                    //Encrypting Password, Start
                    let op_data = data.password;
                    let en_data;
                    let ses_data = {};
                    let op_mail = rsa_key.encrypt(data.email, 'base64');
                    bcrypt.hash(op_data, 4).then(data_d => {
                        en_data = data_d;
                        ses_data = {
                            na_10: op_mail,
                            pa_10: en_data,
                            web_load: 0
                        }
                        req.session.auth_data = ses_data; //Storing Data In Session 
                        console.log(req.session.auth_data)
                        console.log("saved_data");
                        res.render("login", { warning: "Login Done", data: 1000 });
                    }).catch(err => {
                        console.log(err);
                    })
                    // End
                }
                else {
                    if (che_op.tr_no == 0) {
                        res.render("login", { warning: "Password Not Matching", data: 101 })
                    }
                    else if (che_op.tr_no == 1) {
                        res.render("login");
                    }
                }
            }
            else {
                if (che_op.tr_no == 0) {
                    res.render("login", { warning: "Entered Data Does Not Exist In Database", data: 101 });
                }
                else if (che_op.tr_no == 1) {
                    res.render("login");
                }
            }
        }).catch((err) => {
            console.log(err);
        })
    }
})
// End

//Main Content Part, Start
app.get('/main_dashboard', (req, res) => {
    let user_data_1010 = req.session.auth_data;
    console.log(user_data_1010)
    //Authenticating Real User, Start
    if (user_data_1010 != null) {
        let real_mail_1010 = rsa_key.decrypt(user_data_1010.na_10, 'utf8');// Decrypting Mail Id
        console.log(real_mail_1010)
        database_model.findOne({ email: real_mail_1010 }).then(result => {
            //console.log(result);
            if (result == null) {
                res.redirect('/');
            }
            else {
                bcrypt.compare(result.password, user_data_1010.pa_10).then(isMatch => //Comparing Hash Password Which Stored In Express Session Storage.
                {
                    if (isMatch) {
                        res.render("main_dashboard", { ra_op_10: user_data_1010.na_10 });
                        console.log(isMatch);
                    }
                    else {
                        res.redirect('/');
                    }
                }).catch(err => {
                    console.log(err)
                })
            }
        }).catch(err => {
            console.log(err);
        })
    }
    else {
        res.redirect('/');
    }
    //End
})

const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0); // It Will Count Occurrence Of Specific Element In Array
const not_duplicate = (getted_data) => {
    let total_cad = Object.values(getted_data);
    console.log(total_cad);
    for (let i = 1; i < total_cad.length - 2; i++) {
        if (countOccurrences(total_cad, total_cad[i]) >= 2) {
            return true;
        }
    }
    return false;
}

const is_greater = (getted_data, k) => { //For Comparing Voting Dates Which Entered By User
    return new Promise((res, rej) => {
        console.log(getted_data)
        let exp_op = new Date(getted_data.vote_end);
        let st_op = new Date(getted_data.vote_start);
        if (k == 1) {
            if (exp_op.getTime() <= st_op.getTime()) { //Comparing Start Date Of Voting To End Date Of Voting
                res(true);
            }
            else {
                res(false);
            }
        }
        else {
            let date_10 = new Date();
            let new_time_op = date_10.getTime() + 19800000;
            console.log(exp_op);
            console.log(st_op);
            if (new_time_op >= st_op.getTime() && new_time_op <= exp_op.getTime()) {
                res(0);
            }
            else {
                let pp = {
                    dd: date_10,
                    st: st_op
                }
                console.log(pp);
                if (new_time_op < st_op.getTime()) {
                    res(3);
                }
                else if (new_time_op > exp_op.getTime()) {
                    res(4);
                }
            }
        }
    })

}

app.post('/main_dashboard', (req, res) => {
    console.log(req.body);
    let getted_data = req.body;
    let user_data_1010 = req.session.auth_data;

    if (getted_data.vote_system_name == "" || getted_data.candi_1 == "" || getted_data.candi_2 == "" || getted_data.vote_start == "" || getted_data.vote_end == "") {
        res.render("main_dashboard", { warning: "Entered Details were Empty", ra_op_10: user_data_1010.na_10 });
    }
    else if (not_duplicate(getted_data)) {
        res.render("main_dashboard", { warning: "Candidates Name Were Duplicate", ra_op_10: user_data_1010.na_10 });
    }
    else {
        is_greater(getted_data, 1).then(ress => {
            if (ress) {
                res.render("main_dashboard", { warning: "Voting Dates Were Invalid", ra_op_10: user_data_1010.na_10 });
            }
            else {
                //Storing Votting Data Which Getted From User, Start
                let user_data_getted_from_session = req.session.auth_data; //Getting Data Which Stored In Session For Searching Collection Database
                if (user_data_getted_from_session != null) {
                    let caddi_list = [];
                    let Getted_in_array = Object.values(getted_data);
                    let meet_code_op = uuidv4();
                    for (let i = 1; i < Getted_in_array.length - 2; i++) {
                        caddi_list.push(Getted_in_array[i]);
                    }
                    let all_caddi_data = [];
                    for (let i = 0; i < caddi_list.length; i++) {
                        let cadd_data_obj = {
                            name_candidate: caddi_list[i],
                            votes: 0
                        }
                        all_caddi_data.push(cadd_data_obj);
                    }
                    let url = new URL("http://localhost/give_vote");

                    let real_mail_1010 = rsa_key.decrypt(user_data_getted_from_session.na_10, 'utf8');//Decrypting Mail Id
                    url.searchParams.set('co', meet_code_op);//Stored Mail Id
                    let original_vote_data = {
                        vote_system_name: getted_data.vote_system_name,
                        vote_system_code: meet_code_op,
                        total_candidate: caddi_list.length,
                        vote_start_time: getted_data.vote_start,
                        vote_end_time: getted_data.vote_end,
                        meet_url: url,
                        candidate_name: caddi_list,
                        voters_mail: [],
                        candidate_data: all_caddi_data
                    }

                    database_model.updateOne({ email: real_mail_1010 }, { $push: { vote_system: original_vote_data } }).then(result => {
                        console.log('NewData Saved Successfuly');
                    }).catch(err => {
                        console.log(err);
                    })
                    //End

                    //let params = new URLSearchParams(url.search.slice(1));
                    //let url_data = params.get('param_2')
                    res.redirect("/data_saved?gg=" + meet_code_op); //Sending Meet Code 
                }
                else {
                    res.render("/");
                }

            }
        }).catch(err => {
            console.log(err);
        })

    }

})
//End

//Data Saved Part, Start
app.get('/data_saved', (req, res) => {
    meet_code_op = req.query.gg;
    let url = new URL("http://localhost/give_vote");
    let user_data_getted_from_session = req.session.auth_data; //Getting Data Which Stored In Session For Searching Collection Database
    if (user_data_getted_from_session != null) {
        url.searchParams.set('co', meet_code_op);//Stored Mail Id
        res.render("data_saved", { url1: url });
    }
    else {
        res.redirect("/");
    }
})
//End

app.get('/give_vote', (req, res) => {
    let me_op = {
        co: req.query.co
    }
    console.log(me_op.co)
    if (me_op.co == undefined) {
        res.render("404_error");
    }
    else {
        database_model.findOne({ "vote_system.vote_system_code": me_op.co }).then(result => {
            if (result != null) {
                let index_op_data;
                for (let i = 1; i < result.vote_system.length; i++) {
                    if (result.vote_system[i].vote_system_code == me_op.co) {
                        index_op_data = i;
                        break;
                    }
                }
                let vote_time_op_10 = {
                    vote_start: result.vote_system[index_op_data].vote_start_time,
                    vote_end: result.vote_system[index_op_data].vote_end_time
                }
                let vote_show_line = result.vote_system[index_op_data].vote_system_name + "'s Voting";
                is_greater(vote_time_op_10, 2).then(tell_about_date => {
                    console.log(tell_about_date)
                    if (tell_about_date == 0) {
                        res.render("give_vote", { mess_10: vote_show_line, vote_start_10: vote_time_op_10.vote_start, vote_end_10: vote_time_op_10.vote_end });
                    }
                    else {
                        if (tell_about_date == 3) {
                            res.render("voting_end", { mess_10: "Voting Not Started", vote_start_10: vote_time_op_10.vote_start, vote_end_10: vote_time_op_10.vote_end });
                        }
                        else if (tell_about_date == 4) {
                            res.render("voting_end", { mess_10: "Voting End", vote_start_10: vote_time_op_10.vote_start, vote_end_10: vote_time_op_10.vote_end });
                        }
                    }
                })
            }
            else {
                res.render("404_error");
            }
        }).catch(err => {
            console.log(err)
        })
    }
})


//Storing Registration Details After Email Verification, Start
const store_reg_data = (data) => {
    let signup_data = new database_model({
        "firstname": data.firstname,
        "lastname": data.lastname,
        "username": data.username,
        "email": data.email,
        "password": data.password,
        "vote_system": [{}]
    })
    signup_data.save().then((result) => {
        console.log("Data Saved")
    }).catch((err) => {
        console.log("Sorry");
    })
}
//End

//404 Error, Start
app.get('/404_error', (req, res) => {
    res.render("404_error");
})
//End

// Register Part, Start
app.get('/register', (req, res) => {
    res.render("register");
})

app.post('/register', (req, res) => {
    let data = req.body;
    console.log(data)
    if (data.firstname == "" || data.lastname == "" || data.username == "" || data.email == "" || data.password == "" || data.con_password == "") {
        let warn1 = [];
        if (data.firstname == "") {
            warn1.push(0);
        }
        if (data.lastname == "") {
            warn1.push(1);
        }
        if (data.username == "") {
            warn1.push(2);
        }
        if (data.email == "") {
            warn1.push(3);
        }
        if (data.password == "") {
            warn1.push(4);
        }
        if (data.con_password == "") {
            warn1.push(5);
        }

        if (tell_op.inco_1 == 0) {
            res.render("register", { warning: "Incomplete Details", warn: warn1, filed_data: data });
        }
        else if (tell_op.inco_1 == 1) {
            res.render("register");
        }

    }
    else {
        database_model.findOne({ email: data.email }).then((data1) => {
            if (data1 != null) {
                if (tell_op.sub_10 == 0) {
                    res.render("register", { warning: "Email Is Already In Use", warn: 101, filed_data: data });
                }
                else if (tell_op.sub_10 == 1) {
                    res.render("register");
                }
            }
            else {
                if (data.password == data.con_password) {

                    res.render("register", { warning: "Registration Done", warn: 1000, filed_data: data });// Routing
                }
                else {
                    console.log("Password Not Matching")
                    if (tell_op.pass_no == 0) {
                        res.render("register", { warning: "Confirme Password Is Not Matching", warn: 101, filed_data: data });
                    }
                    else if (tell_op.pass_no == 1) {
                        res.render("register");
                    }
                }
            }
        }).catch((err) => {
            console.log(err);
        })
    }
})
//End
http.listen(port, () => {
    console.log("Ok");
})

//Sending OTP To Gmail, Start
const send_mail_op = (mail_data_10) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'vartvote@gmail.com',
            pass: '9081249082'
        }
    });

    let mailOptions = {
        from: 'vartvote@gmail.com',
        to: mail_data_10.email_op_10,
        subject: 'OTP Of VARt Voting System',
        text: mail_data_10.otp_op_10
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
//End

io.on('connection', (socket) => {
    console.log("Op")
    socket.on('incomplete_op', (data) => {
        tell_op.inco_1 = data;
        tell_op.sub_10 = data;
        tell_op.pass_no = data;
        che_op.inco_2 = data;
        che_op.tr_no = data;
        console.log(data);
    })
    socket.on('incomplete_op_1', (data) => {
        tell_op.inco_1 = data;
        che_op.inco_2 = data;
        console.log(data);
    })
    socket.on('email_vali', (data) => {
        tell_op.sub_10 = data;
        che_op.tr_no = data;
        console.log(data + "ll");
    })
    socket.on('pass_op_1', (data) => {
        tell_op.pass_no = data;
        console.log(tell_op.pass_no + "kkkk");
    })


    //Data Sending To Web Page, Start
    socket.on('give_op_10', (me_op) => {
        console.log(me_op.co)
        database_model.findOne({ "vote_system.vote_system_code": me_op.co }).then(result => {
            if (result != null) {
                let index_op_data;
                for (let i = 1; i < result.vote_system.length; i++) {
                    if (result.vote_system[i].vote_system_code == me_op.co) {
                        index_op_data = i;
                        break;
                    }
                }
                socket.emit("res_val", (result.vote_system[index_op_data]));
            }
            else {
                socket.emit("res_val", (result))
            }
        }).catch(err => {
            console.log(err)
        })
    })
    //End

    //Data Updation, Start
    socket.on('take_res_vote', sub_data_op => {
        database_model.findOne({ "vote_system.vote_system_code": sub_data_op.co }).then(result => {
            let voted_cadi_data;
            let num;
            for (let i = 1; i < result.vote_system.length; i++) {
                if (result.vote_system[i].vote_system_code == sub_data_op.co) {
                    voted_cadi_data = result.vote_system[i].candidate_data[sub_data_op.total_in];
                    num = i;
                    break;
                }
            }
            let sett_op = { //Creating New Data Structure With Just Little Bit Chanages
                name_candidate: voted_cadi_data.name_candidate,
                votes: voted_cadi_data.votes + 1
            }

            database_model.updateOne({ _id: result._id, "vote_system._id": result.vote_system[num]._id },//Deleting Old Data Of Votted Canddidate.
                {
                    $pull: {
                        "vote_system.$.candidate_data": { name_candidate: voted_cadi_data.name_candidate }
                    }
                }
            ).then(ress => {
                console.log(ress);
            }).catch(err => {
                console.log(err);
            })

            database_model.updateOne({ _id: result._id, "vote_system._id": result.vote_system[num]._id },//Pushing Updated Data On Their Old Position.
                {
                    $push: {
                        "vote_system.$.candidate_data": { "$each": [sett_op], "$position": sub_data_op.total_in }
                    }
                }
            ).then(ress => {
                console.log(ress);
            }).catch(err => {
                console.log(err);
            })
            /* database_model.findOneAndUpdate({ _id: "611e36f65ac82c1768d19717", "vote_system._id": "611e376a5ac82c1768d1971f" },
                 {
                     $pull: {
                         "vote_system.$.candidate_data": {
                             name_candidate: "2"
                         }
                     }           //This Is Another Method For Curd Operation
                 }).then(ress => {
                     console.log(ress);
                 }).catch(err => {
                     console.log(err);
                 })*/
        }).catch(err => {
            console.log(err)
        })
    })
    //End

    //For Sending OTP From Mail, Start
    socket.on("send_mail", mail_id_op_10 => {
        let digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        console.log(OTP)
        let message_op = `Hi User, Your OTP(One Time Password) Is ${OTP}`;
        let mail_data_10 = {
            email_op_10: mail_id_op_10,
            otp_op_10: message_op
        }
        send_mail_op(mail_data_10);
        console.log(OTP);
        let new_otp = rsa_key.encrypt(OTP, "base64");
        socket.emit('lelo_10', new_otp)
    })
    //End

    //Storing Voter Mail, Start
    socket.on("mail_le_10", mai_le => {
        database_model.findOne({ "vote_system.vote_system_code": mai_le.co }).then(result => {
            let index_op_data;
            for (let i = 1; i < result.vote_system.length; i++) {
                if (result.vote_system[i].vote_system_code == mai_le.co) {
                    index_op_data = i;
                    break;
                }
            }
            database_model.updateOne({ _id: result._id, "vote_system._id": result.vote_system[index_op_data]._id },//Pushing Voter Gmail Id.
                {
                    $push: {
                        "vote_system.$.voters_mail": mai_le.mai
                    }
                }
            ).then(ress => {
                console.log(ress);
            }).catch(err => {
                console.log(err);
            })

        }).catch(err => {
            console.log(er);
        })
    })

    //Validating Voter Gmail, Start
    socket.on("che_mai", mai_le => {
        database_model.findOne({ "vote_system.vote_system_code": mai_le.co }).then(result => {
            let index_op_data;
            for (let i = 1; i < result.vote_system.length; i++) {
                if (result.vote_system[i].vote_system_code == mai_le.co) {
                    index_op_data = i;
                    break;
                }
            }
            let total_voters_mail = result.vote_system[index_op_data].voters_mail;
            let tell_mail = false;
            for (let i = 0; i < total_voters_mail.length; i++) {
                if (mai_le.mai == total_voters_mail[i]) {
                    tell_mail = true;
                    break;
                }
            }
            if (tell_mail) {
                socket.emit("res_op_mail", false)
            }
            else {
                socket.emit("res_op_mail", true)
            }
        }).catch(err => {
            console.log(er);
        })
    })

    //End

    //Decrypting OTP, Start
    socket.on("che_ot", data => {
        let originl_otp = rsa_key.decrypt(data.da, "utf8");
        if (originl_otp == data.ot) {
            socket.emit("che_res", true);
        }
        else {
            socket.emit("che_res", false);
        }
    })
    //End

    //Giving Command For Storign Details, Start
    socket.on("Pl_le_bh_10", (le_bh_10) => {
        console.log(le_bh_10);
        if (le_bh_10.new_mail_op == le_bh_10.email && le_bh_10.password.length >= 8) {
            store_reg_data(le_bh_10);
        }
        else {
            socket.emit("nik_10", '/404_error')
        }
    })
    //End
    socket.on("prov_data", rsa_pp => {
        let real_mail_1010 = rsa_key.decrypt(rsa_pp, 'utf8');// Decrypting Mail Id
        database_model.findOne({ email: real_mail_1010 }).then(result => {
            let pp = result.vote_system;
            socket.emit("Data_le_10", pp);
        }).catch(err => {
            console.log(err);
        })
    })
    socket.on("give_time", pp => {

    })
})