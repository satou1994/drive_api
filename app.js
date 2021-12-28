const express = require('express');
const app = express();
app.use(express.static('public'));

// ****************************************************************************
//   定数
// ****************************************************************************
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

//スコープを追加、削除する場合は、token.jsonを削除してください。
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// トークン情報を保持しているファイル名
const TOKEN_PATH = 'token.json';

//Oauth2のJSONファイル名
const OAUTH2 = 'credentials.json'

// ****************************************************************************
//   Routing
// ****************************************************************************
app.get('/', (req, res) => {
    fs.readFile(OAUTH2, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Gドラ内のファイル情報を取得する
        authorize(JSON.parse(content), listFiles);
      });
    
    res.render('index.ejs');
});

app.post('/upload',(req, res) => {
    fs.readFile(OAUTH2, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Gドラにファイルをアップロードする
        authorize(JSON.parse(content), UploadFiles);
    });
 
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    fs.readFile(OAUTH2, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Gドラ内のファイルを削除する
        authorize(JSON.parse(content), DeleteFiles);
    });
 
    res.redirect('/');
});

// ****************************************************************************
//   Drive api
// ****************************************************************************
// 指定された資格情報を使用してOAuth2クライアントを作成し、指定されたコールバック関数を実行します
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // トークン情報を取得できない場合は、再度取得します
  // トークン情報を取得できた場合は、処理を実行します
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

// アクセストークンの取得。「token.json」として保存します
// 認証されたOAuth2クライアントで指定されたコールバックを実行します
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // 後でプログラムを実行できるように、トークンをディスクに保存します
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Gドラ内のファイル名、IDを最大１０個まで取得します
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

// Gドラにファイルをアップロードします
function UploadFiles(auth) {
    const drive = google.drive({version: 'v3', auth});  
    var fileMetadata = {
      name: 'afterFileName.jpg', // アップロード後のファイル名
      parents: ['1Q44XXXXXXXXXXXXXXXXXXXXXXX-'] //アップロードしたいディレクトリID
    };
    var media = {
      mimeType: 'image/jpeg', //アップロードファイル形式
      body: fs.createReadStream('img/beforFileName.jpg') // アップロードファイル名
    };

    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, function (err, file) {
    if (err) {
      console.error(err);
    } else {
      console.log('File Id: ', file.data.id);  
    }
    });
}

// Gドラ内の任意のファイルを削除します
function DeleteFiles(auth) {
  const drive = google.drive({version: 'v3', auth});  
  const deleteFileId = '1qaXXXXXXXXXXXXXXXXXXXXXX'; // 削除したいファイルID

  const params = {
    fileId: deleteFileId
  };

  drive.files.delete(
    params,
    function (err, res) {
      if (err) {
        console.error(err);
      } else {
        console.log('resDel :', res);  
      }
    }
  );
}

app.listen(3000);