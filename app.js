//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    crypto = require( 'crypto' ),
    i18n = require( 'i18n' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    passport = require( 'passport' ),
    request = require( 'request' ),
    session = require( 'express-session' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy,
    uuidv1 = require( 'uuid/v1' ),
    app = express();
var http = require( 'http' ).createServer( app ),
    https = null;
var io = null; //require( 'socket.io' ).listen( http );

var settings = require( './settings' );

//. setup session
app.use( session({
  secret: 'qoodle',
  resave: false,
  cookie: { maxAge: ( 365 * 24 * 60 * 60 * 1000 ) },
  saveUninitialized: false
}));

//. setup passport
app.use( passport.initialize() );
app.use( passport.session() );
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser( ( user, cb ) => cb( null, user ) );
passport.use( new WebAppStrategy({
  tenantId: settings.tenantId,
  clientId: settings.clientId,
  secret: settings.secret,
  oauthServerUrl: settings.oauthServerUrl,
  redirectUri: settings.redirectUri
}));

/*
app.all( '/', basicAuth( function( user, pass ){
  if( settings.admin_username && settings.admin_password ){
    return ( settings.admin_username === user && settings.admin_password === pass );
  }else{
    return true;
  }
}));
*/

//. SSL
if( settings.ssl_key && settings.ssl_cert && settings.ssl_ca ){
  var options = {};
  options.key = fs.readFileSync( settings.ssl_key );
  options.cert = fs.readFileSync( settings.ssl_cert );
  options.ca = fs.readFileSync( settings.ssl_ca );

  https = require( 'https' ).createServer( options, app );
  io = require( 'socket.io' ).listen( https );
}else{
  io = require( 'socket.io' ).listen( http );
}

//. URL パラメータ毎に認証情報を変えたい
app.use( function( req, res, next ){
  var originalUrl = req.originalUrl;
  if( originalUrl.startsWith( '/quizset' ) ){
    var id = req.query.id;
    var option = {
      url: req.protocol + '://' + req.headers.host + '/dbapi/quizset/' + id,
      method: 'GET'
    };
    request( option, ( err1, res1, body1 ) => {
      if( err1 ){
        res.set( 'WWW-Authenticate', 'Basic realm="Qoodle"' );
        res.status(401).send( 'Authentication required.' );
      }else{
        body1 = JSON.parse( body1 );
        if( body1 && body1.status && body1.body ){
          var _user = body1.body.login_username;
          var _pass = body1.body.login_password;
          if( !_user || !_pass ){
            return next();
          }else{
            var b64auth = ( req.headers.authorization || '' ).split( ' ' )[1] || '';
            var [ user, pass ] = Buffer.from( b64auth, 'base64' ).toString().split( ':' );

            //. #41
            var hash = crypto.createHash( 'sha512' );
            hash.update( pass );
            var hash_pass = hash.digest( 'hex' );

            if( _user == user && _pass == hash_pass ){
              return next();
            }else{
              res.set( 'WWW-Authenticate', 'Basic realm="Qoodle"' );
              res.status(401).send( 'Authentication required.' );
            }
          }
        }else{
          res.set( 'WWW-Authenticate', 'Basic realm="Qoodle"' );
          res.status(401).send( 'Authentication required.' );
        }
      }
    });
  }else{
    return next();
  }
});

app.use( multer( { dest: './tmp/' } ).single( 'image' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. i18n
i18n.configure({
  locales: ['ja', 'en'],
  directory: __dirname + '/locales'
});
app.use( i18n.init );

var dbapi = require( './dbapi/dbapi' );
app.use( '/dbapi', dbapi );


//. login
app.get( '/appid/login', passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/',
  forceLogin: false //true
}));

//. callback
app.get( '/appid/callback', function( req, res, next ){
  next();
}, passport.authenticate( WebAppStrategy.STRATEGY_NAME )
);

//. logout
app.get( '/appid/logout', function( req, res ){
  WebAppStrategy.logout( req );
  res.redirect( '/' );
});

//. get user info
app.get( '/appid/user', async function( req, res ){
  //console.log( req.user );
  if( !req.user || !req.user.sub ){
    res.status( 401 );
    res.send( '' );
  }else{
    res.json({
      user: {
        id: req.user.sub,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
});


app.get( '/', function( req, res ){
  res.render( 'admin', {} );
});

app.get( '/draw', function( req, res ){
  var name = req.query.name;
  if( !name ){ name = '' + ( new Date() ).getTime(); }
  var room = req.query.room;
  if( !room ){ room = settings.defaultroom; }
  res.render( 'draw', { name: name, room: room } );
});

app.get( '/client', function( req, res ){
  var room = req.query.room;
  if( !room ){ room = settings.defaultroom; }
  res.render( 'client', { room: room } );
});

app.get( '/quizset', function( req, res ){
  var id = req.query.id;
  var room = req.query.room;
  if( !room ){ 
    room = ( new Date().getTime().toString(16) ) + Math.floor( 1000 * Math.random() ).toString(16);
    res.redirect( '/quizset?id=' + id + '&room=' + room );
  }else{
    res.render( 'quizset', { id: id, room: room } );
  }
});

app.post( '/setcookie', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var value = req.body.value;
  //console.log( 'value = ' + value );
  res.setHeader( 'Set-Cookie', value );

  res.write( JSON.stringify( { status: true }, 2, null ) );
  res.end();
});



//. socket.io
//. https://qiita.com/uranesu/items/8ee0dbe4e472f9fffa49
io.on( 'connection', function( socket ){
  socket.on( 'init_admin', function( msg ){
    //console.log( 'init_admin', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    socket.join( room );
    io.to(room).emit( 'init_admin_view', msg );
  });

  socket.on( 'init_client', function( msg ){
    //console.log( 'init_client', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    socket.join( room );
    io.to(room).emit( 'init_client_view', msg );
  });

  socket.on( 'image_client', function( msg ){
    //console.log( 'image_client', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    socket.join( room );
    io.to(room).emit( 'image_client_view', msg );
  });

  /*
  socket.on( 'quiz_correct', function( msg ){
    //console.log( 'quiz_correct', msg );
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_correct_view', msg );
  });
  */
});


function timestamp2datetime( ts ){
  if( ts ){
    var dt = new Date( ts );
    var yyyy = dt.getFullYear();
    var mm = dt.getMonth() + 1;
    var dd = dt.getDate();
    var hh = dt.getHours();
    var nn = dt.getMinutes();
    var ss = dt.getSeconds();
    var datetime = yyyy + '-' + ( mm < 10 ? '0' : '' ) + mm + '-' + ( dd < 10 ? '0' : '' ) + dd
      + ' ' + ( hh < 10 ? '0' : '' ) + hh + ':' + ( nn < 10 ? '0' : '' ) + nn + ':' + ( ss < 10 ? '0' : '' ) + ss;
    return datetime;
  }else{
    return "";
  }
}

//. unused..
async function getProfile( userId ){
  return new Promise( async ( resolve, reject ) => {
    if( access_token ){
      var headers1 = {
        accept: 'application/json',
        authorization: 'Bearer ' + access_token
      };
      var option1 = {
        url: 'https://' + settings.region + '.appid.cloud.ibm.com/management/v4/' + settings.tenantId + '/users/' + userId + '/profile',
        method: 'GET',
        headers: headers1
      };
      request( option1, ( err1, res1, body1 ) => {
        if( err1 ){
          console.log( 'err1', err1 );
          reject( err1 );
        }else{
          var profile = JSON.parse( body1 );
          //console.log( JSON.stringify( profile, null, 2 ) );
          resolve( { status: true, profile: profile } );
        }
      });
    }else{
      reject( 'no access token' );
    }
  });
}


//app.listen( appEnv.port );
var port = process.env.PORT || 8080;
var ports = 8443;
http.listen( port );
if( https ){
  https.listen( ports );
}
console.log( "server starting on " + port + "/" + ports + " ..." );

if( settings.db_username && settings.db_password ){
  var dashboard_url = 'https://' + settings.db_username + ':' + settings.db_password + '@' + settings.db_username + '.cloudant.com/dashboard.html';
  console.log( "DB Dashboard: " + dashboard_url );
}
