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

    switch (active_page){
    	case 'feed':

    	break;
    	case 'profile':

    	break;
    }
    
    $('input[type=text][name=password]').tooltip({
			    placement: "right",
			    trigger: "focus"});			    			
		    // $(".signup").click(function(){
		        // $("button").replaceWith("<p>Complete!</p>");
		    // });
    
     		
     		
     		
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
        

        var text = '';
     			
        for(i=0; i < ideas.length; i++){

        }

     		var ideatest = 
     		console.log('ideas count again ' + ideas.length);
     		
     		window.onload = function() {
     			


			
     			var data =[];

 				for(i=0; i < ideas.length; i++){

            		data.push(ideas[i]);
            		}

 				
 			};
     	  
				
    });
}
             

                   
                   

     
	// $('#reg-password, #reg-confirm').keyup(function()
	// {
		// checkPass();
		// });    
           
//$('#register_submitbtn').click(function(event){
 $('#registerBTN').click(function(event){	
    event.preventDefault();
    //if($('#registerModal #reg-password').val()===$('#registerModal #reg-confirm').val()){
 		//if(!$('#reg-error').innerHTML){
 			var name = {};
 			name.fn = $('#registerModal #reg-firstname').val();
 			name.ln = $('#registerModal #reg-lastname').val();
 			console.log(
 				$('#registerModal #reg-username').val(),
 				$('#registerModal #reg-email').val(),
 				$('#registerModal #reg-password').val()
 				,name.fn
 				,name.ln
 				,$('#registerModal #reg-referral').val()
 				);
 				$("button").replaceWith("<p>Complete!</p>");
 			registerUser($('#registerModal #reg-username').val(),$('#registerModal #reg-email').val(),$('#registerModal #reg-password').val(), name, $('#registerModal #reg-referral').val());
 			//location.reload();
 		// }
 		// else{
 			// $('#reg-error').innerHTML = 'There were problems with your input. Please review.';
 		// }
        

        console.log('submitted form');	
  //  }
    // else{
        // console.log('be sure that the password confirmation matches');
    // }
    //return false;
});   
 
//$('#login_submitbtn').click(function(event){
 $('#loginBTN').click(function(event){	
    event.preventDefault();
 
 		
    loginUser($('#loginModal #login-username').val(),$('#loginModal #login-password').val());
    var user = readCookie('user');
    console.log($('#loginModal #login-password').val());
    if(user)
    	$('#loginModal').modal('toggle');
   		//$('#myModal').modal('toggle');
   

});    

$('#logout').click(function(event){
	logoutUser('user');
});
 


	
               
function showHint(str, ct, callback) {
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
        	callback(feedback);
           // document.getElementById("reg-error").innerHTML = feedback;
        });
        
    }
}

function registerUser(username, email, password, name, referral){
	
   
    var data = {
        un:username ,
        firstname:name.fn,
        lastname:name.ln,
        em:email,
        pw:password,
        referral:referral,
        action:'register'
     		
    };
     	
    $.ajax({
        type:"POST",
        data:data,
        url:"app.php"
    }).done(function(feedback){
    	if(feedback=='true'){
    		console.log('User created, ',feedback);
    		location.reload();
    	}
    	else{
    		console.log('User not created, ', feedback);
    		document.getElementById("reg-error").innerHTML ='There was an error with your registration attempt. Please try again';
    	}
    	

    });
    
}

function loginUser(username, password){
	
    var data = {
        un:username,
        pw:password,
        action:'login'
     		
    };

    $.ajax({
        type:"POST",
        data:data,
        url:"app.php"
    }).done(function(feedback){
    	

    	if(feedback){

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





// function renderProfile(un){
// 	
	// user = {USERNAME:readCookie('user')};
// 			
	// var data = {
		// action:'user_procedure',
		// SP:'load_profile',
		// un:un,
		// idea_count:5,
		// idea_offset:0
	// };
	 // $.ajax({
                    // type: "POST",
                    // data: data,
                    // url: "app.php"
                // }).done(function (feedback, textStatus, xhr) {
// 
                	// var pd = JSON.parse(feedback);
//                 	
                	// $('#maincontent').loadTemplate('addis_components/profile.html');//, pd['user']);
//                 	
// 
//                  
                // });
// }


 //<!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
            (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
            function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
            e=o.createElement(i);r=o.getElementsByTagName(i)[0];
            e.src='http://www.google-analytics.com/analytics.js';
            r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
            ga('create','UA-73768618-1');ga('send','pageview');	