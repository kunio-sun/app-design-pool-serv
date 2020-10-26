const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require('passport');


const app = express();
// 違うポート番号を使用する時のセキュリティエラー対処処理cors
app.use(cors());
// form のpostデータを使用できる様にする
app.use(bodyParser.urlencoded({ extended: true }))
// postデータをjsonにparse（変換)する定型文
app.use(bodyParser.json());
const PORT = process.env.PORT || 4000;


// passport
// app.use(passport.initialize());
// const LocalStrategy = require('passport-local').Strategy;
// const User1 = {
//   email: "kunio092@gmail.com",
//   pass: "kuni4649"
// };
// passport.use(new LocalStrategy(function (email, pass, done) {
//   // ここで email と pass を確認して結果を返す
//   if (email !== User1.email) {
//     console.log("error");
//     return done(null, false);
//   } else if (pass !== User1.pass) {
//     console.log("error");
//     return done(null, false);
//   } else {
//     // Success and return user information.
//     console.log("succes");
//     return done(null, { email: email, pass: pass });
//   }
// }));


// sql接続定型部分
var mysql = require('mysql');
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'design_pool',
  port: '8889'
});
con.connect(function (err) {
  if (err) throw err;
  console.log('Database Connected');
});



//---topPageからアクセス
app.get("/", (req, res) => {
  console.log("あくせす");
  //データベース取得テスト
  const sql = "select * from user where mail = ? && password = ?";
  con.query(sql, ['kunio092@gmail.com', 'kuni4649'], function (err, result, fields) {
    if (err) throw err;
    res.send(result)
  });
})


//サインアップ---
app.post("/signUp", (req, res) => {
  console.log("サインアップポストボタンクリック");
  const emailV = req.body.email;
  const nemeV = req.body.name;
  const passwordV = req.body.password;
  console.log(emailV, nemeV, passwordV);

  const checkSql = "select * from user where mail = ?"
  con.query(checkSql, [emailV], function (err, result, field) {
    if (err) throw err;
    let canInsert = false;

    console.log("重複検査：" + result);
    if (result.length === 0) {
      canInsert = true;
    } else {
      canInsert = false;
    }

    if (canInsert === true) {
      const sql = "INSERT INTO `user` (`name`, `mail`, `password`, `icon`, `profile`)VALUES(?, ?, ?, '', '');"
      con.query(sql, [nemeV, emailV, passwordV], function (err, result, fields) {
        if (err) throw err;
        // console.log(result);

        res.send("成功");
      });
    } else {
      res.send("email重複")
    }
  });

});



//ログインloginPageからリクエスト---
app.post("/login", (req, res) => {
  console.log("ログインポストボタンクリック");
  const mailKey = req.body.email;
  const passKey = req.body.pass;
  // console.log(mailKey, passKey);

  const sql = "select * from user where mail = ? && password = ?";
  con.query(sql, [mailKey, passKey], function (err, result, fields) {
    console.log(result);
    let resultBool = false;
    if (result.length === 0) {
      resultBool = false;
    } else {
      resultBool = true;
    }
    if (err) throw err;
    res.send(resultBool)
  });

});

//passport login test
// app.post("/test",
//   passport.authenticate('local'),
//   function (req, res) {

//     // 認証成功するとここが実行される
//     res.send("せいこう");
//   }
// );


//---topPageからアクセス
app.get("/redirector", (req, res) => {
  console.log("リダイレクト発火");
  //データベース取得テスト
  res.send("リダイレクト");
})





app.listen(PORT);