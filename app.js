//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    i18n = require( 'i18n' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    uuidv1 = require( 'uuid/v1' ),
    app = express();
var http = require( 'http' ).createServer( app );
var io = require( 'socket.io' ).listen( http );

var settings = require( './settings' );

app.all( '/admin', basicAuth( function( user, pass ){
  if( settings.admin_username && settings.admin_password ){
    return ( settings.admin_username === user && settings.admin_password === pass );
  }else{
    return false;
  }
}));

app.all( '/quiz', basicAuth( function( user, pass ){
  if( settings.admin_username && settings.admin_password ){
    return ( settings.admin_username === user && settings.admin_password === pass );
  }else{
    return false;
  }
}));

app.all( '/classicview', basicAuth( function( user, pass ){
  if( settings.admin_username && settings.admin_password ){
    return ( settings.admin_username === user && settings.admin_password === pass );
  }else{
    return false;
  }
}));

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


app.get( '/admin', function( req, res ){
  res.render( 'admin', {} );
});

app.get( '/draw', function( req, res ){
  var name = req.query.name;
  if( !name ){ name = '' + ( new Date() ).getTime(); }
  var room = req.query.room;
  if( !room ){ room = settings.defaultroom; }
  res.render( 'draw', { name: name, room: room } );
});

app.get( '/quizset', function( req, res ){
  var id = req.query.id;
  var room = req.query.room;
  if( !room ){ room = settings.defaultroom; }
  var columns = req.query.columns;
  if( columns ){
    columns = parseInt( columns );
  }else{
    columns = settings.defaultcolumns;
  }
  res.render( 'quizset', { id: id, room: room, columns: columns } );
});

app.get( '/share', function( req, res ){
  var room = req.query.room;
  if( !room ){ room = settings.defaultroom; }
  var columns = req.query.columns;
  if( columns ){
    columns = parseInt( columns );
  }else{
    columns = settings.defaultcolumns;
  }
  res.render( 'share', { room: room, columns: columns } );
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

  socket.on( 'init_share', function( msg ){
    //console.log( 'init_share', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    socket.join( room );
    io.to(room).emit( 'init_share_view', msg );
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

  socket.on( 'quiz_select', function( msg ){
    //console.log( 'quiz_select', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_select_view', msg );
  });

  socket.on( 'quiz_hint', function( msg ){
    //console.log( 'quiz_hint', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_hint_view', msg );
  });

  socket.on( 'quiz_finish', function( msg ){
    //console.log( 'quiz_finish', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_finish_view', msg );
  });

  socket.on( 'quiz_fixed', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_fixed_view', msg );
  });

  socket.on( 'quiz_correct', function( msg ){
    //console.log( 'quiz_correct', msg );
    //. 機能的には io.to(target_socket_id).emit() でもいけるが、共有画面にも反映したいので room へ送り、クライアント側で判断する
    //var target_socket_id = msg.target_socket_id;
    //msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'quiz_correct_view', msg );
  });

  socket.on( 'show_answers', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'show_answers_view', msg );
  });

  socket.on( 'hide_answers', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'hide_answers_view', msg );
  });

  socket.on( 'show_rank', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'show_rank_view', msg );
  });

  socket.on( 'hide_rank', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'hide_rank_view', msg );
  });

  socket.on( 'lock_answer', function( msg ){
    //console.log( 'quiz_fixed', msg );
    msg.socket_id = socket.id;
    var room = msg.room ? msg.room : settings.defaultroom;
    io.to(room).emit( 'lock_answer_view', msg );
  });
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


//app.listen( appEnv.port );
var port = process.env.PORT || 8080;
http.listen( port );
console.log( "server starting on " + port + " ..." );

if( settings.db_username && settings.db_password ){
  var dashboard_url = 'https://' + settings.db_username + ':' + settings.db_password + '@' + settings.db_username + '.cloudant.com/dashboard.html';
  console.log( "DB Dashboard: " + dashboard_url );
}
