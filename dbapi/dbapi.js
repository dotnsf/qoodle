//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    crypto = require( 'crypto' ),
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

        //. #38
        var ts = ( new Date() ).getTime();
        var params = {
          _id: 'test',
          type: 'quizset',
          subject: 'test',
          quiz_ids: [],
          user_id: 'qoodle@teyan.de',
          user_name: 'Qoodle',
          login_username: '',
          login_password: '',
          crated: ts,
          updated: ts
        };
        db_quizset.insert( params, function( err, body, header ){});
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
    var id = generateId();
    var ts = ( new Date() ).getTime();
    var category = req.body.category ? parseInt( req.body.category ) : 0;
    var point = req.body.point ? parseInt( req.body.point ) : 1;
    var body = req.body.body ? req.body.body : '';
    var comment = req.body.comment ? req.body.comment : '';
    var img_url = req.body.img_url ? req.body.img_url : '';
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      _id: id,
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
            body1.category = parseInt( category );
          }
          if( point ){
            body1.point = parseInt( point );
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
    var id = generateId();
    var ts = ( new Date() ).getTime();
    var quiz_ids = req.body.quiz_ids ? req.body.quiz_ids : [];
    var subject = req.body.subject ? req.body.subject : '';
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var login_username = req.body.login_username ? req.body.login_username : '';
    var login_password = req.body.login_password ? req.body.login_password : '';

    //. #41
    var hash = crypto.createHash( 'sha512' );
    hash.update( login_password );
    var hash_password = hash.digest( 'hex' );

    var params = {
      _id: id,
      type: 'quizset',
      subject: subject,
      quiz_ids: quiz_ids,
      user_id: user_id,
      user_name: user_name,
      login_username: login_username,
      login_password: hash_password,
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
        var include_docs = req.query.include_docs;
        if( include_docs && db_quiz ){
          db_quiz.list( { include_docs: true }, function( err2, body2, header2 ){
            if( err2 ){
              var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
              res.write( p );
              res.end();
            }else{
              body1.quizs = [];
              body2.rows.forEach( function( quiz ){
                var _quiz = JSON.parse(JSON.stringify(quiz.doc));
                if( body1.quiz_ids.indexOf( _quiz._id ) > -1 ){
                  body1.quizs.push( _quiz );
                }
              });
              var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
          res.write( p );
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

router.get( '/quizsets', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_quizset ){
    var user_id = req.query.user_id;
    if( user_id ){
      //. Cloudant から取得
      db_quizset.list( { include_docs: true }, function( err1, body1, header1 ){
        if( err1 ){
          err1.image_id = "error-1";
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err1 } ) );
          res.end();
        }else{
          var quizsets = [];
          var quizset_id = req.query.quizset_id;
          if( quizset_id ){
            body1.rows.forEach( function( quizset ){
              var _quizset = JSON.parse(JSON.stringify(quizset.doc));
              if( _quizset.user_id == user_id && _quizset.quizset_id == quizset_id ){
                quizsets.push( _quizset );
              }
            });
          }else{
            body1.rows.forEach( function( quizset ){
              var _quizset = JSON.parse(JSON.stringify(quizset.doc));
              if( _quizset.user_id == user_id ){
                quizsets.push( _quizset );
              }
            });
          }
          var p = JSON.stringify( { status: true, quizsets: quizsets }, null, 2 );
          res.write( p );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'parameter user_id required.' } ) );
      res.end();
    }
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
        console.log( err1 );
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var ts = ( new Date() ).getTime();
        var subject = req.body.subject ? req.body.subject : '';
        var quiz_ids = req.body.quiz_ids ? req.body.quiz_ids : [];
        var quiz_login_username = req.body.login_username ? req.body.login_username : '';
        var quiz_login_password = req.body.login_password ? req.body.login_password : '';
        if( body1.user_id == req.body.user_id ){
          if( quiz_ids ){
            body1.quiz_ids = quiz_ids;
          }
          if( subject ){
            body1.subject = subject;
          }
          if( quiz_login_username ){
            body1.login_username = quiz_login_username;
          }
          if( quiz_login_password ){
            //. #41
            var hash = crypto.createHash( 'sha512' );
            hash.update( quiz_login_password );
            var hash_password = hash.digest( 'hex' );
            body1.login_password = hash_password;
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
router.post( '/answer_bulk', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var quizset_id = req.body.quizset_id ? req.body.quizset_id : null;
    var answers = req.body.answers ? req.body.answers : null;
    if( quizset_id && answers ){
      var docs = [];
      Object.keys( answers ).forEach( function( quiz_id ){
        var o = answers[quiz_id];
        Object.keys( o ).forEach( function( uuid ){
          var point = parseInt( o[uuid].point );
          if( !o[uuid].correct || o[uuid].correct != 'true' ){
            point = 0;
          }
          var id = generateId();
          var ts = ( new Date() ).getTime();
          var doc = {
            _id: id,
            type: 'answer',
            quiz_id: quiz_id,
            quizset_id: quizset_id,
            point: point,
            user_id: uuid,
            user_name: '',
            crated: ts,
            updated: ts
          };
          docs.push( doc );
        });
      });

      if( docs.length > 0 ){
        db_answer.bulk( { docs: docs }, function( err, body, header ){
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
        res.write( JSON.stringify( { status: false, error: 'no docs generated.' } ) );
        res.end();
      }
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'parameter answers not specified.' } ) );
      res.end();
    }
    /*
     * user_name ?
     * correct ?
     *
     answers = {
       quiz_id: {
         uuid: {
	         point: 10,
	         correct: true
	       },
         uuid: {
	         point: 5,
	         correct: false
	       }, 
	         :
       },
       quiz_id: {
       },
        :
     }
     */
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.post( '/answer', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db_answer ){
    var id = generateId();
    var ts = ( new Date() ).getTime();

    var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
    var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
    var point = req.body.point ? req.body.point : 0;
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    if( typeof point == 'string' ){
      point = parseInt( point );
    }
    var params = {
      _id: id,
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
        if( typeof point == 'string' ){
          point = parseInt( point );
        }
        if( body1.user_id == user_id ){
          if( quiz_id ){
            body1.quiz_id = quiz_id;
          }
          if( quizset_id ){
            body1.quizset_id = quizset_id;
          }
          body1.point = point;
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

    var id = generateId();
    var ts = ( new Date() ).getTime();
    var quiz_id = req.body.quiz_id ? req.body.quiz_id : '';
    var quizset_id = req.body.quizset_id ? req.body.quizset_id : '';
    var user_id = req.body.user_id ? req.body.user_id : '';
    var user_name = req.body.user_name ? req.body.user_name : '';
    var params = {
      _id: id,
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

function generateId(){
  var s = 1000;
  var id = ( new Date().getTime().toString(16) ) + Math.floor( s * Math.random() ).toString(16);

  return id;
}


module.exports = router;
