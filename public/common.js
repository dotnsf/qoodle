

function selectCard( msg/*socket_id*/ ){
  console.log( 'selectCard: ', msg );
  //$('#card_'+socket_id).css( 'display', 'none' );
  if( msg.correct ){
    $('#card_'+msg.socket_id).removeClass( 'border-secondary' );
    $('#card_'+msg.socket_id).removeClass( 'border-warning' );
    $('#a_'+msg.socket_id).removeClass( 'btn-secondary' );
    $('#a_'+msg.socket_id).removeClass( 'btn-warning' );
    $('#card_'+msg.socket_id).addClass( 'border-success' );
    $('#a_'+msg.socket_id).addClass( 'btn-success' );
  }else{
    $('#card_'+msg.socket_id).removeClass( 'border-secondary' );
    $('#card_'+msg.socket_id).removeClass( 'border-success' );
    $('#a_'+msg.socket_id).removeClass( 'btn-secondary' );
    $('#a_'+msg.socket_id).removeClass( 'btn-success' );
    $('#card_'+msg.socket_id).addClass( 'border-warning' );
    $('#a_'+msg.socket_id).addClass( 'btn-warning' );
  }
}

function generateColor( name ){
  var arr = [ 'primary', 'secondary', 'success', 'danger', 'warning', 'info', /*'light',*/ 'dark' ];
  var r = 0;
  for( var i = 0; i < name.length; i ++ ){
    var c = name.charCodeAt( i );
    r += c;
  }
  r = r % arr.length;

  //return arr[r];
  return arr[1];
}

function generateUUID(){
  //. Cookie の値を調べて、有効ならその値で、空だった場合は生成する
  var did = null;
  cookies = document.cookie.split(";");
  for( var i = 0; i < cookies.length; i ++ ){
    var str = cookies[i].split("=");
    var une = unescape( str[0] );
    if( une == " deviceid" || une == "deviceid" ){
      did = unescape( unescape( str[1] ) );
    }
  }

  if( did == null ){
    var s = 1000;
    did = ( new Date().getTime().toString(16) ) + Math.floor( s * Math.random() ).toString(16);
  }

  var dt = ( new Date() );
  var ts = dt.getTime();
  ts += 1000 * 60 * 60 * 24 * 365 * 100; //. 100 years
  dt.setTime( ts );
  var value = ( "deviceid=" + did + '; expires=' + dt.toUTCString() + '; path=/' );
  if( isMobileSafari() ){
    $.ajax({
      url: '/setcookie',
      type: 'POST',
      data: { value: value },
      success: function( r ){
        //console.log( 'success: ', r );
      },
      error: function( e0, e1, e2 ){
        //console.log( 'error: ', e1, e2 );
      }
    });
  }else{
    document.cookie = ( value );
    //console.log( 'value: ', value );
  }

  return did;
}

function isMobileSafari(){
  return ( navigator.userAgent.indexOf( 'Safari' ) > 0 && navigator.userAgent.indexOf( 'Mobile' ) > 0 );
}

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
