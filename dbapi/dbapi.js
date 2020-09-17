//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    i18n = require( 'i18n' ),
    multer = require( 'multer' ),
    uuidv1 = require( 'uuid/v1' );
var router = express.Router();

var settings = require( '../settings' );

var db_quiz = null;
var db_quizset = null;
var db_answer = null;
var db_image = null;
var cloudant = null;
if( settings.db_username && settings.db_password ){
  cloudant = cloudantlib( { account: settings.db_username, password: settings.db_password } );
  if( cloudant ){
    cloudant.db.get( settings.db_name_quiz, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name_quiz, function( err, body ){
            if( err ){
              db_quiz = null;
            }else{
              db_quiz = cloudant.db.use( settings.db_name_quiz );
            }
          });
        }else{
          db_quiz = cloudant.db.use( settings.db_name_quiz );
        }
      }else{
        db_quiz = cloudant.db.use( settings.db_name_quiz );
      }
    });
    cloudant.db.get( settings.db_name_quizset, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name_quizset, function( err, body ){
            if( err ){
              db_quizset = null;
            }else{
              db_quizset = cloudant.db.use( settings.db_name_quizset );
            }
          });
        }else{
          db_quizset = cloudant.db.use( settings.db_name_quizset );
        }
      }else{
        db_quizset = cloudant.db.use( settings.db_name_quizset );
      }
    });
    cloudant.db.get( settings.db_name_answer, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name_answer, function( err, body ){
            if( err ){
              db_answer = null;
            }else{
              db_answer = cloudant.db.use( settings.db_name_answer );
            }
          });
        }else{
          db_answer = cloudant.db.use( settings.db_name_answer );
        }
      }else{
        db_answer = cloudant.db.use( settings.db_name_answer );
      }
    });
    cloudant.db.get( settings.db_name_image, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name_image, function( err, body ){
            if( err ){
              db_image = null;
            }else{
              db_image = cloudant.db.use( settings.db_name_image );
            }
          });
        }else{
          db_image = cloudant.db.use( settings.db_name_image );
        }
      }else{
        db_image = cloudant.db.use( settings.db_name_image );
      }
    });
  }
}

router.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );


//. quiz
router.post( '/quiz', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quiz ){
    var ts = ( new Date() ).getTime();
    var category = req.body.category ? req.body.category : 0;
    var point = req.body.point ? req.body.point : 1;
    var body = req.body.body ? req.body.body : '';
    var comment = req.body.comment ? req.body.comment : '';
    var img_url = req.body.img_url ? req.body.img_url : '';
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      type: 'quiz',
      category: category,
      point: point,
      body: body,
      comment: comment,
      img_url: img_url,
      user_id: user_id,
      user_name: user_name,
      crated: ts,
      updated: ts
    };
    db_quiz.insert( params, function( err, body, header ){
      if( err ){
        console.log( err );
        var p = JSON.stringify( { status: false, error: err }, null, 2 );
        res.status( 400 );
        res.write( p );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/quiz/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quiz ){
    var id = req.params.id;

    //. Cloudant から削除
    db_quiz.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/quizs', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quiz ){
    //. Cloudant から削除
    db_quiz.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var quizs = [];
        var user_id = req.query.user_id;
        if( user_id ){
          body1.rows.forEach( function( quiz ){
            var _quiz = JSON.parse(JSON.stringify(quiz.doc));
            if( _quiz.user_id == user_id ){
              quizs.push( _quiz );
            }
          });
        }else{
          body1.rows.forEach( function( quiz ){
            var _quiz = JSON.parse(JSON.stringify(quiz.doc));
            quizs.push( _quiz );
          });
        }
        var p = JSON.stringify( { status: true, quizs: quizs }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/quiz/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quiz ){
    var id = req.params.id;

    //. Cloudant から更新
    db_quiz.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var ts = ( new Date() ).getTime();
        var category = req.body.category ? req.body.category : 0;
        var point = req.body.point ? req.body.point : 1;
        var body = req.body.body ? req.body.body : '';
        var comment = req.body.comment ? req.body.comment : '';
        var img_url = req.body.img_url ? req.body.img_url : '';
        var user_id = req.body.user_id ? req.body.user_id : '';

        if( body1.user_id == user_id ){
          if( category ){
            body1.category = category;
          }
          if( point ){
            body1.point = point;
          }
          if( body ){
            body1.body = body;
          }
          if( comment ){
            body1.comment = comment;
          }
          if( img_url ){
            body1.img_url = img_url;
          }
          body1.updated = ts;
          db_quiz.insert( body1, function( err, body, header ){
            if( err ){
              console.log( err );
              var p = JSON.stringify( { status: false, error: err }, null, 2 );
              res.status( 400 );
              res.write( p );
              res.end();
            }else{
              var p = JSON.stringify( { status: true, body: body }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
          res.end();
        }
      }

    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/quiz/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quiz ){
    var id = req.params.id;

    //. Cloudant から削除
    db_quiz.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }

      var user_id = req.body.user_id ? req.body.user_id : '';
      if( body1.user_id == user_id ){
        var rev = body1._rev;
        db_quiz.destroy( id, rev, function( err2, body2, header2 ){
          if( err2 ){
            err2.image_id = "error-2";
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err2 } ) );
            res.end();
          }

          body2.quiz_id = id;
          res.write( JSON.stringify( { status: true, body: body2 } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});


//. quizset
router.post( '/quizset', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    var ts = ( new Date() ).getTime();
    var quiz_ids = req.body.quiz_ids ? req.body.quiz_ids : [];
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      type: 'quizset',
      quiz_ids: quiz_ids,
      user_id: user_id,
      user_name: user_name,
      crated: ts,
      updated: ts
    };
    db_quizset.insert( params, function( err, body, header ){
      if( err ){
        console.log( err );
        var p = JSON.stringify( { status: false, error: err }, null, 2 );
        res.status( 400 );
        res.write( p );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/quizset/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    var id = req.params.id;

    //. Cloudant から取得
    db_quizset.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/quizsets', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    //. Cloudant から削除
    db_quizset.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var quizsets = [];
        var user_id = req.query.user_id;
        if( user_id ){
          body1.rows.forEach( function( quizset ){
            var _quizset = JSON.parse(JSON.stringify(quizset.doc));
            if( _quizset.user_id == user_id ){
              quizsets.push( _quizset );
            }
          });
        }else{
          body1.rows.forEach( function( quizset ){
            var _quizset = JSON.parse(JSON.stringify(quizset.doc));
            quizsets.push( _quizset );
          });
        }
        var p = JSON.stringify( { status: true, quizsets: quizsets }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/quizset/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    var id = req.params.id;

    //. Cloudant から更新
    db_quizset.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var ts = ( new Date() ).getTime();
        var quiz_ids = req.body.quiz_ids ? req.body.quiz_ids : [];
        if( body1.user_id == req.body.user_id ){
          if( quiz_ids ){
            body1.quiz_ids = quiz_ids;
          }
          body1.updated = ts;
          db_quizset.insert( body1, function( err, body, header ){
            if( err ){
              console.log( err );
              var p = JSON.stringify( { status: false, error: err }, null, 2 );
              res.status( 400 );
              res.write( p );
              res.end();
            }else{
              var p = JSON.stringify( { status: true, body: body }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/quizset/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    var id = req.params.id;

    //. Cloudant から削除
    db_quizset.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }

      var user_id = req.body.user_id ? req.body.user_id : '';
      if( body1.user_id == user_id ){
        var rev = body1._rev;
        db_quizset.destroy( id, rev, function( err2, body2, header2 ){
          if( err2 ){
            err2.image_id = "error-2";
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err2 } ) );
            res.end();
          }

          body2.quiz_id = id;
          res.write( JSON.stringify( { status: true, body: body2 } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});


//. answer
router.post( '/answer', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var ts = ( new Date() ).getTime();
    var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
    var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
    var point = req.body.point ? req.body.point : 0;
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      type: 'answer',
      quiz_id: quiz_id,
      quizset_id: quizset_id,
      point: point,
      user_id: user_id,
      user_name: user_name,
      crated: ts,
      updated: ts
    };
    db_answer.insert( params, function( err, body, header ){
      if( err ){
        console.log( err );
        var p = JSON.stringify( { status: false, error: err }, null, 2 );
        res.status( 400 );
        res.write( p );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/answer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var id = req.params.id;

    //. Cloudant から取得
    db_answer.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/answers', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    //. Cloudant から削除
    db_answer.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var answers = [];
        var user_id = req.query.user_id;
        if( user_id ){
          body1.rows.forEach( function( answer ){
            var _answer = JSON.parse(JSON.stringify(answer.doc));
            if( _answer.user_id == user_id ){
              answers.push( _answer );
            }
          });
        }else{
          var quizset_id = req.query.quizset_id;
          if( quizset_id ){
            body1.rows.forEach( function( answer ){
              var _answer = JSON.parse(JSON.stringify(answer.doc));
              if( _answer.quizset_id == quizset_id ){
                answers.push( _answer );
              }
            });
          }else{
            body1.rows.forEach( function( answer ){
              var _answer = JSON.parse(JSON.stringify(answer.doc));
              answers.push( _answer );
            });
          }
        }
        var p = JSON.stringify( { status: true, answers: answers }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/answer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var id = req.params.id;

    //. Cloudant から更新
    db_answer.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var ts = ( new Date() ).getTime();
        var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
        var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
        var point = req.body.point ? req.body.point : 0;
        var user_id = req.body.user_id ? req.body.user_id : '';
        if( body1.user_id == user_id ){
          if( quiz_id ){
            body1.quiz_id = quiz_id;
          }
          if( quizset_id ){
            body1.quizset_id = quizset_id;
          }
          if( point ){
            body1.point = point;
          }
          body1.updated = ts;
          db_answer.insert( body1, function( err, body, header ){
            if( err ){
              console.log( err );
              var p = JSON.stringify( { status: false, error: err }, null, 2 );
              res.status( 400 );
              res.write( p );
              res.end();
            }else{
              var p = JSON.stringify( { status: true, body: body }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
          res.end();
        }
      }

    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/answer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var id = req.params.id;

    //. Cloudant から削除
    db_answer.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }

      var user_id = req.body.user_id ? req.body.user_id : '';
      if( body1.user_id == user_id ){
        var rev = body1._rev;
        db_answer.destroy( id, rev, function( err2, body2, header2 ){
          if( err2 ){
            err2.image_id = "error-2";
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err2 } ) );
            res.end();
          }

          body2.quiz_id = id;
          res.write( JSON.stringify( { status: true, body: body2 } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});


//. image
router.post( '/image', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_image ){
    var imgpath = req.file.path;
    var imgtype = req.file.mimetype;

    var img = fs.readFileSync( imgpath );
    var img64 = new Buffer( img ).toString( 'base64' );

    var ts = ( new Date() ).getTime();
    var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
    var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      type: 'image',
      quiz_id: quiz_id,
      quizset_id: quizset_id,
      user_id: user_id,
      user_name: user_name,
      crated: ts,
      updated: ts,
      _attachments: {
        image: {
          content_type: imgtype,
          data: img64
        }
      }
    };
    db_image.insert( params, function( err, body, header ){
      fs.unlink( imgpath, function( err ){} );
      if( err ){
        console.log( err );
        var p = JSON.stringify( { status: false, error: err }, null, 2 );
        res.status( 400 );
        res.write( p );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/image/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_image ){
    var id = req.params.id;

    //. Cloudant から取得
    if( req.query.view ){
      db_image.attachment.get( id, 'image', function( err1, body1 ){
        if( err1 ){
          err1.image_id = "error-1";
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err1 } ) );
          res.end();
        }else{
          res.contentType( 'image/png' );
          res.end( body1, 'binary' );
        }
      });
    }else{
      db_image.get( id, { include_docs: true }, function( err1, body1, header1 ){
        if( err1 ){
          err1.image_id = "error-1";
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err1 } ) );
          res.end();
        }else{
          var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
          res.write( p );
          res.end();
        }
      });
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/images', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_image ){
    //. Cloudant から削除
    db_image.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var images = [];
        var user_id = req.query.user_id;
        if( user_id ){
          body1.rows.forEach( function( image ){
            var _image = JSON.parse(JSON.stringify(image.doc));
            if( _image.user_id == user_id ){
              images.push( _image );
            }
          });
        }else{
          var quizset_id = req.query.quizset_id;
          if( quizset_id ){
            body1.rows.forEach( function( image ){
              var _image = JSON.parse(JSON.stringify(image.doc));
              if( _image.quizset_id == quizset_id ){
                images.push( _image );
              }
            });
          }else{
            body1.rows.forEach( function( image ){
              var _image = JSON.parse(JSON.stringify(image.doc));
              images.push( _image );
            });
          }
        }
        var p = JSON.stringify( { status: true, images: images }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/image/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_image ){
    var id = req.params.id;

    //. Cloudant から更新
    db_image.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var imgpath = req.file.path;
        var imgtype = req.file.mimetype;

        var img = fs.readFileSync( imgpath );
        var img64 = new Buffer( img ).toString( 'base64' );

        var ts = ( new Date() ).getTime();
        var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
        var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
        var user_id = req.body.user_id ? req.body.user_id : '';
        var user_name = req.body.user_name ? req.body.user_name : '';
        if( body1.user_id == user_id ){
          if( quiz_id ){
            body1.quiz_id = quiz_id;
          }
          if( quizset_id ){
            body1.quizset_id = quizset_id;
          }
          if( user_name ){
            body1.user_name = user_name;
          }
          body1.updated = ts;
          body1['_attachments'] = {
            image: {
              content_type: imgtype,
              data: img64
            }
          };
          db_image.insert( body1, function( err, body, header ){
            fs.unlink( imgpath, function( err ){} );
            if( err ){
              console.log( err );
              var p = JSON.stringify( { status: false, error: err }, null, 2 );
              res.status( 400 );
              res.write( p );
              res.end();
            }else{
              var p = JSON.stringify( { status: true, body: body }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          fs.unlink( imgpath, function( err ){} );
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/image/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_image ){
    var id = req.params.id;

    //. Cloudant から削除
    db_image.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }

      var user_id = req.body.user_id ? req.body.user_id : '';
      if( body1.user_id == user_id ){
        var rev = body1._rev;
        db_image.destroy( id, rev, function( err2, body2, header2 ){
          if( err2 ){
            err2.image_id = "error-2";
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err2 } ) );
            res.end();
          }

          body2.quiz_id = id;
          res.write( JSON.stringify( { status: true, body: body2 } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no permission.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
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


module.exports = router;
