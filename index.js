const express = require('express');
const bodyParser = require('body-parser');

const app = express();
var serv = require('http').Server(app);
const sha1 = require('sha1');
const salt = 'IwOg0yYImA';

//Pug stuff
app.set('view engine', 'pug');


serv.listen(process.env.PORT);
var io = require('socket.io')(serv);

function personConnection(id) {
    self = {
        id: id,
        porting: false,
        totalData: [],
        curr_url: '',
        pw: '',
        gravity:10,
        platformColor:"__NONE__",
        side:5
    };
    return self;
}

//Firebase stuff

var admin = require('firebase-admin');

var serviceAccount = require(__dirname +
    '/testing-level-data-firebase-adminsdk-tihwl-21accbb44a.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),databaseURL:"https://testing-level-data.firebaseio.com"});
var db = admin.firestore();

function postLevel(theLevelName, levelData, pw, color, gravity,side, socket) {
    hello = false;
    count = 0;
    db
        .collection('levels')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                if (doc.data().name == theLevelName) {
                    if (doc.data().pw == sha1(salt + pw)) {
                        docRef = db.collection('levels').doc(theLevelName);
                        docRef.update({
                            data: levelData,
                            platformColor: color,
                            gravity: gravity,
                            xMomentum:side
                        });
                    } else {
                        socket.emit('usedUrl');
                    }
                    hello = true;
                }
                count++;
            });
        })
        .then(() => {
            if (!hello) {
                docRef = db.collection('levels').doc(theLevelName);
                docRef.set({
                    name: theLevelName,
                    data: levelData,
                    pw: sha1(salt + pw),
                    platformColor: color,
                    gravity: gravity,
                    xMomentum:side
                });
            }
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
}

function fetchLevel(theLevelName, socket, newTab = false, res = null,editor=false) {
    count = 0;
    done = false;
    db
        .collection('levels')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                if (!done && doc.data().name == theLevelName) {
                    if (
                        doc.data().hasOwnProperty('platformColor') &&
                        doc.data().platformColor != '__NONE__'
                    ) {
                        pc = doc.data().platformColor;
                        colorString = 'colors="' + pc + '";';
                    } else {
                        pc = null;
                        colorString = '';
                    }
                    if (doc.data().hasOwnProperty('gravity')) {
                        grav = doc.data().gravity;
                        gravString = 'maxYVel=' + grav + ';';
                    } else {
                        grav = 10;
                        gravString = '';
                    }
                    if(doc.data().hasOwnProperty('xMomentum')){side=doc.data().xMomentum;sideString='maxXVel='+side+';'}else{side="5";sideString=''}
                    if(editor){res.render('editlevel',{title: "Editor: "+doc.data().name,dispColor:pc,jumpHeight:grav,sideSpeed:side,onloadThing:"setEditor(dataToArray('"+doc.data().data+"'));"})}
                    else if (!newTab) {
                        socket.emit('level_data', doc.data().data, pc, grav,side);
                    } else {
                        res.render('userlevel',{linkToEdit:"/editor/"+doc.data().name,title:doc.data().name,onloadThing:sideString+colorString+gravString+'setupWithArray("'+doc.data().data+'");'})
                        
                        /*res.send(
                            "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>  <title>"+doc.data().name+" - Platformer Jump</title><script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js'></script></head><body onload='" +sideString+
                            colorString +
                            gravString +
                            'setupWithArray("' +
                            doc.data().data +
                            "\");'><script src='/client.js'></script><canvas id='tutorial' width=500 height=500 onclick='toggleGame();'></canvas><p>Click the game (^^^^) or press 'R' to start/restart.</p><form name='f'><input type='text' name='name' placeholder='Level Name'><input type='button' name='button' value='Load Level from Name' onclick='getLevel();'></form></body></html>"
                        );*/
                    }
                    done = true;
                }
                count++;
            });
        })
        .then(() => {
            if (!done) {
                if (!newTab) {
                    socket.emit('not_exist');
                } else {
                    res.send('Level ' + theLevelName + ' does not exist.');
                }
            }
        })
        .catch(err => {
            console.log(err);
        });
}

allAccounts = {};
allSockets = {};
app.get("/help",(req,res)=>{
  res.sendFile(__dirname+"/tutorial.html");
});

/*
//This snippet is a test of template code--Useful in the future.
app.get('/pug', (req,res)=>{
  res.render('templatepage', { title: 'Testing Pug', onloadThing: "alert('Welcome!');" })
});*/

io.sockets.on('connection', socket => {
    socket.id = Math.random();
    player = new personConnection();
    allSockets[socket.id] = socket;
    allAccounts[socket.id] = player;
    socket.on('get_level', urlThing => {
        fetchLevel(urlThing, socket);

        /*toSend = [];
        db.each(
        	'SELECT data FROM levels WHERE url=?',
        	urlThing,
        	(err, row) => {
        		//foo(err, row);
        		toSend.push(row.data);
        	},
        	() => {
        		if (toSend.length > 0) {
        			//foo(toSend[0]);
        			socket.emit('level_data', toSend[0]);
        		} else {
        			socket.emit('not_exist');
        		}
        	}
        );*/
    });
    socket.on('listLevels', () => {
        allNames = [];
        db
            .collection('levels')
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    allNames.push(doc.data().name);
                });
            })
            .then(() => {
                socket.emit('levelList', allNames);
            });
    });
    socket.on('start_porting', (url, pw, color, gravity,side) => {
        player.porting = true;
        player.totalData = [];
        player.platformColor = color;
        player.gravity = gravity;
        player.url = url;
        player.pw = pw;
        player.side=side;
    });
    socket.on('next_line', data => {
        player.totalData.push(data);
    });
    socket.on('end_porting', () => {
        allStuff = [];
        done = false;
        player.porting = false;

        postLevel(
            player.url,
            player.totalData.join(','),
            player.pw,
            player.platformColor,
            player.gravity,
            player.side,
            socket
        );

        /*
		db.each(
			'SELECT url,pw FROM levels WHERE url=? LIMIT 1',
			player.url,
			(err, row) => {
				done = true;
				if (row.pw == sha1(salt + player.pw)) {
					//foo('hi');
					db.run(
						'UPDATE levels SET data=? WHERE url=?',
						player.totalData.join(','),
						player.url
					);
				} else {
					socket.emit('usedUrl');
				}
			},
			() => {
				if (!done) {
					db.run(
						'INSERT INTO levels VALUES (?,?,?)',
						player.url,
						player.totalData.join(','),
						sha1(salt + player.pw),
						err => {
							//foo('error on insert: ', err);
						}
					);
				}
			}
    );*/
    });
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
app.get('/', (req, res) => {
    res.render("mainpage",{title:"Platformer Jump",onloadThing:"setLevel();"})
});
app.get('/levels', (req, res) => {
    res.sendFile(__dirname + '/levels.html');
});
app.get('/editor', (req, res) => {
    res.sendFile(__dirname + '/public/levelcreate.html');
});
app.get('/editor/:levelName',(req,res)=>{fetchLevel(req.params.levelName,null,true,res,true)})
/*app.post('/',urlencodedParser,(req,res)=>{
  try{
    hi=db.prepare("INSERT INTO levels VALUES (?,?)");
    //foo(req.body.code);
    hi.run(
      req.body.url,req.body.code
    )
  }
  catch(err){
    //foo(err)
  }
  res.redirect("/levels/"+req.body.url);
});*/
app.get('/levels/:levelName', (req, res) => {
    fetchLevel(req.params.levelName, null, true, res);
    /*var toInput = [];
	db.each(
		'SELECT url,data FROM levels WHERE url=? LIMIT 1',
		req.params.levelName,
		(err, row) => {
			toInput.push(row);
		},
		() => {
			if (toInput.length > 0) {
				res.send(
					"<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>  <title>Platformer Jump</title><script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js'></script></head><body onload='setupWithArray(\"" +
						toInput[0].data +
						"\");draw();'><script src='/client.js'></script><canvas id='tutorial' width=500 height=500></canvas><form name='f'><input type='text' name='name' placeholder='Level Name'><input type='button' name='button' value='Load Level from Name' onclick='getLevel();'></form></body></html>"
				);
			} else {
				res.send('There is no level with the name ' + req.params.levelName);
			}
		}
  );*/
});

//app.listen(3000, () => //foo('server started'));
/*setInterval(()=>{db.each('SELECT data,url FROM levels',(err,row)=>{
  
},()=>{foo("Those were the rows")});},200000)*/