var checktype = ['username','email'];

/* --active_page--
 feed
 profile
 idea
 
  */
var active_page = 'feed';


var originalIdea = {
    title:$('#idea_title').val(),
    description:$('#idea_description').val(),
    city:$('#idea_location').val(),
    state:$('#idea_state').val(),
    country:$('#idea_country').val(),
    //coordinates maybe later
    active:$('#idea_active').val()
};

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie( name ) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


$(document).ready(function(){
	
	checkLogin();
	if(readCookie('user')){
		
		$('#logged-user').text(readCookie('user'));
		
	}
	console.log('cookie ='+readCookie('user'));
   // console.log(checktype[0]);
    //console.log(checktype[1]);
    
//    renderProfile('charlie');
    	 	
     		
    //idea feed
    switch (active_page){
    	case 'feed':
    	//	ideaFeed();
    	break;
    	case 'profile':
    		//renderProfile('charlie');
    	break;
    }
    
     		
     		
});

function ideaFeed(){
	var feedSort = 'date';
	var feeddata = {
        action:'feed',
        sortby: feedSort,
        idea_count:10,
        idea_offset:0
    };
     		
    $.ajax
    ({
        type:"POST",
        data:feeddata,
        url:"app.php"
    }).done(function(feedback){
        var ideas = $.parseJSON(feedback);
        
        //console.log(ideas);
       // console.log(ideas.length + ' ideas');
        var text = '';
     			
        for(i=0; i < ideas.length; i++){
     	 //   $('#maincontent').load('../test/addis_components/feeditem.html');
           // $('#maincontent').append('<div class=\'idea\'> <div>');
         //   console.log(ideas[i].TITLE + " Likes:"+ideas[i].LIKES );	
     				
        }
     		//$('#maincontent').loadTemplate('#feedTMPL');//../test/addis_components/feeditem.html');
     		var ideatest = 
     		console.log('ideas count again ' + ideas.length);
     		
     		window.onload = function() {
     			

				//var url ='www.site.com/index.php#hello';
			
     			var data =[];
     			//data.push(ideas);
 				for(i=0; i < ideas.length; i++){
 				//	$('.feeditem:nth-type-of('+i+')')
 					//	.find('feedcontent .title').text(ideas[i].TITLE).end()
 						//.find('.socialbar .user-likes .badge').text(ideas[i].LIKES).end()
 						//.find('.socialbar .user-views .badge').text(ideas[i].VIEWS).end()
 						//.find('.socialbar .user-comments .badge').text(ideas[i].COMMENTS);	
            		//$('.feedcontent .title').text(ideas[i].TITLE);	
            		//$('.socialbar .user-likes .badge').text(ideas[1].LIKES);	
            		//$('.socialbar .user-views .badge').text(ideas[1].VIEWS);
            		//$('.socialbar .user-comments .badge').text(ideas[1].COMMENTS);
            		//LOCATION = ideas[i].LOCATION_CITY+'   '+ideas[i].LOCATION_STATE_PROV+'   '+ideas[i].LOCATION_COUNTRY ;
            		//ideas[i].push(LOCATION);
            		//console.log('location: '+LOCATION);
            		data.push(ideas[i]);
            		}
        	//	$('#maincontent').loadTemplate($('#feedTMPL'), ideas);
        	//	console.log(data);
        		//}
 				
 			};
     	  
				
    });
}
             
$('#reg-email').keyup(function(){
    var em = $(this).val();
    var stat = 'email';
     if(em){
     		$('#reg-error').removeClass('hidden');
     		showHint(em, stat);
     }
    	
});
                   
                   
$('#reg-username').keyup(function(){
    var un = $(this).val();
    var stat = 'username';
  //  console.log('type is '+stat);
  if(un)
  {	
  		$('#reg-error').removeClass('hidden');
    	showHint(un, stat);
  }
});
     
$('#reg-password, #reg-confirm').keyup(function()
{
	checkPass();
	});    
           
$('#register_submitbtn').click(function(event){
 	
    event.preventDefault();
    if($('#reg-password').val()===$('#reg-confirm').val()){
 		if(!$('#reg-error').innerHTML){
 			registerUser($('#reg-username').val(),$('#reg-email').val(),$('#reg-password').val());
 			location.reload();
 		}
 		else{
 			$('#reg-error').innerHTML = 'There were errors. Either the username already';
 		}
        
       // console.log($('#password').val());
        console.log('submitted form');	
    }
    else{
        console.log('be sure that the password confirmation matches');
    }
    //return false;
});   
 
$('#login_submitbtn').click(function(event){
 	
    event.preventDefault();
 
 		
    loginUser($('#login-username').val(),$('#login-password').val());
    var user = readCookie('user');
    console.log($('#login-password').val());
    if(user)
   		$('#myModal').modal('toggle');
   

});    

$('#logout').click(function(event){
	logoutUser('user');
});
//  
// $('#idea_submitbtn').click(function(event){
//  	
    // event.preventDefault();
//  
//  		
    // newIdea($('#idea_title').val(),$('#idea_desc').val());
    // console.log($('#idea_title').val());
    // console.log('submitted idea form');	
// 
// });      

//profile
$('#logged-user').click(function(){
	renderProfile('charlie');
});
	
               
function showHint(str, ct) {
    if (str.length == 0) { 
        document.getElementById("txtHint").innerHTML = "";
        return;
    } else {
     	
    
     	
        var data = {
            q:str ,
            checktype:ct,
            action:'check'
     		
        };
     	
        $.ajax({
            type:"GET",
            data:data,
            url:"app.php"
        }).done(function(feedback){
            document.getElementById("reg-error").innerHTML = feedback;
        });
        
    }
}

function registerUser(username, email, password){
	
    console.log('username:'+username);
    console.log('password:'+password);
    console.log('email:'+email);
    var data = {
        un:username ,
        em:email,
        pw:password,
        action:'register'
     		
    };
     	
    $.ajax({
        type:"POST",
        data:data,
        url:"app.php"
    }).done(function(feedback){
    	if(feedback==true){
    		console.log('User created = '+feedback);
    		
    	}
    	else{
    		console.log('User not created = '+feedback);
    	}
    	
       // document.getElementById("txtHint").innerHTML = feedback;
    });
    
}

function loginUser(username, password){
	
    var data = {
        un:username,
        pw:password,
        action:'login'
     		
    };
     	//console.log('username and password before login '+data.un +', '+data.pw );
    $.ajax({
        type:"POST",
        data:data,
        url:"app.php"
    }).done(function(feedback){
    	
    	//var user=$.parseJSON(feedback);
    	//console.log('feedback'+user);
    	if(feedback){
        	//document.getElementById("maincontent").innerHTML = 'true'; //'<h3>'+user.username+'</h3>';
        	location.reload();
        	}
        else 
        {
        	$('#login-error').removeClass('hidden');
        }
    });
}

function logoutUser(){
	deleteCookie('user');
	location.reload();
}


function newIdea(title, description){
	
    var data = {
     		
        title:title,
        description:description,
        action:'idea'
     		
    };
     	
    $.ajax({
        type:"POST",
        data:data,
        url:"app.php"
    }).done(function(feedback){
        document.getElementById("idea_txtHint").innerHTML = feedback;
    });
}

function updateIdea(action) {

    switch (action) {
        case 'description':
            if ($('#idea_title_u').val() == $('.idea .idea_title').val()) {
                var idea = {
                    title: $('#idea_title_u').val(),
                    description: $('#idea_description_u').val(),
                    action: 'description'
                };
            }
            else {
                var idea = {
                    original_title: $('.idea .idea_title'),
                    title: $('#idea_title_u').val(),
                    description: $('#idea_description_u').val(),
                    action: 'description'
                };
            }


            $.ajax({
                type: "POST",
                data: idea,
                url: "app.php"
            }).done(function (feedback) {
                document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
            });
            break;
            //end of update description case
        case 'img':
            var idea = {
                title: $('#idea_title_u').val(),
                img: $('#idea_path').val(),
                action: 'img'
            };
            break;

    }
}

    function ideaProcedure(action, idea) {

        switch (action) {

            case 'idea_like': //ideatitle, 
            case 'delete_like':
            case 'idea_view':
                var idea = {
                    title: idea.TITLE,
                    action: action
                };
                $.ajax({
                    type: "POST",
                    data: idea,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;
            case 'idea_topic':
            case 'delete_idea_topic':
                var idea = {
                    title: idea.title,
                    action: action,
                    topicname: $('.topic').val()
                };
                $.ajax({
                    type: "POST",
                    data: idea,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;
            case 'addressed_to':
            case 'delete_addressed_to':
                var idea = {
                    title: idea.title,
                    action: action,
                    stakeholder: $('.stakeholder').val()
                };
                $.ajax({
                    type: "POST",
                    data: idea,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;
        }
    }
    function userUpdate(action, content) {
        /*case 'about':
		case 'profession':
		case 'password':
		case 'username':
		case 'user_topic':
		case 'user_topic_delete':
		case 'user_privacy':
		case 'dob':
		case 'email':
		case 'img':*/
        var data = {
            content: content
        };

        $.ajax({
            type: "POST",
            data: data,
            url: "app.php"
        }).done(function (feedback) {
            document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
        });
    }

    function userProcedure(action) {
        switch (action) {
            case 'idea_message':
                var message = {
                    msgcontent: $('.newMsg').val(),
                    msgtype: $('.newMsg').attr('msgtype'),//1 collab, 2 for comment, 3 for private message
                    action: action
                };

                $.ajax({
                    type: "POST",
                    data: message,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;
            case 'private_message':
                var message = {
                    msgcontent: $('.newMsg').val,
                    receiver: $('.newMsg').attr('receiver')
                };
                $.ajax({
                    type: "POST",
                    data: message,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;
            case 'delete_message':
                var message = {
                    msg_id: $('.message').attr('msg_id')
                };
                $.ajax({
                    type: "POST",
                    data: message,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });

                break;

            case 'profile_view':
                var profile = {
                    profile_view_username: $('.profile_username')

                };
                $.ajax({
                    type: "POST",
                    data: profile,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;

            case 'new_collab':
            case 'delete_collab':
                var idea = {
                    title: $('.idea_title').val()

                };
                $.ajax({
                    type: "POST",
                    data: idea,
                    url: "app.php"
                }).done(function (feedback) {
                    document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
                });
                break;

        }
    }


function checkLogin() {
    if (readCookie('user')) {
      //  console.log("logged in! " + Parse.User.current().get('username'));
        // $('#loggedin').html("Logged in as: " + "<a class='addis-link' href='profile'>" + Parse.User.current().get('username') + "</a></li>" + "<button id='logout' class='btn-addis-orange'>Logout</button>");
        $('#loggedin').removeClass("hidden");
        $('#login-form').addClass("hidden");
        $('#anon-user').addClass("hidden");


    }
    else {
        $('#login-form').removeClass("hidden");
        $('#anon-user').removeClass("hidden");
        $('#loggedin').addClass("hidden");
        console.log('No one logged in');
    }
}

function newFeedItem(data){
	
	
}


function checkPass()
{
    //Store the password field objects into variables ...
    var pass1 = document.getElementById('reg-password');
    var pass2 = document.getElementById('reg-confirm');
    //Store the Confimation Message Object ...
    var message = document.getElementById('confirmMessage');
    var pw = document.getElementById('patternMessage');
    //Set the colors we will be using ...
    var goodColor = "#66cc66";
    var badColor = "#ff6666";
    //Compare the values in the password field 
    //and the confirmation field
    if(pass1.value == pass2.value){
        //The passwords match. 
        //Set the color to the good color and inform
        //the user that they have entered the correct password 
        pass2.style.backgroundColor = goodColor;
        message.style.color = goodColor;
        message.innerHTML = "Passwords Match!";
    }else{
        //The passwords do not match.
        //Set the color to the bad color and
        //notify the user.
        pass2.style.backgroundColor = badColor;
        message.style.color = badColor;
        message.innerHTML = "Passwords Do Not Match!";
    }
    
    var pw_regex = new RegExp(/^(?=.{8,}$)[a-zA-Z0-9-_+=?.!]+$/); 

 
	//if ((m = pw_regex.exec(pass1.value)) !== null) {
		console.log('regex val  ' +pw_regex.test(pass1.value));
		if(pw_regex.test(pass1.value)){
			pw.innerHTML = '';
			console.log('Password is valid');	
		}
		else{
			pw.style.color = badColor;
			pw.innerHTML = 'Password must be 8 or more characters and have at least one number and one letter. ';	
		}
 	 
 	 
 	// }
    if(pass1.value == pass2.value){
        //The passwords match. 
        //Set the color to the good color and inform
        //the user that they have entered the correct password 
        pass2.style.backgroundColor = goodColor;
        message.style.color = goodColor;
        message.innerHTML = "Passwords Match!";
    }else{
        //The passwords do not match.
        //Set the color to the bad color and
        //notify the user.
        pass2.style.backgroundColor = badColor;
        message.style.color = badColor;
        message.innerHTML = "Passwords Do Not Match!";
    }
}  


function renderProfile(un){
//	active_page = 'profile';
	
	user = {USERNAME:readCookie('user')};
			
	var data = {
		action:'user_procedure',
		SP:'load_profile',
		un:un,
		idea_count:5,
		idea_offset:0
	};
	 $.ajax({
                    type: "POST",
                    data: data,
                    url: "app.php"
                }).done(function (feedback, textStatus, xhr) {
                	//document.getElementById('thing').innerHTML = feedback;
                	//var ob = $.parseJSON(feedback);
                	
                //	console.log(feedback);
                	//console.log('and');
                	//console.log(xhr.status);
                	//console.log('Text Status : '+textStatus);
                	//console.log('feedback : '+feedback);
                	var pd = JSON.parse(feedback);
                	
                	$('#maincontent').loadTemplate('addis_components/profile.html');//, pd['user']);
                	
                // console.log(pd['user'].length);
                // console.log(pd['ideas'].length);
                // console.log(pd['categories'].length);
                 
                });
}
//END checkLogin
    /*
	 var idea = {
		title:$('#idea_title').val(),
		description:$('#idea_description').val(),
		city:$('#idea_location').val(),
		state:$('#idea_state').val(),
		country:$('#idea_country').val(),
		//coordinates maybe later
		active:$('#idea_active').val(),
	};
	 */
	
	