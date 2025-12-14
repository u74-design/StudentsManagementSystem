import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const DataBase = "Students";
const dbTeacher = "TeachersInfo";

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'teacher',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1800000 }
}));

function teacherLogin (req,res,next){
    if(req.session.Username){
        return next(); 
    }
    return res.render('studentsError');
}
client.connect().then((connection)=>{
    const dbt = connection.db(dbTeacher)
    const db = connection.db(DataBase);
    app.get('/home',teacherLogin,async (req,res)=>{
        const collection = db.collection('StudentsDetails');
        const result = await collection.find().toArray();
        res.render('Home',{result, name: req.session.Username})
    })
    app.post('/delete/:id',teacherLogin,async (req,res)=>{
        const id = req.params.id;
        const collection = db.collection('StudentsDetails');
        await collection.deleteOne({_id: new ObjectId(id)});
        res.redirect('/home');
    })
    app.get('/add',teacherLogin,(req,res)=>{
        res.render('add');
    })
   app.post('/submit',teacherLogin, async (req, res) => {
    const collection = db.collection('StudentsDetails');
    const data = req.body;

    await collection.insertOne({
    RollNo: data.RollNo,
    name: data.name,
    class: data.class,
    Age: data.Age,
    email: data.email,
    attendance: data.attendance,
    marks: {
        science: data.science,
        english: data.english,
        marathi: data.marathi,
        hindi: data.hindi,
        maths: data.maths,
        sanskrit: data.sanskrit
    }
    });

    res.redirect('/home');
    });
    app.post('/update/:id',teacherLogin,async (req,res)=>{
        const id = req.params.id;
        const collection = db.collection('StudentsDetails');
        const result = await collection.findOne({_id: new ObjectId(id)})
        res.render('update',{result});
    })
    app.post("/updatedData",teacherLogin, async (req, res) => {
    const { name, email, RollNo, Age, class:Class ,id, attendance,science, english, marathi, hindi, maths, sanskrit} = req.body;
    const collection = db.collection("StudentsDetails");
    await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                name: name,
                email : email,
                RollNo : RollNo,
                Age : Age,
                class: Class,
                attendance: attendance,
                marks: {
                    science: science,
                    english: english,
                    marathi: marathi,
                    hindi: hindi,
                    maths: maths,
                    sanskrit: sanskrit
                }
            }
        }
    );
    res.redirect("/home");
    });
    app.post('/detail/:id',teacherLogin,async (req,res)=>{
        const collection = db.collection('StudentsDetails');
        const result = await collection.findOne({_id: new ObjectId(req.params.id)})
        res.render('details',{result})
    })  
    app.get('/',(req,res)=>{
        res.render('login')
    })
    app.post("/submitted", async (req, res) => {
    console.log("Login attempt:", req.body);
    const { Username, Password } = req.body;
    req.session.Username = Username;
    const collection = dbt.collection("Teacher");
    const teacher = await collection.findOne({ Username: Username });
    if (!teacher) {
        return res.render("studentsError", { msg: "Teacher not found!" });
    }
    if (teacher.Password !== Password) {
        return res.render("studentsError", { msg: "Incorrect Password!" });
    }

    req.session.save(err=>{
        if(err){
            console.log("Session save error:", err);
            return res.render("TeachersError", { msg: "Session error!" });
        }
        console.log("Session saved:", req.session);
        res.redirect("/home");
        
    })
    });

    app.get('/search',async (req,res)=>{
        const Student = req.query.search 

        if(Student){
            const collection = db.collection('StudentsDetails');
            const result = await collection.findOne({RollNo: Student})
            if(result){
                res.render('details',{result})
            }
            else{
                res.render('Error');
            }
        }
        else{
            res.render('Error');
        }
    })
    app.get('/view',(req,res)=>{
        res.render('viewStudent')
    })
    app.get('/student',async (req,res)=>{
        const Student = req.query.RollNo
        const collection = db.collection('StudentsDetails');
        const result = await collection.findOne({RollNo: Student})
        if(result){
            res.render('student',{result})
        }
        else{
            res.render('studentsError')
        }
    })
    app.use((err, req, res, next) => {
    console.error("Error Reported:", err.message);
    res.status(500).render('Home', { result: [], name: req.session.Username || "Guest" });
    });

    app.use((req,res)=>{
    res.status(404).render('Home', { result: [], name: req.session.Username || "Guest" });
    })

})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});