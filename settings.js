var request = require( 'request' );
exports.db_username = '';
exports.db_password = '';
exports.db_name_quiz = 'qoodle_quiz';
exports.db_name_quizset = 'qoodle_quizset';
exports.db_name_answer = 'qoodle_answer';
exports.db_name_image = 'qoodle_image';

exports.admin_username = 'admin';
exports.admin_password = 'password';

exports.defaultroom = 'default';

//. IBM App ID
exports.region = 'us-south';
exports.tenantId = '';
exports.apiKey = '';
exports.secret = '';
exports.clientId = '';
exports.oauthServerUrl = '';
exports.redirectUri = 'http://localhost:8080/appid/callback';

if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.cloudantNoSQLDB ){
    exports.db_username = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.username;
    exports.db_password = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.password;
  }
}
