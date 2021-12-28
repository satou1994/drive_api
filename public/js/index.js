var btn = document.getElementById('upload');

btn.addEventListener('click',() => {
console.log("クリックされました。");

const fs = require('fs');
const {google} = require('googleapis');

async function runSample (query) {
  const client = await google.auth.getClient({
    keyFile: 'key.json',
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.photos.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  });

  const drive = google.drive({
    version: 'v3',
    auth: client
  });

  const params = { pageSize: 3 };
  params.q = query;
  const res = await drive.files.create({
    resource: {
      name: 'hoge.json',
      // 自分で生成したドライブディレクトリのID.
      parents: [GOOGLE_DRIVE_TEST_FOLDER_ID]
    },
    media: {
      mimeType: 'application/json',
      body: fs.createReadStream('hoge.json')
    },
    fields: 'id'
  }, (error, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log('File Id: ', response.data.id);
    }
  });
}

runSample();
console.log("クリックされました。");
});