<?php

 //DATABASE INFO
  if(isset($_COOKIE['user'])){
 	 //echo _COOKIE['user'];
 }
 session_start();  
 //check_session();
 
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
 	//	setcookie('addis_session',$_COOKIE['PHPSESSID'].$_COOKIE['user']);
	pg_close($conn);
 };
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


// get the q parameter from URL
$q = (isset($_REQUEST["q"])? $_REQUEST["q"]:null);
$checktype = (isset($_REQUEST["checktype"])? $_REQUEST["checktype"]:null);
$pw = (isset($_POST["pw"])? $_POST["pw"]:null);
$un = (isset($_POST["un"])? $_POST["un"]:null);
$em = (isset($_POST["em"])? $_POST["em"]:null);
$title = (isset($_POST["title"])? $_POST["title"]:null);
$description = (isset($_POST["description"])? $_POST["description"]:null);

//setcookie("Addis Ideas","Addis Ideas Cookie");
//echo $_COOKIE["Addis Ideas"];
//$action = (isset($_REQUEST['action'])? $_REQUEST['action']:isset($_POST['action'])? $_POST['action']:null);

//username regex
$un_regex = "/^(?=.{3,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/";
//email regex
$em_regex = "/^\\w+@\\S+\.\\w+$/";


$valid=false;

if($pw)
{
	//echo $un .' : '. $em;
}


$hint = "";
if(isset($_POST['action'])){
	
	switch ($_POST['action']){
		case 'register':
		//	if($_POST['action']=='register')
				$valid = un_em_check($un, $em);
			break;
		case 'login':
			if($_POST['action']=='login'){
				$user=login_user($un, $pw);
				if($user){
					setcookie('user',$user['username'],time()+10800);
					echo true;
				//$_COOKIE['user'] = $user['username'];
			
				}
				//var_dump($user);
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
					
				//echo $_POST['title'];
				//idea_update('new_idea', 'cmsemog', $_POST['title']);
				
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
			//echo 'hi';
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
		// case 'idea_update':
			// idea_update($_POST['sp'], $un, $_POST['title']);
			// break;
	}
	
	

	
}

// lookup all hints from array if $q is different from "" 


if(isset($_POST['un']) 
	&& !empty($_POST['un']) 
	&& $valid == true
	&& verify_username_password_email($un, $pw, $em)) {
    //$action = $_POST['action'];
   	echo registerUser($un, $pw, $em);
   	$valid=false;
   	//echo $_POST['action'];
        // ...etc...
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
	
	$pw_hash = crypt($password);//password_hash($password, PASSWORD_DEFAULT);
	$s_q = "'";
	
  	$qy = 'SELECT "SP_newuser"('.$s_q.$username.$s_q.', '.$s_q.$pw_hash.$s_q.', '.$s_q. $email.$s_q.');';
  	$result = pg_query($conn, $qy);
	
	if($result)
		return true;
	else {
		return false;
	}
}

function verify_pw($un, $pw)
{
	$username = $un;
	//echo '<br/>username'.$un;
	//echo '<br/>pw'.$pw;
	$conn = dbConn();
	$results=pg_select($conn, 'USER', array('USERNAME'=>$username));
//	var_dump($results);
	$pw_hash = $results[0]['PASSWORD'];
	//echo '<br/>pwhash'.$pw_hash;
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
		return $user;//json_encode($user);
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
				$pw_hash = crypt($_POST['contetn']);//password_hash($_POST['content'], PASSWORD_DEFAULT);
				$qy = 'SELECT "SP_updateUserPROFESSION"('.$s_q.$uid.$s_q.','.$s_q.$pw_hash.$s_q.');';
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
			$qy = 'SELECT "SP_updateUserUserIMG"('.$s_q.$uid.$s_q.','.$s_q.$_POST['content'].$s_q.');';
			$result = pg_query($conn, $qy);
			return 'results from user img path '.$result;	
			break;
	}
	pg_close($conn);
	
}

function user_procedure($SP, $un){
	
	$conn = dbConn();
	$s_q = "'";
	$u=pg_query($conn,'SELECT "USER_ID" from "USER" where "USERNAME"='.$s_q.$_POST['un'].$s_q);//, array('USERNAME'=>$_POST['un']));
	$user=pg_fetch_all($u);
	$uid=$user[0]['USER_ID'];
	
	
	//$uid = $user[0]['USER_ID'];
	
	
	
	switch($SP)
	{
		//private message
		case 'notify':
		
		if(isset($_POST['notify_count']))
		{
			$qy = 'SELECT "USER_ID", "USERNAME", "SENDER", "NOTIFICATION TYPE", "MSG", "CONTENT", "TIME" 
			FROM "UserNotificationsView" 
			where "USERNAME" ='.$s_q.$_POST['un'].$s_q .' 
			order by "TIME" 
			limit '.$_POST['notify_count'];
			
		}
		else{
			$qy = 'SELECT "USER_ID", "USERNAME", "SENDER", "NOTIFICATION TYPE", "MSG", "CONTENT", "TIME" as "CREATED_TIMESTAMP"
			FROM "UserNotificationsView" 
			where "USERNAME" ='.$s_q.$_POST['un'].$s_q .' 
			order by "TIME"';
			//limit '.$_POST['notify_count'];
			
		}
			
  			$results = pg_fetch_all(pg_query($conn, $qy));
			if($results)
				echo json_encode($results);
			else 
				echo 'false';
		break;
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
					if($result) echo 'true';
					else echo 'false';
				}
				else{
					//new thread of type 3 and desc of direct  SP_newMessage_ThreadPrivateMessage
					$msgtype = 3;
					$msgdesc = 'direct';
					$qy = 'SELECT "SP_newMessage_ThreadPrivateMessage"('.$s_q.$msgtype.$s_q.','.$s_q.$msgdesc.$s_q.');';
					$thread = pg_query($conn, $qy);
					
					$qy = 'SELECT "SP_newMessage"('.$s_q.$thread[0]['THREAD_ID'].$s_q.','.$s_q.$uid.$s_q.','.$s_q.$_POST['msgcontent'].$s_q.');';
					$result = pg_query($conn, $qy);
					if($result) echo 'true';
					else echo 'false';
				}
			break;
		
		
		//profile view
		case 'profile_view':
		
		
			pg_select($conn, 'PROFILE_VIEW', array('VIEWER_ID'=>$uid, 'VIEWED_ID'=>$viewed[0]['USER_ID']));
			$viewed=pg_select($conn, 'USER', array('USERNAME'=>$_POST['profile_view_username']));
			//check if this user already viewed this profile.
			if($uid == $viewed[0]['USER_ID']){
				break;	
			};
			$view_check=pg_select($conn, 'PROFILE_VIEW', array('VIEWER_ID'=>$uid, 'VIEWED_ID'=>$viewed[0]['USER_ID']));
			if(!$view_check){
				$qy = 'SELECT "SP_newProfile_View"('.$s_q.$uid.$s_q.','.$s_q.$viewed[0]['USER_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
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
			//$isAdmin = false;
			if($uid == $idea[0]['CREATOR_ID'] ){
				$qy = 'SELECT "SP_deleteCollab"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from new collab '.$result;
			}
			break;
		case 'load_profile':
			//	if($_COOKIE['user']){
					//get user info about, username, #likes, #ideas, #views
				//	$result = array();
					$qy = 'SELECT "USERNAME"
								,"UserView"."ABOUT"
								,"UserView"."PROFILE_PATH"
								,count(distinct "IDEA"."IDEA_ID") as "IDEAS"
								,count(distinct "PROFILE_VIEW"."PROFILE_VIEW_ID") as "VIEWS"
								,count(distinct "MESSAGE"."MESSAGE_ID") as "MESSAGES"
								 from "UserView"
							  left join  "PROFILE_VIEW" on "UserView"."USER_ID"= "PROFILE_VIEW"."VIEWED_ID" 
							 left join  "IDEA" on "UserView"."USER_ID"= "IDEA"."CREATOR_ID" 
							 left join "MESSAGE" on "UserView"."USER_ID" = "MESSAGE"."USER_ID"
							 where "UserView"."USER_ID"='.$uid.' 
							group by "UserView"."USERNAME","UserView"."ABOUT", "UserView"."PROFILE_PATH"';
/*
					// $qy1 = 'SELECT 
							  // "UserView"."USERNAME", 
							  // "UserView"."ABOUT", 
							  // "UserView"."PROFILE_PATH", 
							  // count("IDEA"."IDEA_ID") as "IDEAS", 
							  // count("PROFILE_VIEW"."PROFILE_VIEW_ID") as "VIEWS", 
							  // count("MESSAGE"."MESSAGE_ID") as "MESSAGES"
							// FROM 
							  // public."UserView" left join
							  // public."PROFILE_VIEW" on  "UserView"."USER_ID" = "PROFILE_VIEW"."VIEWED_ID" and "UserView"."USER_ID" ='.$uid.' left join
							  // public."IDEA" on "UserView"."USER_ID" = "IDEA"."CREATOR_ID"  left join
							  // public."MESSAGE"  on "UserView"."USER_ID" = "MESSAGE"."USER_ID"
// 			
// 							 
							  // group by 
							// "UserView"."USERNAME","UserView"."ABOUT", "UserView"."PROFILE_PATH";';*/

							
					$result['user']= pg_fetch_all(pg_query($conn, $qy));
					//array_push($result,pg_fetch_all(pg_query($conn, $qy)));
					//var_dump(json_encode($result));
					
					//gets ideas
					
					$user_ideas_query = 'SELECT "TITLE", "DESCRIPTION", 
						 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
						 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV"end end 
						 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
							else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
							when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
								or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
							 end end as "LOCATION"
					       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
					       "COMMENTS", "CREATED_TIMESTAMP"
					  FROM "IdeaFeedList" where "CREATOR_ID"='.$uid.' order by "CREATED_TIMESTAMP" desc limit '.$_POST['idea_count'].'offset '.$_POST['idea_offset'];
  					$result['ideas'] = pg_fetch_all(pg_query($conn, $user_ideas_query));
  					//array_push($result,pg_fetch_all(pg_query($conn, $user_ideas_query)));
  					//var_dump($result);
					//get categories	
					
					
					$user_categories_query = 'SELECT "USER_TOPIC"."TOPICNAME" FROM public."USER_TOPIC" where "USER_ID"='.$uid;
				
						$abc = 'SELECT * from "USER"';
						$result['categories'] = pg_fetch_all(pg_query($conn, $user_categories_query));
						//array_push($result,pg_fetch_all(pg_query($conn, $user_categories_query)));
						$res=json_encode($result);
					//	var_dump($res);
					//	var_dump(json_encode($result));
					//	var_dump($res);
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
	$desc = $_POST['description'];
	
	
	if(strlen($title)>0 && strlen($desc)>0){
		switch($SP)
		{
			case 'new_idea':
				//use $uid for user id
				
				$idea_check = pg_select($conn, 'IDEA', array('TITLE'=>$idea_title));
				if($idea_check == false){
					$qy = 'SELECT "SP_newIdea"('.$s_q.$uid.$s_q.','.$s_q.$_POST['title'].$s_q.','.$s_q.$_POST['description'].$s_q.');';
					$result = pg_query($conn, $qy);
					
					
					
					//create threads 
					//SP_newMessage_TreadCollabOrComment
					//message thread type 1 = collab, 2 = comment, 3 = direct
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
					//$original = $_POST['original_title'];
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
				// else{
					// $idea = pg_select($conn, 'IDEA',array('TITLE'=>$idea_title));
					// $idea_id = $idea[0]['IDEA_ID'];
					// $qy = 'SELECT "SP_updateIdeaDESCRIPTION"('.$s_q.$title.$s_q.','.$s_q.$desc.$s_q.','.$s_q.$idea_id.$s_q.');';
					// $result = pg_query($conn, $qy);
					// return 'results from idea desc update'.$result;
				// }
				
				break;
				
			case 'img':
				$img_path = $_POST['img'];
				$idea_id = pg_select($conn, 'IDEA', array('TITLE'=>$title));
				$qy = 'SELECT "SP_updateIdeaIDEA_IMG"('.$s_q.$img_path.$s_q.','.$s_q.$idea_id[0]['IDEA_ID'].$s_q.','.$s_q.$uid.$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from idea img path update'.$result;
				break;	
				
			case 'tester':
				return $_REQUEST['q'];
				break;
		}
	}
}

function idea_procedure($SP, $un){
		$conn = dbConn();
	$u=pg_select($conn,'USER', array('USERNAME'=>$un));
	$uid=$u[0]['USER_ID'];
	$s_q = "'";
	$title = $_POST['title'];
	//$desc = $_POST['description'];
	
	
	
	switch ($SP){
		//idea like and //idea unlike
		case 'idea_like':
			$idea = pg_select($conn, 'IDEA', array('TITLE'=>$title));
			$like_check = pg_select($conn, 'IDEA_LIKE', array('USER_ID'=>$uid, 'IDEA_ID'=>$idea[0]['IDEA_ID'])); 
			$qy = 'SELECT "SP_newIdea_Like"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$isactive.$s_q.');';
			
			if(!$like_check){
				$isactive = true;
				$result = pg_query($conn, $qy);
				return 'results from idea like '.$result;
			}
			/*else if ($like_check[0]['ACTIVE']==1){
				$isactive = false;
				$result = pg_query($conn, $qy);
				return 'results from idea unlike '.$result;
			}*/
			
			break;
		case 'delete_like':
			$idea = pg_select($conn, 'IDEA', array('TITLE'=> $_POST['title']));
			$qy = 'SELECT "SP_deleteIdea_Like"('.$s_q.$uid.$s_q.','.$s_q.$idea[0]['IDEA_ID'].$s_q.');';
				$result = pg_query($conn, $qy);
				return 'results from delete of idea like '.$result;	
			
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
			//$topic_check = pg_select($conn, 'IDEA_TOPIC', array('IDEA_ID'=>$idea[0]['IDEA_ID'], 'TOPICNAME'=>$_POST['content']));
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
			//$at_check = pg_select($conn, 'IDEA_TOPIC', array('IDEA_ID'=>$idea[0]['IDEA_ID'], 'STAKEHOLDER'=>$_POST['stakeholder']));
			
				$qy = 'SELECT "SP_deleteIdea_Addressed_To"('.$s_q.$idea[0]['IDEA_ID'].$s_q.','.$s_q.$_POST['content'].$s_q.');';
				$result = pg_query($conn, $qy);
				if($result) echo 'true';
				else echo 'false';
		break;
		case 'get_comments':
			$qy='SELECT "TITLE", "USERNAME", "USER_ID", "CONTENT", "IS_COLLAB", 
	       "THREAD_ID", "MESSAGE_TYPE", "CREATED_TIMESTAMP"
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
	$idea_count = 3;//$_POST['idea_count']; //3;
	$idea_offset = 1;//$_post['idea_offset'];//3;
	
	$query = 'SELECT "TITLE", "DESCRIPTION", 
	 case when "LOCATION_CITY" is null then ' .$s_q.$s_q. 'else "LOCATION_CITY" end 
	 ||case when "LOCATION_STATE_PROV" is null then '.$s_q.$s_q.' else case when "LOCATION_CITY" is null then "LOCATION_STATE_PROV" else '.$s_q.', '.$s_q.'||"LOCATION_STATE_PROV"end end 
	 || case when "LOCATION_COUNTRY" is null then '.$s_q.$s_q.' 
		else case when "LOCATION_CITY" is null and "LOCATION_STATE_PROV" is null then "LOCATION_COUNTRY" 
		when ("LOCATION_CITY" is null and "LOCATION_STATE_PROV" is not null) 
			or ("LOCATION_CITY" is not null and "LOCATION_STATE_PROV" is null) then '.$s_q.', '.$s_q.'||"LOCATION_COUNTRY" 
		 end end as "LOCATION"
       , "IDEA_IMG_PATH", "LIKES", "VIEWS", "COLLABORATORS", 
       "COMMENTS", "CREATED_TIMESTAMP"
  FROM "IdeaFeedList" order by "CREATED_TIMESTAMP" desc limit '.$_POST['idea_count'].'offset '.$_POST['idea_offset'].';';
	
		
		//$result = pg_select($conn,'IDEA', array('CREATOR_ID'=>16));//pg_query($conn, 'select * from "IDEA"');//pg_select($conn,'IDEA', array());
		
		$result=pg_fetch_all(pg_query($conn, $query));
		//var_dump($result);
		//'SELECT * FROM "IdeaFeedList" order by "CREATED_TIMESTAMP" desc limit './*$idea_count*/$_POST['idea_count'].'offset '.$_POST['idea_offset']/*$idea_offset*/.';'));
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
//var_dump(idea_update('tester', 'Runner', 'cmsemog'));
//var_dump(ideaFeed());
?>