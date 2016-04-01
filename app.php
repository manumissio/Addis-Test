<?php

 //DATABASE INFO
  if(isset($_COOKIE['user'])){
 }
 session_start();  

/* Variables used in posts ands gets
 * un
 * pw
 * em
 * action
 * receiver
 * title
 * original_title
 * desc
 * msgtype
 * msgcontent
 * msg_id
 * profile_view_username
 * q
 * img
 * topicname
 * stakeholder
 */
 
function dbConn_local(){
	  		$host = 'host=localhost ';
            $port = 'port=5432 ';
            $dbname = 'dbname=Glory ';
            $user = 'user=postgres ';
            $password = 'password=abc123 ';
            $valid = false;
			
			return pg_connect($host . $port . $dbname. $user.$password); 
	
}

function dbConn(){
	  		$host = 'host=50.87.249.95 ';
            $port = 'port=5432 ';
            $dbname = 'dbname=addiside_glory ';
            $user = 'user=addiside_dev ';
            $password = 'password==WS@[[+UEC#V ';
            $valid = false;
			
			return pg_connect($host . $port . $dbname. $user.$password); 
	
}

function check_session($username){
 	
 	$conn = dbConn();
	
	$u=pg_select($conn,'USER', array('USERNAME'=>$username));
	$uid=$u[0]['USER_ID'];
	
	$results = pg_select($conn, 'SESSION', array('USER_ID'=>$uid));
 	
 	if($_COOKIE['PHPSESSID'] == $results[0]['SESSID'])
		echo 'true';
	else {
		echo 'false';
	}
	pg_close($conn);
 };


// get the q parameter from URL
$q = (isset($_REQUEST["q"])? $_REQUEST["q"]:null);
$checktype = (isset($_REQUEST["checktype"])? $_REQUEST["checktype"]:null);
$pw = (isset($_POST["pw"])? $_POST["pw"]:null);
$un = (isset($_POST["un"])? $_POST["un"]:null);
$em = (isset($_POST["em"])? $_POST["em"]:null);
$title = (isset($_POST["title"])? $_POST["title"]:null);
$description = (isset($_POST["description"])? $_POST["description"]:null);



//username regex
$un_regex = "/^(?=.{3,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/";
//email regex
$em_regex = "/^\\w+@\\S+\.\\w+$/";


$valid=false;


$hint = "";
if(isset($_POST['action'])){
	
	switch ($_POST['action']){
		case 'mail':
			//mailTest();	
		break;
		case 'register':

				$valid = un_em_check($un, $em);
			break;
		case 'login':
			if($_POST['action']=='login'){
				$user=login_user($un, $pw);
				if($user){
					setcookie('user',$user['username'],time()+10800);
					echo true;

			
				}

			}
			break;
		case 'idea':
				if($_POST['action']=='idea'){
					if(isset($_COOKIE['user']) 
						&& isset($_POST['sp']) 
						&& isset($_POST['title'])){
						idea_update($_POST['sp'], $_COOKIE['user'], $_POST['title']);
					}
					else {
						echo 'false';
					}
					

				
			}
			break;
		case 'feed':
			if($_POST['action']=='feed'){
				echo ideaFeed();	
			}
			break;
		case 'user_procedure':
			user_procedure($_POST['sp'], $un);
			break;
		case 'idea_view':
			getIdea();
			break;
		case 'get_topics':
			public_procedure($_POST['action']);
			
			break;
		case 'get_addressed':
			public_procedure($_POST['action']);
			break;
		case 'user_update':
			user_update($_POST['sp'],$un);
			break;
		case 'idea_procedure':
			idea_procedure($_POST['sp'], $un);
			break;
		case 'upload_image':
			upload_image();
			break;
		
	}
	
	

	
}

// lookup all hints from array if $q is different from "" 


if(isset($_POST['un']) 
	&& !empty($_POST['un']) 
	&& $valid == true
	&& verify_username_password_email($un, $pw, $em)) {
   	echo registerUser($un, $pw, $em);
   	$valid=false;

    }
else if(isset($_POST['action'])){
	if($_POST['action']=='register')
		echo false;//'Invalid input';
	
}
    
if ($q !== "" && $_REQUEST['action']=='check') {
	$conn = dbConn();     
	$un_check=pg_select($conn, 'USER',array('USERNAME'=>$q) );
	$em_check=pg_select($conn, 'USER',array('EMAIL'=>$q) );
	//var_dump(verify_username_password_email('cmsemog', 'abc123', ''));
	pg_close($conn);	
    // $q = strtolower($q);
    $len=strlen($q);
 	switch($checktype){
		case 'username':	
	        preg_match($un_regex, $q, $matches);
	         if($un_check[0]['USERNAME']==$q)
	        {
	           $hint ='Username not available';
	        }
	        else if(!$matches){
	            $hint ='Username does not meet requirements. Can\'t start with \'_\' or \'.\' and must be between 3 and 25 characters.';
	        }
	        else{
	            $hint = '';//$q.' is available';
	        }
			break;
			
		case 'email':
			preg_match($em_regex, $q, $matches);
	         if($em_check[0]['EMAIL']==$q)
	        {
	            $hint ='Email not available';
	        }
	        else if(!$matches){
	            $hint ='Email does not meet requirements. ';
	        }
	        else{
	            $hint = '';//$q.' is available';
	        }
		
			break;
	 	}
	 	} 	   
		
   
echo $hint == "" ? "" : $hint;

function un_em_check($un, $em){//returns true if username and email are available
	$conn = dbConn();
	
	$un_check=pg_select($conn, 'USER',array('USERNAME'=>$un) );
	$em_check=pg_select($conn, 'USER',array('EMAIL'=>$em) );
	
	pg_close($conn);
	
	if($un_check || $em_check){
		return false;
	}
	else {
		return true;
	}
}

function registerUser($username, $password, $email){
	$conn = dbConn();
	
	$pw_hash = crypt($password);
	$s_q = "'";
	
  	$qy = 'SELECT "SP_newuser"('.$s_q.$username.$s_q.', '.$s_q.$pw_hash.$s_q.', '.$s_q. $email.$s_q.');';
  	$result = pg_query($conn, $qy);
	
	if($result){
		$fn = $_POST['firstname'];
		$ln = $_POST['lastname'];
		//set first and last and referral
		$us = pg_select($conn, 'USER', array('USERNAME'=>$username));
		$query_fn = 'SELECT "SP_updateUserName"(
		    '.$us[0]['USER_ID'].',
		    '.$s_q.$fn.$s_q.',
		    '.$s_q.$ln.$s_q.'
		);';
		pg_query($conn, $query_fn);
		$isRef = false;		
		if($isRef){
				$qy_ref = 'INSERT INTO "REFERRAL"(
             "REFERING_ID", "REFERRED_ID", "CREATED_TIMESTAMP")
    VALUES ('.$s_q.$ref[0]['USER_ID'].$s_q.', '.$s_q.$us[0]['USER_ID'].$s_q.', current_date);';
		}
	
		setcookie('user', $username, time()+10800);
		return 'true';
	}
	else {
		return 'false';
	}
}

function verify_pw($un, $pw)
{
	$username = $un;

	$conn = dbConn();
	$results=pg_select($conn, 'USER', array('USERNAME'=>$username));

	$pw_hash = $results[0]['PASSWORD'];

	pg_close($conn);
	//returns 1 or 0
	if(crypt($pw, $pw_hash) == $pw_hash)
	return true;
	else return false;	
}

function verify_username_password_email($un, $pw, $em){
	//username regex
	$un_regex = "/^(?=.{3,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/";
	//email regex
	$em_regex = "/^\\w+@\\S+\.\\w+$/";
	$pw_regex="/^(?=.{8,}$)[a-zA-Z0-9-_+=?.!]+$/";
	$valid = true;
	preg_match($un_regex, $un, $matches);
	
	if(!$matches){$valid = false;}
	else{$valid=true;}
	preg_match($em_regex, $em, $matches);
	if(!$matches){$valid = false;}
	else {$valid=true;}
	preg_match($pw_regex, $pw, $matches);
	if(!$matches){$valid = false;}
	else{$valid=true;}
	return $valid;
}

function login_user($un, $pw){
	$user['verified']=verify_pw($un, $pw);
	if($user['verified']=='1'){
		$conn=dbConn();
		$user['username']=$un;
		$selected_user = pg_select($conn, 'USER', array('USERNAME'=>$un));
		$user['user_id'] = $selected_user[0]['USER_ID'];
		$query=pg_query($conn, 'UPDATE "USER" SET "ACTIVE_DATE"=CURRENT_TIMESTAMP  WHERE "USER_ID"='.$selected_user[0]['USER_ID']);
		return $user;
	}
else
{
	return false;
}	
}

function user_update($SP, $un){
	$conn = dbConn();
	$u=pg_select($conn,'USER', array('USERNAME'=>$_POST['un']));
	$uid=$u[0]['USER_ID'];
	$s_q = "'";
	switch($SP)
	{
		case 'about':
			$qy = 'SELECT "SP_updateUserAbout"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			if($result){
				echo 'true';
			}
			else {
				echo 'false';
			}
			 	
			break;
		case 'profession':
			$qy = 'SELECT "SP_updateUserPROFESSION"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			return 'results from about'.$result;
			break;
		case 'password':
			$pw_regex="/^(?=.{8,}$)[a-zA-Z0-9-_+=?.!]+$/";
			preg_match($pw_regex, $_POST['content'], $matches);
			if($matches){
				$pw_hash = crypt($_POST['content']);
				$qy = 'SELECT "SP_updateUserPASSWORD"('.$s_q.$uid.$s_q.','.$s_q.$pw_hash.$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from about'.$result;
			}
			else{
				return 'password does not meet requirements';
			}
			break;
		case 'username':
			$un_regex = "/^(?=.{3,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/";
			preg_match($un_regex, $_POST['content'],$matches);
			if(!$matches){
				echo 'username does not meet requirements';
			}
			else{
				$username_check=pg_select($conn,'USER', array('USERNAME'=>$_POST['content']));
				if($username_check){
					echo 'username already exists';
				}
				else{
					
					$qy = 'SELECT "SP_updateUserUsername"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
					
					$result = pg_query($conn, $qy);
					if($result){
						setcookie('user',$_POST['content'],time()+10800);
						echo 'true';
					}
					else{
						echo 'false';
					}
						
				}
			}
			break;
		case 'user_topic': //uses post param(s):content
			$topic_check = pg_select($conn, 'USER_TOPIC', array('USER_ID'=>$uid, 'TOPICNAME'=>$_POST['content']));
			if(!$topic_check){
				$qy = 'SELECT "SP_newUser_Topic"('.$s_q.$_POST['content'].$s_q.','.$s_q.$uid.$s_q.');';
				$result = pg_query($conn, $qy);
				echo 'true';	
			} 
			else{
				echo 'false';
			}
			break;
		case 'user_topic_delete':
			$qy = 'SELECT "SP_deleteUser_Topic"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			if($result){
				echo 'true';	
			}
			else{
				echo 'false';
			}
			
			
			break;	
		case 'user_privacy':
			$qy = 'SELECT "SP_updateUserPrivacy"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			return 'results from user privacy'.$result;	
			break;
		case 'dob':
			$qy = 'SELECT "SP_updateUserDOB"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			return 'results from dob '.$result;	
			break;
		case 'email':
			$check_email = pg_select($conn, 'USER', array('EMAIL'=>$_POST['content']));
			if(!$check_email){
				$qy = 'SELECT "SP_updateUserEMAIL"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from email '.$result;	
			}
			else{
				return 'email already in use';
			}
			break;
		case 'img':
		
			$results = pg_update($conn, 'USER', array('PROFILE_PATH'=>null), array('USER_ID'=>$uid));
			if($results) echo 'true '.$results;
			else echo 'false'.$results;
				
			break;
		case 'location':
			/*city, state, country*/
			$city= '';
			$state='';
			$country='';
			if($_POST['city']=='0'){
				if(isset($u[0]['LOCATION_CITY'])){
					$city = $u[0]['LOCATION_CITY'];
				}
				else{
					$city = 'null';
				}
			}
			else{$city = $_POST['city'];}

			if($_POST['state']=='0'){
				if(isset($u[0]['LOCATION_STATE_PROV'])){
					$state = $u[0]['LOCATION_STATE_PROV'];
				}
				else{
					$state = 'null';
				}
			}
			else{$state = $_POST['state'];}

			if($_POST['country']=='0'){
				if(isset($u[0]['LOCATION_CCOUNTRY'])){
					$country = $u[0]['LOCATION_COUNTRY'];
				}
				else{
					$country = 'null';
				}
			}
			else{$country = $_POST['country'];}
				
			
			//(isset($_POST["state"])? $_POST["state"]:$u[0]['LOCATION_STATE_PROV'])
			//(isset($_POST["country"])? $_POST["country"]:$u[0]['LOCATION_COUNTRY'])
			$qy = 'SELECT "SP_updateUserLOCATION_CITY_STATE_COUNTRY"('
				.$s_q.$uid.$s_q.','
				//.(isset($_POST['city'])? $s_q.$_POST['city'].$s_q:isset($u[0]['LOCATION_CITY'])?$s_q.$u[0]['LOCATION_CITY'].$s_q:null)
				.(isset($city)?$s_q.$city.$s_q:$city)
				.','
				//.(isset($_POST['state'])? $s_q.$_POST['state'].$s_q:isset($u[0]['LOCATION_STATE_PROV'])?$s_q.$u[0]['LOCATION_STATE_PROV'].$s_q:null)
				.(isset($state)?$s_q.$state.$s_q:$state)
				.','
				//.(isset($_POST['country'])? $s_q.$_POST['country'].$s_q:isset($u[0]['LOCATION_COUNTRY'])?$s_q.$u[0]['LOCATION_COUNTRY'].$s_q:null)
				.(isset($country)?$s_q.$country.$s_q:$country)
				.');';
			$results = pg_query($conn, $qy);
			if($results) echo 'true';
			else echo 'false: city:'.$_POST['city'].' state:'.$_POST['state'].' country:'.$_POST['country'];
			break;
	}
	pg_close($conn);
	
}

function user_procedure($SP, $un){
	
	$conn = dbConn();
	$s_q = "'";
	$u=pg_query($conn,'SELECT "USER_ID" from "USER" where "USERNAME"='.$s_q.$_POST['un'].$s_q);
	$user=pg_fetch_all($u);
	$uid=$user[0]['USER_ID'];

	switch($SP)
	{
		//private message
		case 'idea_message':
			$idea = pg_select($conn, 'IDEA', array('TITLE'=>$_POST['title']));
			$thread = pg_select($conn, 'MESSAGE_THREAD', array('IDEA_ID'=>$idea[0]['IDEA_ID'], 'MESSAGE_TYPE'=>$_POST['msgtype']));
			$qy = 'SELECT "SP_newMessage"('.$s_q.$thread[0]['THREAD_ID'].$s_q.','.$s_q.$uid.$s_q.','.$s_q.$_POST['msgcontent'].$s_q.');';
			$result = pg_query($conn, $qy);		
			if($result) echo 'true';
			else echo 'false';
			break;
		case 'private_message':
				$receiver= pg_select($conn, 'USER', array('USER_ID'=>$_POST['receiver']));
				$threadCheck=pg_exec($conn, "select * from \"UserPrivateMessagesView\" where (\"USER_ID\" in (".$uid.")  and \"SENDER\" in (".$receiver.")) or (\"USER_ID\" in (".$receiver.") and \"SENDER\" in  (".$uid.")");
				if($threadCheck){
					//new message on the thread  SP_newMessage
					$qy = 'SELECT "SP_newMessage"('.$s_q.$threadCheck[0]['THREAD_ID'].$s_q.','.$s_q.$uid.$s_q.','.$s_q.$_POST['msgcontent'].$s_q.');';
					$result = pg_query($conn, $qy);
					return 'results from new message '.$result;
				}
				else{
					//new thread of type 3 and desc of direct  SP_newMessage_ThreadPrivateMessage
					$msgtype = 3;
					$msgdesc = 'direct';
					$qy = 'SELECT "SP_newMessage_ThreadPrivateMessage"('.$s_q.$msgtype.$s_q.','.$s_q.$msgdesc.$s_q.');';
					$thread = pg_query($conn, $qy);
					
					$qy = 'SELECT "SP_newMessage"('.$s_q.$thread[0]['THREAD_ID'].$s_q.','.$s_q.$uid.$s_q.','.$s_q.$_POST['msgcontent'].$s_q.');';
					$result = pg_query($conn, $qy);
					
					return 'results from new thread and message '.$result;
				}
			break;
			case 'notify':
		
			if(!isset($_POST['notify_offset']))
			{
				if($_POST['isPage']=='false'){
					$qy = 'SELECT "USER_ID", "USERNAME", "SENDER", "NOTIFICATION TYPE", "MSG", "CONTENT", "TIME", "LINK"
					FROM "UserNotificationsView" 
					where "USERNAME" ='.$s_q.$_POST['un'].$s_q .' 
					and "TIME" >  current_date-7 
					order by "TIME" desc
					limit '.$_POST['notify_count'];
				}
				else{
					$qy = 'SELECT "USER_ID", "USERNAME", "SENDER", "NOTIFICATION TYPE", "MSG", "CONTENT", "TIME", "LINK"
					FROM "UserNotificationsView" 
					where "USERNAME" ='.$s_q.$_POST['un'].$s_q .' 
					order by "TIME" desc
					limit '.$_POST['notify_count'];
				}
			
				
			}
			else{
				$qy = 'SELECT "USER_ID", "USERNAME", "SENDER", "NOTIFICATION TYPE", "MSG", "CONTENT", "TIME" , "LINK"
				FROM "UserNotificationsView" 
				where "USERNAME" ='.$s_q.$_POST['un'].$s_q .' 
				order by "TIME" desc offset '.$_POST['notify_offset'].' 
				limit '.$_POST['notify_count'];
				
			}
				
	  			$results = pg_fetch_all(pg_query($conn, $qy));
				if($results)
					echo json_encode($results);
				else 
					echo 'false';
		break;
		
		
		//profile view
		case 'profile_view':
		
		
			pg_select($conn, 'PROFILE_VIEW', array('VIEWER_ID'=>$uid, 'VIEWED_ID'=>$viewed[0]['USER_ID']));
			$viewed=pg_select($conn, 'USER', array('USERNAME'=>$_POST['profile_view_username']));
			if($uid == $viewed[0]['USER_ID']){
				break;	
			};
			$view_check=pg_select($conn, 'PROFILE_VIEW', array('VIEWER_ID'=>$uid, 'VIEWED_ID'=>$viewed[0]['USER_ID']));
			if(!$view_check){
				$qy = 'SELECT "SP_newProfile_View"('.$s_q.$uid.$s_q.','.$s_q.$viewed[0]['USER_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from profile view '.$result;
			}
			
			break;
		//new message
		
		//new collab
		case 'new_collab':
			$title = $_POST['title'];
			$idea = pg_select($conn, 'IDEA', array('TITLE'=>$title));
			$isAdmin = false;
			if($uid == $idea[0]['CREATOR_ID']){
				$isAdmin=true;
			}
			$qy = 'SELECT "SP_newCollab"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$isAdmin.$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from new collab '.$result;
			break;
		//delete collab
		case 'delete_collab':
			$title = $_POST['title'];
			$idea = pg_select($conn, 'IDEA', array('TITLE'=>$title));
			if($uid == $idea[0]['CREATOR_ID'] ){
				$qy = 'SELECT "SP_deleteCollab"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from new collab '.$result;
			}
			break;
		case 'load_profile':

			if(isset($_POST['update'])){
					$user_ideas_query = 'SELECT "TITLE", "DESCRIPTION", 
						 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
						 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV"end end 
						 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
							else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
							when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
								or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
							 end end as "LOCATION",
							 "LOCATION_CITY",
							 "LOCATION_STATE_PROV",
							 "LOCATION_COUNTRY"
					       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
					       "COMMENTS", "CREATED_TIMESTAMP"
					  FROM "IdeaFeedList" where "CREATOR_ID"='.$uid.' order by "CREATED_TIMESTAMP" desc limit '.$_POST['idea_count'].'offset '.$_POST['idea_offset'];
  					$result['ideas'] = pg_fetch_all(pg_query($conn, $user_ideas_query));
			}
			else
			{
				
			
					$qy = 'SELECT "USERNAME"
								,"UserView"."ABOUT"
								,"UserView"."PROFILE_PATH"
								,"UserView"."LOCATION_CITY"
								,"UserView"."LOCATION_STATE_PROV"
								,"UserView"."LOCATION_COUNTRY"
								,count(distinct "IDEA"."IDEA_ID") as "IDEAS"
								,count(distinct "PROFILE_VIEW"."PROFILE_VIEW_ID") as "VIEWS"
								,count(distinct "MESSAGE"."MESSAGE_ID") as "MESSAGES"
								
								 from "UserView"
							  left join  "PROFILE_VIEW" on "UserView"."USER_ID"= "PROFILE_VIEW"."VIEWED_ID" 
							 left join  "IDEA" on "UserView"."USER_ID"= "IDEA"."CREATOR_ID" 
							 left join "MESSAGE" on "UserView"."USER_ID" = "MESSAGE"."USER_ID"
							 where "UserView"."USER_ID"='.$uid.' 
							group by "UserView"."USERNAME","UserView"."ABOUT", "UserView"."PROFILE_PATH","UserView"."LOCATION_CITY"
								,"UserView"."LOCATION_STATE_PROV"
								,"UserView"."LOCATION_COUNTRY"';

							
					$result['user']= pg_fetch_all(pg_query($conn, $qy));

					
					$user_ideas_query = 'SELECT "TITLE", "DESCRIPTION", 
						 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
						 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV"end end 
						 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
							else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
							when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
								or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
							 end end as "LOCATION",
							 "LOCATION_CITY",
							 "LOCATION_STATE_PROV",
							 "LOCATION_COUNTRY"
					       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
					       "COMMENTS", "CREATED_TIMESTAMP"
					  FROM "IdeaFeedList" where "CREATOR_ID"='.$uid.' order by "CREATED_TIMESTAMP" desc limit '.$_POST['idea_count'].'offset '.$_POST['idea_offset'];
  					$result['ideas'] = pg_fetch_all(pg_query($conn, $user_ideas_query));
	
					
					
					$user_categories_query = 'SELECT "USER_TOPIC"."TOPICNAME" FROM public."USER_TOPIC" where "USER_ID"='.$uid;
				
						$abc = 'SELECT * from "USER"';
						$result['categories'] = pg_fetch_all(pg_query($conn, $user_categories_query));
						$res=json_encode($result);
			}
						echo json_encode($result);
			break;
			
	}
	pg_close($conn);
}

function idea_update($SP, $un, $idea_title){
	$conn = dbConn();
	$u=pg_select($conn,'USER', array('USERNAME'=>$un));
	$uid=$u[0]['USER_ID'];
	$s_q = "'";
	$title = $_POST['title'];
	//$desc = $_POST['description'];
	
	
	//if(strlen($title)>0 && strlen($desc)>0){
		switch($SP)
		{
			case 'new_idea':
				//use $uid for user id
				
				$idea_check = pg_select($conn, 'IDEA', array('TITLE'=>$idea_title));
				if($idea_check == false){
					$qy = 'SELECT "SP_newIdea"('.$s_q.$uid.$s_q.','.$s_q.$_POST['title'].$s_q.','.$s_q.$_POST['description'].$s_q.');';
					$result = pg_query($conn, $qy);
					
					
					
					//create threads 

					$idea = pg_select($conn, 'IDEA', array('TITLE'=>$idea_title));
					$idea_id=$idea[0]['IDEA_ID'];
					
					//collab thread
					$msgtype=1;
					$msgdesc='collab';
					$qy = 'SELECT "SP_newMessage_ThreadCollabOrComment"('.$s_q.$idea_id.$s_q.','.$s_q.$msgtype.$s_q.','.$s_q.$msgdesc.$s_q.');';
					$makethread = pg_query($conn, $qy);
					
					//comment thread
					$msgtype=2;
					$msgdesc='comment';
					$qy = 'SELECT "SP_newMessage_ThreadCollabOrComment"('.$s_q.$idea_id.$s_q.','.$s_q.$msgtype.$s_q.','.$s_q.$msgdesc.$s_q.');';
					$result = pg_query($conn, $qy);
					echo 'true';
				}
				else{
					echo 'false';
				}
				
				break;
				
			case 'description':
			
				$idea_check = pg_select($conn, 'IDEA', array('TITLE'=>$_POST['original_title']));
				if($idea_check){
					$idea = pg_select($conn, 'IDEA',array('TITLE'=>$_POST['original_title']));
					$idea_id = $idea[0]['IDEA_ID'];
					$qy = 'SELECT "SP_updateIdeaDESCRIPTION"('.$s_q.$_POST['title'].$s_q.','.$s_q.$_POST['description'].$s_q.','.$s_q.$idea_id.$s_q.');';
					$result = pg_query($conn, $qy);
					if($result) echo 'true';
					else echo 'false';
				}
				else{
					echo 'Idea does not exist';
				}
				
				break;
				
			case 'img':
				$results=pg_update($conn, 'IDEA', array('IDEA_IMG_PATH'=>null), array('TITLE'=>$_POST['title']));
				if($results){
					echo 'true';
				}
				else{
					echo 'false';
				}
				// $img_path = $_POST['img'];
				// $idea_id = pg_select($conn, 'IDEA', array('TITLE'=>$title));
				// $qy = 'SELECT "SP_updateIdeaIDEA_IMG"('.$s_q.$img_path.$s_q.','.$s_q.$idea_id[0]['IDEA_ID'].$s_q.','.$s_q.$uid.$s_q.');';
				// $result = pg_query($conn, $qy);
				// return 'results from idea img path update'.$result;
				break;	
				
			case 'location':
				$idea= pg_select($conn, 'IDEA', array('TITLE'=>$title));
				$city= '';
				$state='';
				$country='';
				if($_POST['city']=='0'){
					if(isset($idea[0]['LOCATION_CITY'])){
						$city = $idea[0]['LOCATION_CITY'];
					}
					else{
						$city = 'null';
					}
				}
				else{$city = $_POST['city'];}
	
				if($_POST['state']=='0'){
					if(isset($idea[0]['LOCATION_STATE_PROV'])){
						$state = $idea[0]['LOCATION_STATE_PROV'];
					}
					else{
						$state = 'null';
					}
				}
				else{$state = $_POST['state'];}
	
				if($_POST['country']=='0'){
					if(isset($idea[0]['LOCATION_CCOUNTRY'])){
						$country = $idea[0]['LOCATION_COUNTRY'];
					}
					else{
						$country = 'null';
					}
				}
				else{$country = $_POST['country'];}
				
				$qy = 'SELECT "SP_updateIdeaLOCATION"('.$s_q.$city.$s_q.','.$s_q.$state.$s_q.','.$s_q.$country.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$results = pg_query($conn,$qy);
				if($results) echo 'true';
				else echo 'false';
				break;
		}
	
}

function idea_procedure($SP, $un){
		$conn = dbConn();
	$u=pg_select($conn,'USER', array('USERNAME'=>$un));
	$uid=$u[0]['USER_ID'];
	$s_q = "'";
	if(isset($_POST['title'])){
		$title = $_POST['title'];	
	}

	
	
	
	switch ($SP){
		//idea like and //idea unlike
		case 'idea_like':
			$idea = pg_select($conn, 'IDEA', array('TITLE'=>$title));
			$like_check = pg_select($conn, 'IDEA_LIKE', array('USER_ID'=>$uid, 'IDEA_ID'=>$idea[0]['IDEA_ID'])); 
			
			if(!$like_check){
				$isactive = true;
				$qy = 'SELECT "SP_newIdea_Like"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$isactive.$s_q.');';
				$result = pg_query($conn, $qy);
				if($result)
					echo 'true';
				else echo 'false';
				//return 'results from idea like '.$result;
			}

			
			break;
		case 'delete_like':
			$idea = pg_select($conn, 'IDEA', array('TITLE'=> $_POST['title']));
			$qy = 'SELECT "SP_deleteIdea_Like"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result)
					echo 'true';
				else echo 'false';
			//	return 'results from delete of idea like '.$result;	
			
			break;
	//idea view
		case 'idea_view':
			$idea = pg_select($conn, 'IDEA', array('title'=>$_POST['title']));
			$qy = 'SELECT "SP_newIdea_View"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
			$result = pg_query($conn, $qy);
			return 'results from idea view'.$result;
			break;
		case 'idea_topic':
			$idea = pg_select($conn,'IDEA',array('TITLE'=>$_POST['title']));
			$topic_check = pg_select($conn, 'IDEA_TOPIC', array('IDEA_ID'=>$idea[0]['IDEA_ID'], 'TOPICNAME'=>$_POST['content']));
			if(!$topic_check){
				$qy = 'SELECT "SP_newIdea_Topic"('.$s_q.$_POST['content'].$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result)echo 'true';	
				else echo 'false';
			} 
			else{
				echo 'already a topic of this idea';
			}
			break;
		//delete idea topic
		case 'delete_idea_topic':
			$idea = pg_select($conn,'IDEA',array('TITLE'=>$_POST['title']));
				$qy = 'SELECT "SP_deleteIdea_Topic"('.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$_POST['content'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result) echo 'true';
				else echo 'false';	
			
			break;
		case 'addressed_to':
			$idea = pg_select($conn,'IDEA',array('TITLE'=>$_POST['title']));
			$at_check = pg_select($conn, 'IDEA_ADDRESSED_TO', array('IDEA_ID'=>$idea[0]['IDEA_ID'], 'STAKEHOLDER'=>$_POST['content']));
			if(!$at_check){
				$qy = 'SELECT "SP_newIdea_Addressed_TO"('.$s_q.$_POST['content'].$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result) echo 'true';	
				else echo 'false';
			} 
			else{
				return 'already addressing with this idea';
			}
			break;
			
		//delete addressed to
		case 'delete_addressed_to':
			$idea = pg_select($conn,'IDEA',array('TITLE'=>$_POST['title']));
			
				$qy = 'SELECT "SP_deleteIdea_Addressed_To"('.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$_POST['content'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result) echo 'true';
				else echo 'false';
		break;
		case 'get_comments':
			$qy='SELECT "TITLE", "USERNAME", "USER_ID", "CONTENT", "IS_COLLAB", "MESSAGE_ID" as "MSG_ID", 
	       "THREAD_ID", "MESSAGE_TYPE", "CREATED_TIMESTAMP", "IMG_PATH"
	  FROM "IdeaCommentMessagesView"
	  where "TITLE" ='.$s_q.$_POST['title'].$s_q.'order by "CREATED_TIMESTAMP" desc limit 10 offset '.$_POST['idea_offset'];
			$results = pg_fetch_all(pg_query($conn, $qy));
			echo json_encode($results);
		break;
		case 'delete_message':
			$qy='SELECT "SP_deleteMessage"(
			    '.$s_q.$_POST['msgID'].$s_q.'
			);';
			$results = pg_query($conn, $qy);
			if($results){echo 'true';}
			else{echo 'false';}
		break;
	}
}
function ideaFeed(){
	$s_q = "'";
	$conn = dbConn();
	$idea_count = 3;
	$idea_offset = 1;
	//$results['likes']=array();
	$query = 'SELECT "TITLE", "DESCRIPTION", 
	 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
	 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV" end end 
	 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
		else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
		when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
			or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
		 end end as "LOCATION",
		 "LOCATION_CITY",
		 "LOCATION_STATE_PROV",
		 "LOCATION_COUNTRY"
       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
       "COMMENTS", "CREATED_TIMESTAMP"
  FROM "IdeaFeedList" order by "CREATED_TIMESTAMP" desc limit '.$_POST['idea_count'].' offset '.$_POST['idea_offset'].';';
		$result['ideas']=pg_fetch_all(pg_query($conn, $query));
		
		//get liked ideas
		if(isset($_POST['un']))
		{
				$u=pg_select($conn,'USER', array('USERNAME'=>$_POST['un']));
					$uid=$u[0]['USER_ID'];
					$index =0;
					foreach ($result['ideas'] as &$i) {
					$id=pg_select($conn, 'IDEA', array('TITLE'=>$i['TITLE']));
					$res = pg_select($conn, 'IDEA_LIKE', array('IDEA_ID'=>$id[0]['IDEA_ID'], 'USER_ID'=>$uid));
					if($res){
						($result['likes'][$index] =  $i['TITLE']);
						$index++;
					}
						
				}
		}
		

		//get likes end]
		return json_encode($result);
	pg_close($conn);
}

function getIdea(){
	$conn = dbConn();
	$s_q = "'";
	$qy = 'SELECT "TITLE", "DESCRIPTION", 
	 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
	 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV"end end 
	 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
		else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
		when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
			or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
		 end end as "LOCATION"
		 ,"LOCATION_CITY",
							 "LOCATION_STATE_PROV",
							 "LOCATION_COUNTRY"
       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
       "COMMENTS", "CREATED_TIMESTAMP"
  FROM "IdeaFeedList" 
  where "TITLE"='.$s_q.$_POST['title'].$s_q;
  $idea = pg_select($conn, 'IDEA', array('TITLE'=>$_POST['title']));
  $cat_qy = pg_select($conn, 'IDEA_TOPIC', array('IDEA_ID'=>$idea[0]['IDEA_ID']));
  $addressedTo_qy = pg_select($conn, 'IDEA_ADDRESSED_TO', array('IDEA_ID'=>$idea[0]['IDEA_ID']));
  $result['idea'] = pg_fetch_all(pg_query($conn, $qy));
  $result['categories']=$cat_qy;
  $result['addressed_to']=$addressedTo_qy;
 
  $uname =pg_select($conn, 'USER', array('USER_ID' => $idea[0]['CREATOR_ID']));
   $result['idea_owner']=$uname[0]['USERNAME'];
  
  echo json_encode($result);
	
}

function public_procedure($action)
{
	$conn=dbConn();
	switch($action){
		case 'get_topics':
			setcookie('master', 'yo');
			//$topics=pg_select($conn,'LOOKUP_TOPICS');
			$qy = pg_query($conn, 'SELECT "TOPICNAME" FROM "LOOKUP_TOPICS";');
			$results = pg_fetch_all($qy);
			echo json_encode($results);
			break;
		case 'get_addressed':
			//$addressed_to=pg_select($conn,'LOOKUP_ADDRESSED_TO');
			$qy = pg_query($conn, 'SELECT "STAKEHOLDER" FROM "LOOKUP_ADDESSED_TO";');
			$results = pg_fetch_all($qy);
			echo json_encode($results);
			//echo json_encode($addressed_to);
			break;
	}
}

function upload_image()
{//user_image, sp, content, action
//sp is user_image or idea_image
print_r($_POST);
//echo $_POST['user_image'];
	$filename= $_POST['user_image'];
    $img=file_get_contents($_POST['user_image']);
	
	if($_POST['sp']=='user_image'){
		//do code for user 
		
		$destdir = 'user_images/';
		file_put_contents($destdir.substr($filename, strrpos($filename,'/')), $img);
	}
	else{
		//do code for the idea. 
		$destdir = 'idea_images/';
		file_put_contents($destdir.substr($filename, strrpos($filename,'/')), $img);
	}  
	 
}
function passwordReset(){
	
	if($_POST['sp'] == 'reset'){//actually change password. Takes new password, confirmation password and temporary password
			$newPass = $_POST['newPass'];
			$confirm = $_POST['confirm'];
			$tempPass = $_POST['temp'];
			$conn = dbConn();
			$u=pg_select($conn,'USER', array('USERNAME'=>$username));
			$uid=$u[0]['USER_ID'];
			//check that new and confirm match
			if($newPass == $confirm){
				//check if newPassword is valid
				$pw_regex="/^(?=.{8,}$)[a-zA-Z0-9-_+=?.!]+$/";
				preg_match($pw_regex, $newPass, $matches);
				if(!$matches){
					//check if the temp password is for the user
					if(crypt($tempPass, $u[0]['TEMP']) == $u[0]['TEMP']){
					//if yes, change password	
					$results =pg_update($conn, 'USER', array('PASSWORD'=>$newPass), array('USER_ID'=>$uid));
					if($results){echo 'true';}
					else{echo 'false';}
					}
					else{
						echo 'false';//if no, echo false
					}
				}
				else {
					echo 'false';
				}
			}
			else{
				echo 'false';
			}
			
			
			
	}
	else {//initialize password approach
		//given by user. Should be email on file for the user
		$email_to=$_POST['email'];
		
		//checks if email is in system and associated to user
		if(un_em_check('', $email)){
			//email user code
			//generate code
	  	
	  	$alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';//list of alphabet letters
		$num = '0123456789';//list of numeric digits
	    $pass = array(); //remember to declare $pass as an array
	    $alphaLength = strlen($alphabet) - 1; //put the length -1 in cache
	    $numLength = strlen($num); 
	    
		//loops to password length long enough and alphanumeric to satisfy password requirements
	    for ($i = 0; $i < 12; $i++) {
	        $n = rand(0, $alphaLength);
	        $pass[$i] = $alphabet[$n];//input alphabet
			$i++; //incrememnt
			if($i<12){
			$n=rand(0, $numLength);
			
			$pass[$i]= $num[$n]; //input numeric
			}	
	    }
		//stores the temp password in variable tempPass
			$tempPass = join($pass);
		
	
			//save code in db
			$pw_hash = crypt($tempPass); //temporary password's hash to be stored
			$conn = dbConn();
			$u=pg_select($conn,'USER', array('USERNAME'=>$username));
			$uid=$u[0]['USER_ID'];
			
			$result=pg_update($conn, 'USER', array('TEMP'=>$pw_hash), array('USER_ID'=>$uid));
			if($result){//send email
				$email_res = mail (  
					//$to
					$email_to
					, 
					//$subject 
					'Addis Ideas Account Password Reset', 
					//string $message
					'You requested a password reset. Your temporary password is "'.$tempPass.'"' 
					//[, string $additional_headers [, string $additional_parameters ]] 
					,array('FROM'=>'support@addisideas.org')
				);
				
				if($email_res)
				{
					echo 'true';
				}else{
					echo 'false';
				}
			}
			else {
				echo 'false';
			}
			
			//email code
		}
		else{
			echo 'false';
		}
	
	}
	
}

function DELETEME_EmailFunction(){
	
// Check for empty fields
if(empty($_POST['name'])  	||
  empty($_POST['email']) ||
  empty($_POST['phone']) ||
  empty($_POST['message'])	||
  !filter_var($_POST['email'],FILTER_VALIDATE_EMAIL))
  {
echo "No arguments Provided!";
return false;
  }

$name = $_POST['name'];
$email_address = $_POST['email'];
$phone = $_POST['phone'];
$message = $_POST['message'];

// Create the email and send the message
$to = 'info@addisideas.org'; // Add your email address inbetween the '' replacing yourname@yourdomain.com - This is where the form will send a message to.
$email_subject = "Website Contact Form:  $name";
$email_body = "You have received a new message from your website contact form.\n\n"."Here are the details:\n\nName: $name\n\nEmail: $email_address\n\nPhone: $phone\n\nMessage:\n$message";
$headers = "From: info@addisideas.org\n"; // This is the email address the generated message will be from. 
$headers .= "Reply-To: info@addisideas.org";	
mail($to,$email_subject,$email_body,$headers);
return true;	

}
?>