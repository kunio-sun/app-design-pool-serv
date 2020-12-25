const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require('passport');
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const fs = require('fs');




const app = express();
// ひとつ目のプロキシサーバーを信用(trust)
app.set('trust proxy', 1);
// 違うポート番号を使用する時のセキュリティエラー対処処理cors
app.use(cors());
// form のpostデータを使用できる様にする
app.use(bodyParser.urlencoded({ extended: true }))
// postデータをjsonにparse（変換)する定型文
app.use(bodyParser.json());
const PORT = process.env.PORT || 4000;

postRouter = express.Router()

// ---------------------ここから下にモジュール設定-----------------------------
// ========================================================================


// ---------------------セッションオプション------------
/* 
Session サーバ側に保持
Cookie ブラウザが保持 (有効期限はあれど、ブラウザが閉じてもデータは保持)
セッションcookie ブラウザが保持 （ブラウザが閉じるとデータ破棄)
 */
app.use(session({
  //block chain をキーとしてクッキーを暗号化する
  secret: 'keyboard cat',
  // セッションチェックを行うたびにセッションを作成するか、falseで、毎回セッションを作成しない。
  resave: false,
  // 未初期化状態のセッションを保存するかどうかの指定です。保存する場合はtrue
  saveUninitialized: true,
  // Cookieの有効期限をミリ秒で設定。指定なし又はnullなら
  // ブラウザデフォルトの挙動（一般的にはブラウザを閉じたらCookie削除）
  cookie: { secure: true }
}))
// ---------------------セッションオプション------------



// 投稿(image)ディレクトリ
const storage = multer.diskStorage({
  destination/*(保存先)*/: (req, file, cb) => {
    cb(null, './public/images/')
  },
  filename/*(ファイル名)*/: (req, file, cb) => {
    console.log(file);

    const imageFormat = "." + file.mimetype.split("/")[1]
    const unipuePostId = file.originalname + imageFormat;
    console.log("保存画像", unipuePostId)
    cb(null, unipuePostId);
  }
})
const upload = multer({ storage: storage }).single('file')/* .array("files", 4) */;

// アイコンディレクトリ
const icon = multer.diskStorage({
  destination/*(保存先)*/: (req, file, cb) => {
    cb(null, './public/icon/')
  },
  filename/*(ファイル名)*/: (req, file, cb) => {
    const userId = file.originalname;
    console.log(file)
    console.log("000000000000000000000000000000000")
    console.log(file.mimetype)
    const imageFormat = "." + file.mimetype.split("/")[1]
    const unipuePostId = /* file.originalname */ + userId + imageFormat;
    cb(null, unipuePostId);
  }
})
const uploadIcon = multer({ storage: icon }).single('file');


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
const { response } = require("express");
const { resolve } = require("path");
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'design_pool',
  port: '3306'
});
con.connect(function (err) {
  if (err) throw err;
  console.log('Database Connected');
});


// ------------------------------リクエスツ--------------------------
// ================================================================
//acountEditからアクセス
app.post("/changeIcon",
  uploadIcon,
  (req, res, next) => {
    console.log("----------------------------- %%% todo function %%%------------------------------------");
    const user = req.body;
    console.log("userデータは", user);


    let saveIconName = user.icon;
    if (req.file) {
      saveIconName = user.user_id + "." + req.file.mimetype.split("/")[1];
    }
    // console.log(saveIconName);


    const sql = "UPDATE user SET name = ?, mail = ?, password = ?, icon = ?, profile = ? where user_id = ?"
    con.query(sql, [
      user.name,
      user.mail,
      user.pass1,
      saveIconName,
      user.profile,
      user.user_id
    ])

    // res.send("画像アップロード成功");
    const resUserData = { ...user, icon: saveIconName, didChange: true };
    res.send(resUserData);
  }
)


app.post("/postDelete", (req, res) => {
  // 画像ファイル消去  
  const imageName = req.body.name;
  console.log(imageName)
  fs.unlink('./public/images/' + imageName, (err) => {
    if (err) throw err
  })

  // データベース投稿データ消去
  const postName = req.body.name.split(".")[0];
  console.log(postName)
  const postSql = "delete from post where post_id = ?"
  con.query(postSql, [postName], (err, result) => {
    if (err) throw err
    console.log(result[0])
  })
  const keySql = "delete from post_key where post_id = ?"
  con.query(keySql, [postName], (err, result) => {
    if (err) throw err
    console.log(result)
  })
  res.send("ok")
})


//poolingPageからアクセス
app.post("/imagePost",
  upload,
  (req, res, next) => {
    console.log("-----------------------------------------------------------------");
    console.log(req.body);
    const userId = req.body.userId;

    const file = req.file;
    const fileName = file.originalname;
    const tagArray = req.body.tagArray;
    const postText = req.body.postText;

    const imageFormat = "." + file.mimetype.split("/")[1]
    const unipuePostId = fileName;


    // console.log("受付file ---> ", unipuePostId);
    // console.log("投稿本文 ---> ", postText);

    // 投稿テーブル post に行追加
    const insertSql = "INSERT INTO `post` (`post_id`, `user_id`, `img`, `content`, `atTime`) VALUES(?, ?, ?, ?, now());"
    con.query(insertSql, [unipuePostId, userId, unipuePostId + imageFormat, postText], function (err, result, fields) {
      if (err) throw err;
    });

    // タグテーブル post_keyに行追加
    const insertTagSql = "INSERT INTO `post_key` (`post_id`, `key`) VALUES(?, ?);"
    tagArray.forEach(tag => {
      // console.log("タグの内容--->", tag);
      con.query(insertTagSql, [unipuePostId, tag], function (err, result, fields) {
        if (err) throw err;
      });
    });

    res.send("成功");
  });


// signUpPageからアクセス
app.post("/signUp", (req, res) => {
  console.log("-----------------------------------------------------------------");
  // console.log("サインアップポストボタンクリック");
  const emailV = req.body.email;
  const nemeV = req.body.name;
  const passwordV = req.body.password;
  // console.log(emailV, nemeV, passwordV);

  const checkSql = "select * from user where mail = ?"
  con.query(checkSql, [emailV], function (err, result, field) {
    if (err) throw err;
    let canInsert = false;

    // console.log("重複検査：" + result);
    if (result.length === 0) {
      canInsert = true;
    } else {
      canInsert = false;
    }

    if (canInsert === true) {
      const sql = "INSERT INTO `user` (`name`, `mail`, `password`, `icon`, `profile`)VALUES(?, ?, ?, 'InitializeIcon.png', '');"
      con.query(sql, [nemeV, emailV, passwordV], function (err, result, fields) {
        if (err) throw err;
        // console.log(result);

        //作成したアカウントをloginState保存のために再度ピックアップ
        const loginInfoFetchSql = "select user_id,name,mail,icon,profile from user where mail = ?";
        con.query(loginInfoFetchSql, [emailV], function (err, result) {
          if (err) throw err;
          // console.log(result[0])


          res.send(result[0]);
        })
      });
    } else {
      res.send()
    }
  });
});

// --------------------------
app.get("/getUserInfo", (req, res) => {
  const userId = req.query.userId;
  // console.log("検索userは", userId);

  const sql = "select user_id,icon,mail,name,profile from user where user_id = ?"
  con.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.send(result[0]);
  })
})

// contentPageからアクセス 
app.get("/content", (req, res) => {
  console.log("-----------------------------------------------------------------");
  const seachImageName = req.query.seachImageName;
  // console.log("検索画像は", seachImageName);
  // 必要data userTable{user_id,icon,name} postTable{img,content}
  const sql = "select user.user_id,user.icon,user.name,post.img,post.content from post,user where post.user_id =user.user_id and post.img = ?";
  con.query(sql, [seachImageName], (err, result) => {
    if (err) throw err;
    // console.log(result[0]);
    res.send(result[0]);
  })
}); // end content

app.get("/getIconFile", (req, res) => {
  console.log("-----------------------------------------------------------------");
  const seachIconName = req.query.icon;
  // console.log("検索アイコンは", seachIconName);

  const imageDirectory = "./public/icon";
  const fullpathFileName = path.join(__dirname, imageDirectory, seachIconName)
  // console.log(fullpathFileName);

  res.sendFile(fullpathFileName);



})// end getIconFile


// imageOnlyPostListからアクセス
app.get("/getImageName", (req, res) => {
  console.log("-----------------------------------------------------------------");
  let seachKey = req.query.seachKey;
  // console.log("送られてきたseachKey = ", seachKey);

  if (seachKey === "undefined") {
    // console.log("paramが空：sqlはselect img from post limit 14となります");
    const sql = "select img from post limit 14";
    con.query(sql, (err, result, fields) => {
      if (err) throw err;
      // console.log(result);
      res.send(result);
    });
    return
  } else {
    // console.log("paramが入力:sqlはseachKeyで検索されます")
    seachKey = "%" + seachKey + "%";
    const sql = "select distinct(img) from post,post_key where post.post_id = post_key.post_id AND post_key.key like ? limit 14";
    con.query(sql, [seachKey], (err, result, fields) => {
      if (err) throw err;
      // console.log(result);
      res.send(result);
    });
  }// end if

})// end getImageName

// ユーザー投稿リストの画像一覧　　
app.get("/getUserPostImage", (req, res) => {
  console.log("-----------------------------------------------------------------");
  const userId = req.query.userId;
  const sql = "select post.img from user,post where user.user_id = post.user_id and user.user_id = ? limit 14"
  con.query(sql, [userId], (err, result) => {
    if (err) throw err;
    // console.log(result);
    res.send(result);
  })
})
app.get("/getUserPostImageNext", (req, res) => {
  console.log("-----------------------------------------------------------------");
  const lastImageName = req.query.lastImageName;
  const seachUser = req.query.userId;
  const sql = "select post.img from post,user where user.user_id = post.user_id and atTime > (select atTime from post where img = ?) and user.user_id = ? limit 14"

  // console.log(lastImageName, seachUser);

  con.query(sql, [lastImageName, seachUser], (err, result) => {
    if (err) throw err;
    // console.log(result);
    res.send(result);
  });
});


app.get("/getImageNext", (req, res) => {
  console.log("-----------------------------------------------------------------");
  // console.log("リクエストデータは", req.query);
  const lastImageName = req.query.lastImageName;
  let seachKey = req.query.seachKey;
  if (!seachKey) {
    // console.log("---seachKeyがない時の処理---")
    const sql = "select img from post where atTime > (select atTime from post where img = ?) limit 14";
    con.query(sql, [lastImageName], (err, result) => {
      if (err) throw err;
      // console.log(result);
      res.send(result);
    });
  } else {
    // console.log(`---seachKeyが${seachKey}で存在する時の処理---`)
    seachKey = "%" + seachKey + "%";
    const sql = "select distinct(post.img) from post,post_key where post.post_id = post_key.post_id and post_key.key like ? and atTime > (select atTime from post where img = ?) limit 14";
    con.query(sql, [seachKey, lastImageName], (err, result) => {
      if (err) throw err;
      // console.log(result);
      res.send(result);
    });
  }
});// end getImageNext

app.get("/getImageFile", (req, res) => {
  // console.log("-----------------------------------------------------------------");
  // console.log(req.query.img);
  //画像取得
  const imageDirectory = "./public/images/";
  const fullpathFileName = path.join(__dirname, imageDirectory, req.query.img)
  // console.log(fullpathFileName);

  res.sendFile(fullpathFileName);

});// end getImageFile



//topPageからアクセス
// app.get("/redirector", (req, res) => {
//   console.log("-----------------------------------------------------------------");
//   // console.log("リダイレクト発火");
//   //データベース取得テスト
//   res.send("リダイレクト");
// })



// loginPageからアクセス
app.post("/login", (req, res) => {
  console.log("-----------------------------------------------------------------");
  // console.log("ログインポストボタンクリック");
  const mailKey = req.body.email;
  const passKey = req.body.pass;
  // console.log(mailKey, passKey);

  const sql = "select user_id,name,mail,icon,profile from user where mail = ? && password = ?";
  con.query(sql, [mailKey, passKey], function (err, result, fields) {
    // console.log(result);
    let resultBool = false;
    if (result.length === 0) {
      resultBool = false;
    } else {
      resultBool = true;
    }
    if (err) throw err;
    res.send(result)
  }); //end sql
});






app.listen(PORT);