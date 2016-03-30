
<?php

function dbConn(){
	  		$host = 'host=localhost ';
            $port = 'port=5432 ';
            $dbname = 'dbname=addiside_glory ';
            $user = 'user=addiside_dev ';
            $password = 'password==WS@[[+UEC#V ';
            $valid = false;
			
			return pg_connect($host . $port . $dbname. $user.$password); 
	
}


// Path downloading files
if($_POST['pType'] == 'user'){
	$path = 'user_images/';
	$width=300;
}
else{
	$path = 'idea_images/';
	$width=500;
}

$tmp_path = 'tmp/';

// An array of acceptable values type file
$types = array('image/gif', 'image/png', 'image/jpeg');


// The maximum file size 1 mb limit
$size = 1024000;



// Processing the request
if ($_SERVER['REQUEST_METHOD'] == 'POST')
{
	// Check the file type
	if (!in_array($_FILES['picture']['type'], $types))
		die('Prohibited file type: '.$_FILES['picture']['type']);

	// Check the file size
	if ($_FILES['picture']['size'] > $size)
		die('File too large. Less than 1MB please.');
	
	

// Resize function
// rotate - rotate the number of degrees (preferably set to 90, 180, 270)
// quality - image quality (default 75%)

	function resize($file, $rotate, $quality, $max_size)
	{
		global $tmp_path;

// The maximum width, in pixels, by default.
		if ($max_size == null)
			$max_size = 5000;
	
// Image quality by default
		if ($quality == null)
			$quality = 75;

		// Create the source images from source file
		if ($file['type'] == 'image/jpeg')
			$source = imagecreatefromjpeg($file['tmp_name']);
		elseif ($file['type'] == 'image/png')
			$source = imagecreatefrompng($file['tmp_name']);
		elseif ($file['type'] == 'image/gif')
			$source = imagecreatefromgif($file['tmp_name']);
		else
			return false;
			
// Rotate the image
		if ($rotate != null)
			$src = imagerotate($source, $rotate, 0);
		else
			$src = $source;

		// Define the width and height of the image
		$w_src = imagesx($src); 
		$h_src = imagesy($src);

		// set the width restriction.

			$w = $max_size;

		// If the width is greater than a predetermined
		if ($w_src > $w)
		{
			// The calculation of proportions
			$ratio = $w_src/$w;
			$w_dest = round($w_src/$ratio);
			$h_dest = round($h_src/$ratio);

// Create a blank image
			$dest = imagecreatetruecolor($w_dest, $h_dest);
			
// Copy old image to new with change settings
			imagecopyresampled($dest, $src, 0, 0, 0, 0, $w_dest, $h_dest, $w_src, $h_src);

// Output image and clean memory
			imagejpeg($dest, $tmp_path . $file['name'], $quality);
			imagedestroy($dest);
			imagedestroy($src);

			return $file['name'];
		}
		else
		{
// Output image and clean memory
			imagejpeg($src, $tmp_path . $file['name'], $quality);
			imagedestroy($src);

			return $file['name'];
		}
	}

	//$name = resize($_FILES['picture'], $_POST['rotate'], $_POST['quality'], $_POST['width']);
$name = resize($_FILES['picture'], null, 75, $width);
// Load file and the message






$ext = pathinfo($name, PATHINFO_EXTENSION);
//if(!@rename($tmp_path.$name['name'], 'hi.jpg')){
		
	
	
if($_POST['pType'] == 'user'){
	//new name for photo
	$conn =dbConn();
	$u=pg_select($conn,'USER', array('USERNAME'=>$_POST['un']));
	$uid=$u[0]['USER_ID']; //used in both parts of following if statement
	$username=$u[0]['USERNAME'];

	if (!@copy($tmp_path . $name, $path . $username.'.'.'png')){
	//echo 'temp path is '.$tmp_path; 
		
		echo 'Something went wrong while saving your file. Be sure it is less than 1MB. If the problem continues, please contact support.';}
	else{
		$upload_db_path = $path . $username.'.'.'png';
		
		$qy = "SELECT \"SP_updateUserUserIMG\"('$uid',
    		'$upload_db_path'
			);";
			
		$results = pg_query($conn, $qy);
		if($results) echo 'Upload was successful';
		else echo 'Image not saved';
		//echo 'Upload was successful';//.$_FILES['picture']['type']; //  <a href="' . $path . $_FILES['picture']['name'] . '">View</a>.</p>	<p>Path to the file: ' . $path . $_FILES['picture']['name'] . '</p>';
		//on successful upload saving the image path in db is next	echo $name;
		
	}
	}
else{
	
	//new name for photo
	$conn =dbConn();
	$idea_id=pg_select($conn,'IDEA', array('TITLE'=>$_POST['title']));
	
	
	$u=pg_select($conn,'USER', array('USERNAME'=>$_POST['un']));
	echo $u[0]['USERNAME']. ' = username';
	$uid=$u[0]['USER_ID']; 
	$title=$idea_id[0]['TITLE'];
	$iid = $idea_id[0]['IDEA_ID'];
	
	if (!@copy($tmp_path . $name, $path . $title.'.'.'png')){
	//echo 'temp path is '.$tmp_path; 
		
		echo 'Something went wrong while saving your file. Be sure it is less than 1MB. If the problem continues, please contact support.';}
	else{
		$upload_db_path = $path . $title.'.'.'png';
		$s_q  ="'";
		
		$qy = "SELECT \"SP_updateIdeaIDEA_IMG\" ('$upload_db_path','$iid', '$uid');";
		$result = pg_query($conn, $qy);
		
		if($result) echo 'Upload was successful';
		else echo 'Image not saved';
		//echo 'Upload was successful';//.$_FILES['picture']['type']; //  <a href="' . $path . $_FILES['picture']['name'] . '">View</a>.</p>	<p>Path to the file: ' . $path . $_FILES['picture']['name'] . '</p>';
		//on successful upload saving the image path in db is next	echo $name;
		
	}
}
		
// Remove temporary file
	unlink($tmp_path . $name);
}