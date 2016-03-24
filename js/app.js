var app = angular.module("MainApp", ['ngRoute']);
var us = '';
//CUSTOM FILTERS
app
.filter("asDate", function () {
    return function (input) {
        return new Date(input);
    };
})
.filter('asNumber', function(){
	return function(input){
		return Number(input);
	};
});
function setUs(un){us=un;};
// app.run(['$route', function($route)  {
  // $route.reload();
// }]);
app.controller("mainCtrl", ['$scope','UserService', '$location', function ($scope, UserService,$location) {

$scope.un = readCookie('user');


$.ajax({
                    type: "POST",
                    data: {action:'mail'},
                    url: "app.php"
                }).done(function (feedback, textStatus, xhr) {});
                
 $('#registerModal #reg-username').tooltip({
				    placement: "right",
				    trigger: "focus",
				    contents: $scope.unMsg
			});	
//check username
$('#registerModal #reg-username').keyup(function(){
   		var un = $(this).val();
    	var stat = 'username';

	  if(un)
	  {	
	    	showHint(un, stat, function(feedback){
	    		$scope.$apply(function(){
	    			$('#registerModal #reg-username').title = feedback;
	    	
	    		$scope.unMsg=feedback;
	    		});
	    		 
	    	});
	  }
	});
	//check email
$('#registerModal #reg-email').keyup(function(){
    var em = $(this).val();
    var stat = 'email';
     if(em){
     		$('#reg-error').removeClass('hidden');
     		showHint(em, stat, function(feedback){
     			//display results in tooltip
     			$scope.$apply(function(){
     				$scope.emMsg = feedback;
     			});
     		});
     }
    	
});

//check password registration
$('#reg-password, #reg-confirm').keyup(function()
{
	$scope.$apply(function(){
		$scope.checkPass();
	});
	
});    
           
//check pass START

$scope.checkPass =function()
{
    //Store the password field objects into variables ...
    $scope.pass1 = $('#registerModal #reg-password');
    //console.log($scope.pass1.val());
    $scope.pass2 = $('#registerModal #reg-confirm');
    //console.log($scope.pass2.val());
    //Store the Confimation Message Object ...
    $scope.message = $('#registerModal #confirmMsg');
    $scope.pw = $('#registerModal #pwMsg');
    //Set the colors we will be using ...
    var goodColor = "#66cc66";
    var badColor = "#ff6666";
    //Compare the values in the password field 
    //and the confirmation field
    if($scope.pass1.val() == $scope.pass2.val())
    {
        //The passwords match. 
        //Set the color to the good color and inform
        //the user that they have entered the correct password 
        $scope.pass2.css('background-color', goodColor);
        $scope.message.css('color', goodColor);
        $scope.message.innerHTML = "Passwords Match!";
    }
    else{	
        //The passwords do not match.
        //Set the color to the bad color and
        //notify the user.
        $scope.pass2.css('background-color', badColor);
        $scope.message.css('color',  badColor);
        $scope.message.innerHTML = "Passwords Do Not Match!";
    }
    
    var pw_regex = new RegExp(/^(?=.{8,}$)[a-zA-Z0-9-_+=?.!]+$/); 

 
		console.log('regex val  ' +pw_regex.test($scope.pass1.val()));
		if(pw_regex.test($scope.pass1.value)){
			$scope.pw.innerHTML = '';
		//	console.log('Password is valid');	
		}
		else{
			$scope.pw.css('color', badColor);
			$scope.pw.innerHTML = 'Password must be 8 or more characters and have at least one number and one letter. ';	
		}
 	 
 	 

    if($scope.pass1.val() == $scope.pass2.val()){

        $scope.pass2.css('background-color', goodColor);
        $scope.message.css('color',goodColor);
        $scope.message.innerHTML = "Passwords Match!";
    }else{
        //The passwords do not match.
        //Set the color to the bad color and
        //notify the user.
        $scope.pass2.css('background-color', badColor);
        $scope.message.css('color',badColor);
        $scope.message.innerHTML = "Passwords Do Not Match!";
    }
};

//check pass END

$scope.showNotifications = function(){
	
	//console.log('notesnotes');
	if($('#notify-box').hasClass('shown'))
	{
		
		$('#notify-box').fadeOut( "slow").removeClass('shown');
	}
	else{
		$('#notify-box').fadeIn().addClass('shown');//.animate({height: 'auto', opacity: '0.0'}, "slow").addClass('hidden');
	}
};
// setInterval(function(){ 
	// if($scope.location!=$location.url()){
		// $scope.location = $location.url();
		// if($scope.location != '/feed'){
			// $('#maincontent').css('margin-top','100px');
		// }
	// }
	 // }, 10);
//$scope.$apply(function(){
	UserService.notifications(readCookie('user'), 4, function(feedback){
	if(JSON.parse(feedback)){
		
		$scope.notifications= JSON.parse(feedback);
		console.log($scope.notifications, 'notes');
	}
	else{
		$scope.notifications= false;
	}
});

//});	 

$scope.location = $location.url();
console.log($scope.location);



 
}])
.controller("userCtrl",['$scope','$routeParams', '$location', 'IdeaService', 'UserService', function($scope, $routeParams, $location, IdeaService, UserService){
	//$scope.$apply(function(){
		$scope.user_username = readCookie('user');
		$scope.idea_count = 5;
		$scope.idea_offset = 0;
		// if($location.url().indexOf('signup')){
			// $('.addis-main-nav').css('display', 'none');
			// $('#banner').css('display','none');
		// }
		
//	});
	if($routeParams.un != undefined){
		var data = {
		action:'user_procedure',
		sp:'load_profile',
		un:$routeParams.un,//readCookie('user'),
		idea_count:$scope.idea_count,
		idea_offset:$scope.idea_offset
		};
		
		
	
		
		
		$.ajax({
                    type: "POST",
                    data: data,
                    url: "app.php"
                }).done(function (feedback, textStatus, xhr) {
                	
                	 $scope.profile = JSON.parse(feedback);
                	$scope.$apply(function(){
                		$scope.user = $scope.profile['user'][0];
                		$scope.categories = $scope.profile['categories'];
                		$scope.ideas = $scope.profile['ideas'];
                		if($scope.ideas != false){
                			$scope.idea_offset = $scope.ideas.length;
                		}
                		if($scope.user.LOCATION_CITY == 'null') delete $scope.user.LOCATION_CITY;
                		if($scope.user.LOCATION_STATE_PROV == 'null') delete $scope.user.LOCATION_STATE_PROV;
                		if($scope.user.LOCATION_COUNTRY == 'null') delete $scope.user.LOCATION_COUNTRY;
                	});
                	
                //	console.log($scope.profile['user'][0]);
                //console.log($scope.profile['categories']);
                //	console.log($scope.profile['ideas'][0]);
        			//return user;
                 	
                });
	}
	
    $scope.showMoreIdeas = function(){
    		UserService.updateIdeaList($scope.user_username, $scope.idea_count, $scope.idea_offset,function(feedback){
    				console.log(feedback);
    			if(JSON.parse(feedback)){
    			
    				 $scope.profile = JSON.parse(feedback);
            	 	$scope.$apply(function(){

            		var ideas = $scope.profile['ideas'];
            		
            		for(var i in ideas){
	    				$scope.ideas.push(ideas[i]);
	    				
	    			}
	    			$scope.idea_offset=$scope.ideas.length;
            	  });
    			}
    			
    		});
    };        
	
	//console.log('test: '+data);
	//$scope.user = data['user'];
	
	//data = renderProfile(readCookie('user'));
	
	//Idea Like
	$scope.likeIdea = function(sp,idea, user){
		IdeaService.likeIdea(sp, idea, user, function(feedback){
			if(sp=='idea_like'){
				if(feedback=='true'){
					$scope.$apply(function(){
						if($scope.likes == undefined) $scope.likes = [];
						$scope.likes.push(idea);
						console.log($scope.likes);
						for( var id in $scope.ideas){
							if($scope.ideas[id].TITLE == idea){
								console.log($scope.ideas[id].LIKES);
								$scope.ideas[id].LIKES=Number($scope.ideas[id].LIKES)+1;
								console.log('type', typeof($scope.ideas[id].LIKES,'  = ', $scope.ideas[id].LIKES));
							}
								
						}
						
					});	
				}
			}
			else 
			{
				if(feedback=='true'){
					$scope.$apply(function(){
						for(var i in $scope.likes){
							if(idea == $scope.likes[i])
								$scope.likes.splice(i, 1);
								console.log('deleted',$scope.likes);
							}
								
								for( var id in $scope.ideas){
									if($scope.ideas[id].TITLE == idea)
									{
										$scope.ideas[id].LIKES=Number($scope.ideas[id].LIKES)-1;
										console.log('type', typeof($scope.ideas[id].LIKES,'  = ', $scope.ideas[id].LIKES));
										}
									}	
						});
								
						
					}	
				}
				
				
		});
		//console.log(idea, user);	
	};
	//End Like

	
	
	
}])
.controller("ideaCtrl",['$scope', '$location', 'IdeaService', 'LookupService', '$routeParams', '$window',  function($scope, $location, IdeaService, LookupService,$routeParams, $window){
	$scope.new_title = '';
	$scope.idea_offset = 0;
	$scope.user_username = readCookie('user');
	
	//add remove idea img
	$scope.upload_image = function(){
            	var path_to_php='upload.php';
				var form=new FormData(document.forms.upload_image_form);	 
				var xhr=new XMLHttpRequest();
				console.log(document.forms.upload_image_form.un);
				xhr.onreadystatechange = response;
				    xhr.open("post",path_to_php,true);
				    xhr.send(form); 
				function response(){//завершение асинхронного запроса
					if (xhr.readyState ==4){
					//document.getElementById('message').innerHTML = xhr.responseText;
					location.reload();
					alert(xhr.responseText);
					
					}}
			
            	// console.log('image: ',$('#img_ul')[0].files[0]);
            	// img = $('#img_ul')[0].files[0];
            	// console.log(img);
//             	
            	// var data = { 
            		// action:'image_upload',
            		// sp:sp,
//             		
            		// user_image:img,
            		// content:content
            	// };
//             	
            	// console.log(data);
//             	
            	// $.ajax({
				        // type: "POST",
				      // processData: false,
    				// contentType: false,
// 			
	                    // data: data,
	                    // url: "upload.php"
	                // }).done(function (feedback) {
	                	// console.log('IMG MSG : ', feedback);
//             	
            		// });
            };
            
            $scope.checker = function(){
            	var a=confirm('Are you sure you want to delete your image?')
            	if(a == true){
            		$scope.remove_image();
            	}
            };
           
            $scope.remove_image = function(){
            	//remove image user wants to delete
            //	console.log('image is removed');
            	var data = {
            		sp:'img'
            		,un:$scope.user_username
            		,action:'idea'
            		,title:$scope.idea.TITLE
            	};
            	//console.log(data);
            	
            	  $.ajax({
		        type:"POST",
		        data:data,
		        url:"app.php"})
		        .done(function(feedback){
		        	console.log(feedback, ' : feedback from remove');
			    //	console.log('in topics: ',feedback);
			    	if(feedback=='true'){
			    		$scope.$apply(function(){
			    			delete $scope.idea.IMG_PATH;
			    		});
			    		alert('Image was removed');
			    		
			    	}
			    	else
			    		alert('An error occured while trying to delete your image. Contact support if this error keeps occuring.');
			    	
			    });
            };
	
	
	//END ADD REMOVE IMG
	
	
	$scope.makeComment = function(comment,title, sp , commID){
		if(readCookie('user') != undefined && comment !=undefined && comment.length >3)
			IdeaService.comment(comment, sp, title, readCookie('user'), function(feedback){
				console.log('comment ', feedback);
				if(feedback == 'true'){
				  IdeaService.get_comments($scope.idea.TITLE, $scope.idea_offset, readCookie('user'),function(feedback){
		                	$scope.$apply(function(){
		                			$scope.idea_comments = JSON.parse(feedback);
		                		//	console.log($scope.idea_comments);
		                	});
		                
		                });
				}
			});
	};
	
	$scope.deleteComment = function(msg_id){
		IdeaService.delete_comment(readCookie('user'), msg_id, function(feedback){
			if(feedback == 'true'){
				//remove from the list
				IdeaService.get_comments($scope.idea.TITLE, $scope.idea_offset, readCookie('user'),function(feedback){
		                	$scope.$apply(function(){
		                			$scope.idea_comments = JSON.parse(feedback);
		                		//	console.log($scope.idea_comments);
		                	});
		                
		                });
			}
			else{
				//do nothing
			}
		});
	};
	
	$scope.edit_idea = function(newTitle, oldTitle, newDesc, oldDesc, location){
		
		if(location != undefined){
			IdeaService.updateLocation(location, oldTitle,  function(feedback){
				if(feedback=='true')
					{
						console.log('location updated!!!!!');
						//idea location was updated
						}
			});
		}
		
		if(newTitle == oldTitle || newTitle == undefined){
	
		if(newDesc != undefined){
			IdeaService.editIdea('description', readCookie('user'), oldTitle, oldTitle, newDesc, function(feedback){
				if(feedback =='true'){
            					$window.location.href='#idea/'+oldTitle;
				}
			});
		}
		else{
			IdeaService.editIdea('description', readCookie('user'), oldTitle, oldTitle, oldDesc, function(feedback){
				if(feedback =='true'){
            					$window.location.href='#idea/'+oldTitle;		
				}
			});
		}
		
		}else if(newDesc != undefined){
			 IdeaService.editIdea('description', readCookie('user'), newTitle, oldTitle, newDesc, function(feedback){
				 if(feedback =='true'){
            					$window.location.href='#idea/'+newTitle;
				}
			});
		}
		else{
			IdeaService.editIdea('description', readCookie('user'), newTitle, oldTitle, oldDesc, function(feedback){
				if(feedback =='true'){
            					$window.location.href='#idea/'+newTitle;
				}
			});
		}
		
	
	};
	//Lookups
	if($location.url().indexOf('idea_edit')>-1){
		var get_topics = 'get_topics';
			var get_addressed = 'get_addressed';
			 LookupService.lookups(get_topics, function(feedback){
				$scope.topics = JSON.parse(feedback);
				console.log('callback topics', feedback, $scope.topics);
			 });
			 LookupService.lookups(get_addressed, function(feedback){
			 	$scope.addressed = JSON.parse(feedback);
			 	console.log('callback addressed ', feedback);
			 });
	}
	
	//End Lookups
	$scope.create = function(){
		//console.log(IdeaService.create($scope.new_title, $scope.new_description));
		
		IdeaService.create($scope.new_title, $scope.new_description, function(feedback){
			if(feedback =='true'){
				$location.path('/idea/'+$scope.new_title);
			}
			else{
				$scope.error_msg='Either an idea of that title exists or an error occured while creating your idea.';
			}
			
			//alert(feedback);
			
		});
		
		
	};
	
	
	
	$scope.addRemoveCategory = function(content, sp, title ){
		IdeaService.addRemoveCategory(content, sp, title, function(feedback){
			//console.log('title ',title);
			//console.log('sp ',sp);
			//console.log('content ',content);
			if(feedback =='true')
			{
				//false
				console.log('idea topic changed ', feedback);
				if(sp=='idea_topic' || sp=='addressed_to' ){
					////
					IdeaService.getIdea(title, function(feedback){
							$scope.$apply(function(){
		                		$scope.categories = JSON.parse(feedback)['categories'];
		                		if($scope.categories != false){
		                			
		                			$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });
		                		}
		                		else{
		                			$scope.catArray = [];
		                		}
		                		$scope.addressed_to = JSON.parse(feedback)['addressed_to'];
		                		if($scope.addressed_to != false){
		                			$scope.addArray = $.map($scope.addressed_to, function(el) { return el.STAKEHOLDER; });
		                		}
		                		else{
		                			$scope.addArray = [];
		                		}
		                	//	console.log('idea controller', $routeParams.title, JSON.parse(feedback)	);
                			});
					});
					////
					$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });	
				}
				else if(sp=='delete_addressed_to')
				{
					 IdeaService.getIdea(title, function(feedback){
							$scope.$apply(function(){
		                	
		                		$scope.addressed_to = JSON.parse(feedback)['addressed_to'];
		                		if($scope.addressed_to != false){
		                			$scope.addArray = $.map($scope.addressed_to, function(el) { return el.STAKEHOLDER; });
		                		}
		                		else{
		                			$scope.addArray = [];
		                		}
		                	//	console.log('idea controller', $routeParams.title, JSON.parse(feedback)	);
                			});
					});
					 
					 /////
					 $scope.$apply(function(){
					 for( var y in $scope.addArray){
    						if($scope.addArray[y]==content){
    							 	
    							 		delete $scope.addArray[y];
    							 		console.log($scope.addArray);
    							 	
    							 		
    						}
				}});	
			}
			}
			else{
				//false
				console.log('failed topic change ',feedback);
			}
		}); 
		
		};
	
	
	if($routeParams.title != undefined){
		//console.log('title title title: ', $routeParams.title);
		
		
		var data = {
		action:'idea_view',
		title:$routeParams.title
	};
	
	
	
	
	$.ajax({
                    type: "POST",
                    data: data,
                    url: "app.php"
                }).done(function (feedback, textStatus, xhr) {
                	
                	
                	$scope.$apply(function(){
                		$scope.idea_owner = JSON.parse(feedback)['idea_owner'];
                		//$scope.message = JSON.parse(feedback);
                		$scope.idea = JSON.parse(feedback)['idea'][0];
                		// console.log($scope.idea, 'profile idea');
                		if(readCookie('user')){
                			IdeaService.get_comments($scope.idea.TITLE, $scope.idea_offset, readCookie('user'),function(feedback){
		                	$scope.$apply(function(){
		                			$scope.idea_comments = JSON.parse(feedback);
		                	});
		                
		                	
		                });
                		}
                		
                		$scope.categories = JSON.parse(feedback)['categories'];
                		if($scope.categories != false){
                			$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });
                		}
                		else{
                			$scope.catArray = [];
                		}
                		$scope.addressed_to = JSON.parse(feedback)['addressed_to'];
                		if($scope.addressed_to != false){
                			$scope.addArray = $.map($scope.addressed_to, function(el) { return el.STAKEHOLDER; });
                		}
                		else{
                			$scope.addArray = [];
                		}
                	//	console.log('idea controller', $routeParams.title, JSON.parse(feedback)	);
                	});
                });
                
                //get comments
                
	}
	
	//create idea
	 if($routeParams.new_title !=undefined && $routeParams.new_description != undefined){
		//create idea
		var data = {
		action:'idea',
		sp:'new_idea',
		un:readCookie('user'),
		title:$routeParams.new_title,
		description:$routeParams.new_description
	};
	console.log('lookout');
	
	$.ajax({
                    type: "POST",
                    data: data,
                    url: "app.php"
                }).done(function (feedback, textStatus, xhr) {
                	
                	
                	$scope.$apply(function(){
                		$scope.message = JSON.parse(feedback);
                	//	console.log('idea controller', $routeParams.title, JSON.parse(feedback)	);
                	});
                });
	}
	
	
                	
}])
.controller("notifyCtrl", ["$scope","$routeParams", "UserService", "$http", function($scope,$routeParams, UserService, $http){
	$scope.user_username = $routeParams.un;
	$scope.notifications = {};
	$scope.ncount = 20;
	$scope.noffset=0;
	
	
	UserService.notifications($scope.user_name, $scope.ncount, function(feedback){
		if(feedback!='false'){
			$scope.$apply(function(){
				console.log(feedback);
				$scope.notifications = JSON.parse(feedback);
				$scope.noffset=$scope.notifications.length;
				console.log($scope.noffset, ' length', $scope.notifications);	
			});
			
		}
	});
	$scope.showMore = function(){
	//	$scope.noffset+=20;
		//show next 20
		var data={
			notify_count:$scope.ncount,
			notify_offset:$scope.noffset,
			action:'user_procedure',
			sp:'notify',
			un:$scope.user_username
		};
		$.ajax
	    ({
	        type:"POST",
	        data:data,
	        url:"app.php"
	    }).done(function(feedback){
	    	//console.log('show more ', feedback);
	    	$scope.$apply(function() {
	    		if(feedback != 'false')
	    		{
	    		//	console.log('noties', JSON.parse(feedback));
	    			var notes = JSON.parse(feedback);
	    			for(var i in notes){
	    				$scope.notifications.push(notes[i]);
	    				
	    			}
	    			$scope.noffset=$scope.notifications.length;
	    		}
		       		
	    	});
		});
	
	
	};
}])
.controller("feedCtrl",["$scope", "$http", "IdeaService", function($scope, $http, IdeaService){
	$scope.user_username = readCookie('user');
	$scope.idea_count = 10;
	$scope.idea_offset=0;
	var feedSort = 'date';
	
	$scope.likeIdea = function(sp,idea, user){
		IdeaService.likeIdea(sp, idea, user, function(feedback){
			if(sp=='idea_like'){
				if(feedback=='true'){
					$scope.$apply(function(){
						if($scope.likes == undefined) $scope.likes = [];
						$scope.likes.push(idea);
						console.log($scope.likes);
						for( var id in $scope.ideas){
							if($scope.ideas[id].TITLE == idea){
								console.log($scope.ideas[id].LIKES);
								$scope.ideas[id].LIKES=Number($scope.ideas[id].LIKES)+1;
								console.log('type', typeof($scope.ideas[id].LIKES,'  = ', $scope.ideas[id].LIKES));
							}
								
						}
						
					});	
				}
			}
			else 
			{
				if(feedback=='true'){
					$scope.$apply(function(){
						for(var i in $scope.likes){
							if(idea == $scope.likes[i])
								$scope.likes.splice(i, 1);
								console.log('deleted',$scope.likes);
							}
								
								for( var id in $scope.ideas){
									if($scope.ideas[id].TITLE == idea)
									{
										$scope.ideas[id].LIKES=Number($scope.ideas[id].LIKES)-1;
										console.log('type', typeof($scope.ideas[id].LIKES,'  = ', $scope.ideas[id].LIKES));
										}
									}	
						});
								
						
					}	
				}
				
				
		});
		//console.log(idea, user);	
	};
	if($scope.user_username == undefined){
		var feeddata = {
			
	        action:'feed',
	        sortby: feedSort,
	        idea_count:$scope.idea_count,
	        idea_offset:$scope.idea_offset
    	};
	}
	else{
		var feeddata = {
		un : $scope.user_username,
        action:'feed',
        sortby: feedSort,
        idea_count:$scope.idea_count,
        idea_offset:$scope.idea_offset
    };
	}
	
    
    $scope.ideas = [];
  	
	$.ajax
    ({
        type:"POST",
        data:feeddata,
        url:"app.php"
    }).done(function(feedback){
    	$scope.$apply(function() {
	        $scope.ideas = $.parseJSON(feedback)['ideas'];
	         $scope.likes = $.parseJSON(feedback)['likes'];
	        for(var i in $scope.ideas){
	        //	$scope.ideas[i].LIKES = Number($scope.ideas[i].LIKES );
	        //	$scope.ideas[i].COMMENTS = Number($scope.ideas[i].COMMENTS );
	        //	$scope.ideas[i].VIEWS = Number($scope.ideas[i].VIEWS );
	        //	console.log(i, 'idea');
	        	if($scope.ideas[i].LOCATION_CITY == 'null'){
	        		delete $scope.ideas[i].LOCATION_CITY;
	        	}
	        	if($scope.ideas[i].LOCATION_STATE_PROV== 'null'){
	        		delete $scope.ideas[i].LOCATION_STATE_PROV;
	        	}
	        	if($scope.ideas[i].LOCATION_COUNTRY == 'null'){
	        		delete $scope.ideas[i].LOCATION_COUNTRY;
	        	}
	        }
	      
    	});
    	console.log('likes', $scope.likes);
        console.log('feed', $scope.ideas);
        
     });
     
}]);


app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        redirectTo: '/feed',
        controller:'ideaCtrl'
      })
      .when('/profile/:un', {
      	
      	templateUrl: 'partials/profile.html',
      	controller:'userCtrl'
      })
      .when('/feed', {
      	templateUrl: 'partials/feeditem_partial.html',
      	controller:'feedCtrl'
      })
      .when('/idea/:title', {
      	templateUrl: 'partials/idea_screen.html',
      	controller:'ideaCtrl'
      })
      .when('/profile_edit/:un', {
      	templateUrl: 'partials/profile_edit.html',
      	controller:'profileCtrl'
      })
      .when('/idea_edit/:title', {
      	templateUrl: 'partials/idea_screen_edit.html',
      	controller:'ideaCtrl'
      })
      .when('/notifications/:un', {
      	templateUrl: 'partials/notifications_screen.html',
      	controller:'notifyCtrl'
      })
      .when('/signup/:un', {
      	templateUrl: 'partials/signup.html',
      	controller:'userCtrl'
      })
       .when('/signup', {
      	templateUrl: 'partials/signup.html',
      	controller:'userCtrl'
      })
       .when('/login', {
      	templateUrl: 'partials/login.html',
      	controller:'userCtrl'
      })
      .otherwise({
        redirectTo: '/feed',
        controller:'ideaCtrl'
      });

    //$locationProvider.html5Mode(true);
  });

         

  
  
    
 




        app.controller('profileCtrl',['$scope','LookupService', 'UserService', '$http', '$routeParams', '$window', function($scope, LookupService, UserService, $http, $routeParams, $window) {
            $scope.categories=[];
            $scope.catArray=[];
            $scope.user_username = readCookie('user');
            $scope.idea_count = 5; 
            $scope.idea_offset = 0;
            
            $scope.upload_image = function( sp, content){
            	var path_to_php='upload.php';
				var form=new FormData(document.forms.upload_image_form);	 
				var xhr=new XMLHttpRequest();
				console.log(document.forms.upload_image_form.un);
				xhr.onreadystatechange = response;
				    xhr.open("post",path_to_php,true);
				    xhr.send(form); 
				function response(){//завершение асинхронного запроса
					if (xhr.readyState ==4){
					//document.getElementById('message').innerHTML = xhr.responseText;
					location.reload();
					alert(xhr.responseText);
					
					}}
			
            	// console.log('image: ',$('#img_ul')[0].files[0]);
            	// img = $('#img_ul')[0].files[0];
            	// console.log(img);
//             	
            	// var data = { 
            		// action:'image_upload',
            		// sp:sp,
//             		
            		// user_image:img,
            		// content:content
            	// };
//             	
            	// console.log(data);
//             	
            	// $.ajax({
				        // type: "POST",
				      // processData: false,
    				// contentType: false,
// 			
	                    // data: data,
	                    // url: "upload.php"
	                // }).done(function (feedback) {
	                	// console.log('IMG MSG : ', feedback);
//             	
            		// });
            };
            
            $scope.checker = function(){
            	var a=confirm('Are you sure you want to delete your image?')
            	if(a == true){
            		$scope.remove_image();
            	}
            };
           
            $scope.remove_image = function(){
            	//remove image user wants to delete
            //	console.log('image is removed');
            	var data = {
            		sp:'img'
            		,un:$scope.user_username
            		,action:'user_update'
            	};
            	//console.log(data);
            	
            	  $.ajax({
		        type:"POST",
		        data:data,
		        url:"app.php"})
		        .done(function(feedback){
		        	console.log(feedback, ' : feedback from remove');
			    //	console.log('in topics: ',feedback);
			    	if(feedback=='true'){
			    		alert('Image was removed');
			    	}
			    	else
			    		alert('An error occured while trying to delete your image. Contact support if this error keeps occuring.');
			    	
			    });
            };
            $scope.usernameCheck= function(){
            	    var un = $scope.changes.username;
				    var stat = 'username';
					LookupService.usernameCheck(un,stat,function(feedback){
						$scope.$apply(function(){
							if(feedback!='')
								$('#un_check').removeClass('hidden').text(feedback);
							else
								$('#un_check').addClass('hidden');
						});
						
						console.log(feedback);
					});
				};
            
            $scope.adding_category='';
            
            
            
            $scope.edit_profile = function(username, about, location, img){
            
            	console.log('edit prof', img);
            	if(about != undefined){
            		if(username !=undefined)
            			UserService.username = readCookie('user'); 
            		UserService.userUpdate('about', about, function(feedback){
            			//do something with about feedback
            			console.log(readCookie('user'), 'userAbout');
            			console.log($scope.user.USERNAME, 'username guy');
            			console.log('about ',feedback);
            			
            			
            		});
            	}
            	
            	if(location != undefined){
            		UserService.updateLocation( location, function(feedback){
            			if(feedback=='true'){
            				//yay	
            			}
            			else{
            				alert('Sorry. Unable to update location.');
            			}
            		});
            	}
            	
            	if(username != readCookie('user') && username != undefined){
            		//change username
            		UserService.userUpdate('username', username, function(feedback){
            			//do something with username feedback
            			console.log('username ',feedback);
            			if(feedback=='true'){
            				$routeParams.un = username;
            				$('#logged-user').text(readCookie('user'));
            				if(about == undefined){
            					$window.location.href='#profile/'+username;
            				}
            				//location.reload();
            			}
            		});
            		//console.log('changing ', readCookie('user'),'\'s username to ',username);
            	}
            	//change about outside of if no matter what
            	if(username == undefined){
            				$window.location.href = '#profile/'+$scope.user.USERNAME;//+readCookie('user');
            			}
            			else{
            				$window.location.href = '#profile/'+username;
            			}
            
            };
            // $http.get("profile.json").success(function(response) {
                // $scope.profile=response;
            // });
			//
			var get_topics = 'get_topics';
			var get_addressed = 'get_addressed';
			 LookupService.lookups(get_topics, function(feedback){
				$scope.topics = JSON.parse(feedback);
				console.log('callback topics', feedback);
			 });
			 LookupService.lookups(get_addressed, function(feedback){
			 	$scope.addressed = JSON.parse(feedback);
			 	console.log('callback addressed ', feedback);
			 });
			 
			 
			var data = {
				action:'user_procedure',
				sp:'load_profile',
				un:$routeParams.un,//readCookie('user'),
				idea_count:$scope.idea_count,
				idea_offset:$scope.idea_offset
			};
			
	

	
	
		$.ajax({
				        type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	
	                	 $scope.profile = JSON.parse(feedback);
	                	$scope.$apply(function(){
	                		$scope.user = $scope.profile['user'][0];
	                		if($scope.user.LOCATION_CITY == 'null') delete $scope.user.LOCATION_CITY;
                			if($scope.user.LOCATION_STATE_PROV == 'null') delete $scope.user.LOCATION_STATE_PROV;
                			if($scope.user.LOCATION_COUNTRY == 'null') delete $scope.user.LOCATION_COUNTRY;
	                		if($scope.profile['categories'] != false){
	                			$scope.categories = $scope.profile['categories'];
	                			//console.log('before', $scope.categories);
	                			$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });
	                		}
	                		else{
	                			$scope.catArray = [];
	                		}
	                		
	                		console.log($scope.catArray,'cats');
	                		$scope.ideas = $scope.profile['ideas'];
	                	});
	                	
	                	//console.log($scope.profile['user'][0]);
	               		// console.log($scope.profile['categories']);
	                //	console.log($scope.profile['ideas'][0]);
	        			//return user;
	                 	
	                });
			/////
            $scope.addRemoveCategory = function(content, sp) {
              //  if($scope.adding_category != '') {
              		
                	console.log('add topic - ',content.TOPICNAME);
                	if(readCookie('user')){
                		data = {
	                		action:'user_update',
	                		un:readCookie('user'),
	                		sp:sp,
	                		content:content.TOPICNAME
                		};
                		
            		  	$.ajax({
					        type:"POST",
					        data:data,
					        url:"app.php"})
					        .done(function(feedback){
						   		var res;
						    	if(feedback == 'true'){
						    		res = true;
						    		//console.log('added topic', res, $scope.categories.length);
						    	
						    			$scope.updateCategory(sp, content);
						    		
						    	}
						    	else{
						    		res = false;
						    		console.log('Did not add topic', res);
						    	
						    	}
						    //	callback(res);
					    });
                	}
                	else{
                		return false;
                	}
                	
                	
              //     $scope.categories.push($scope.adding_category);
                //    $scope.adding_category='';
               };
           
			 $scope.updateCategory = function(sp, content) {
                if(sp == 'user_topic') {
                	$scope.$apply(function(){
                		// var val = {TOPICNAME:content};
                	//	console.log(content, 'content');
                	
                		 $scope.categories.push(content);
                		 $scope.catArray.push(content.TOPICNAME); //= $.map($scope.categories, function(el) { return el.TOPICNAME; });
                		
                		});
                   
                    	console.log($scope.categories[$scope.categories.length-1]);
                    	console.log($scope.catArray, 'cats');
                	
                	}
                else{
                	// each
                		$scope.$apply(function(){
                		 for( var x in $scope.categories) {
    						if( $scope.categories[x].TOPICNAME == content.TOPICNAME) {
    							var topic = $scope.categories[x].TOPICNAME;
    							delete $scope.categories[x];
    						//	$scope.catArray  = $.map($scope.categories, function(el) { return el.TOPICNAME; });
    						//	console.log('deleted? ' ,$scope.categories[x]);
    							 for( var y in $scope.catArray){
    							 	if($scope.catArray[y]==topic)
    							 		delete $scope.catArray[y];
    							 }
    							console.log('catArray? ' ,$scope.catArray);
    						}
    					//	console.log('topics',$scope.categories);
    						
						}
						
					//	$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });
						});
						
                		 
                }
                //$scope.catArray = $.map($scope.categories, function(el) { return el.TOPICNAME; });
            };
			
            $scope.deleteCategory = function($index) {
                if($index>=0 && $index<$scope.profile.categories.length) {
                    $scope.profile.categories.splice($index, 1);
                }
            };

            $scope.addProfileImage = function() {
                $('#profile_img_upload').trigger('click');
            };

            $scope.removeProfileImage = function() {
                $('#profile_img').attr('src', '');
                $('#profile_img_upload').val("");
                $scope.profile.profile_img_exist = false;
            };
        }]);

        $(function () {
            $('#profile_img_upload').bind('change', function() {
                if (this.files && this.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $('#profile_img').attr('src', e.target.result);
                        // $('#profile_img_add').hide();
                        // $('#profile_img_delete').show();
                        var appElement = document.querySelector('[ng-app=profileApp]');
                        var $scope = angular.element(appElement).scope();
                        $scope.$apply(function() {
                            $scope.profile.profile_img_exist = true;
                        });
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        });

//   SERVICES

// var SvcApp = angular.module('MainApp.services',[]);

app.factory('LookupService', [function() { 
	
	return {
		lookups:function(act ,callback){
		
		    var data = {
		        action:act
    		};  
    			
		    $.ajax({
		        type:"POST",
		        data:data,
		        url:"app.php"})
		        .done(function(feedback){
			    //	console.log('in topics: ',feedback);
			    	callback(feedback);
			    });
		    
		    
		},
		usernameCheck:function(str, ct, callback){
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
        });
		}
	};
}]);
app.factory('UserService', [function(){
	return{
		username:readCookie('user'),
		notifications:function(username, notify_count, callback){
			 var data = {
        	action:'user_procedure',
        	sp:'notify',
            un:this.username,
            notify_count:notify_count
	        };
			//console.log(data.un);
	        $.ajax({
	            type: "POST",
	            data: data,
	            url: "app.php"
	        }).done(function (feedback) {
	           callback(feedback);
	    //       console.log(JSON.parse(feedback));
	           
	           // document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
	        });
		},
		userUpdate:function(sp,content, callback) {
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
        	action:'user_update',
        	sp:sp,
            content: content,
            un:this.username//readCookie('user')
        };
		console.log(data.un);
        $.ajax({
            type: "POST",
            data: data,
            url: "app.php"
        }).done(function (feedback) {
           callback(feedback);
           
           
           // document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
        });
    },
    updateLocation:function( location, callback){
    	var content = {};
    	if(location.state == undefined)
    	{
    		content.state = '0';
    	}
    	else{
    		content.state=location.state;
    	}
    	if(location.city == undefined)
    	{
    		content.city = '0';
    	}
    	else{
    		content.city=location.city;
    	}
    	if(location.country == undefined )
    	{
    		content.state = '0';
    	}
    	else{
    		content.country=location.country;
    	}
    	
    	
    	var data = {
    		city:content.city,
    		state:content.state,
    		country:content.country,
    		un:this.username,
    		sp:'location',
    		action:'user_update'
    	};
    	 $.ajax({
            type: "POST",
            data: data,
            url: "app.php"
        }).done(function (feedback) {
           callback(feedback);
           console.log(feedback, 'locationlocation');
           
           // document.getElementById("ideaupdate_txtHint").innerHTML = feedback;
        });
    	
    },
    updateIdeaList:function(un,ic, io, callback){
    	
    	var data = {
				action:'user_procedure',
				update:'true',
				sp:'load_profile',
				un:un,
				idea_count:ic,
				idea_offset:io
			};
			
	

	
	
		$.ajax({
				        type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback) {
	                	callback(feedback);
	                	
	                	});
    }
	};
}]);
app.factory('IdeaService', [function() {
	
	
	return {
		//
		likeIdea:function(sp, title, un, callback){
					var data = {
						action:'idea_procedure',
						title:title,
						sp:sp,
						un:un
					};
		
	
					$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	
	            		callback(feedback);
	                
	                });
		},
		get_comments:function(title, io,username, callback){
			var data = {
			action:'idea_procedure',
			title:title,
			sp:'get_comments',
			un:username, 
			idea_offset:io
		};
		
	
		$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	
	            		callback(feedback);
	                
	                });
		}
		,
		comment:function(comment, sp, title,username, callback){
			var data = {
			action:'user_procedure',
			title:title,
			msgcontent:comment,
			msgtype:2,
			sp:sp,
			un:username
		};
	
		$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	
	            		callback(feedback);
	                
	                });
		},
		
		delete_comment:function(username, msg_id, callback){
			var data = {
				msgID:msg_id,
				un:username,
				action:'idea_procedure',
				sp:'delete_message'
			};
			$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback) {
	                	if(feedback == 'true')
	                		console.log('idea deleted', feedback);
	                	else {
	                		console.log('idea NOT deleted', feedback);
	                	}
	                		
	            		callback(feedback);
	                
	                });
		}
		,
		editIdea:function(sp, un, title, ot, description, callback){
			var data = {
			action:'idea',
			original_title:ot,
			description:description,
			sp:sp,
			un:un,
			title:title
		};
	
		$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	console.log(data,'idea data');
	                	console.log(feedback, '= idea update');
	            		callback(feedback);
	                
	                });
		},
		getIdea:function(title, callback){
			var data = {
			action:'idea_view',
			title:title
		};
	
		$.ajax({
	                    type: "POST",
	                    data: data,
	                    url: "app.php"
	                }).done(function (feedback, textStatus, xhr) {
	                	console.log('owner: ',JSON.parse(feedback)['idea_owner']);
	            		callback(feedback);
	                
	                });
		}
		,
		addRemoveCategory:function(content,sp,title, callback){
					data = {
	                		action:'idea_procedure',
	                		un:readCookie('user'),
	                		sp:sp,
	                		content:content,
	                		title:title
                		};
                		
            		  	$.ajax({
					        type:"POST",
					        data:data,
					        url:"app.php"})
					        .done(function(feedback){
						   		
						    		callback(feedback);
								
							});
		
		},
		
		create:function(title,description, callback){
		//	console.log('yeah yeah');
		if(title != undefined && description != undefined)
		if(title.length>0 && description.length>0 ){
		    var data = {
		        title:title,
		        description:description,
		        action:'idea',
		        sp:'new_idea' 		
    		};  	
		    $.ajax({
		        type:"POST",
		        data:data,
		        url:"app.php",
		        success: function(data) {
		        	
			     //   myDataFunc(data);
			      //  console.log( 'datadata=',data);
			       
			    }
		    }).done(function(feedback){
		    	callback(feedback);
		       	console.log('idea creation status:',feedback);
		        
		        var msg = '';
		        if(feedback == 'true'){
					msg ='idea was created';
					return msg;
				}
				else{
					msg = 'either the an idea with that title exists or you are not allowed to perform this operation.';
					return msg;
				}
		        
		        //JSON.parse(feedback);
		        
		        //return true;
		        //document.getElementById("idea_txtHint").innerHTML = feedback;
		    });
		    }
		    else{
		    	return 'false';
		    }
		},
		updateLocation:function(location, title, callback){
			var content = {};
	    	if(location.state == undefined)
	    	{
	    		content.state = '0';
	    	}
	    	else{
	    		content.state=location.state;
	    	}
	    	if(location.city == undefined)
	    	{
	    		content.city = '0';
	    	}
	    	else{
	    		content.city=location.city;
	    	}
	    	if(location.country == undefined )
	    	{
	    		content.state = '0';
	    	}
	    	else{
	    		content.country=location.country;
	    	}
    	
			
			var data = {
				city:content.city,
				state:content.state,
				country:content.country,
				action:'idea',
				sp:'location',
				title:title,
				un:readCookie('user')
			};
			
			$.ajax({
		        type:"POST",
		        data:data,
		        url:"app.php",
		       
		    }).done(function(feedback){
		    	callback(feedback);
		      console.log('location update', feedback);
		    });
		}
	};
}]);





//END SERVICES

//DIRECTIVES
app.directive('register-view', function() {
  	return {
    	template: 'partials/signup.html'
  	};
  });
  app.directive('loginView', function() {
  	return {
    	template:'partials/login.html'
  	};
  });
//END DIRECTIVES
  