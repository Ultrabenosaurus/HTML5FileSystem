<?php

$fn = (isset($_SERVER['HTTP_X_FILENAME']) ? $_SERVER['HTTP_X_FILENAME'] : false);
$path = (isset($_SERVER['HTTP_X_DIRECTORY']) ? $_SERVER['HTTP_X_DIRECTORY'] : null);
if($fn){
	chdir('../');
	file_put_contents($path.$fn, file_get_contents('php://input'));
	if(file_exists($path.$fn)){
		$dir = explode('/', $_SERVER['SCRIPT_NAME']);
		array_pop($dir);
		$dir = implode('/', $dir);
		$dir = (substr($dir, -1) == '/') ? $dir : $dir.'/';
		echo json_encode(array("result"=>"success", "uri"=>urlencode($path.$fn)));
	} else {
		echo json_encode(array('result'=>'failure', 'details'=>urlencode('file could not be created')));
	}
} else {
	echo "<pre>" . print_r($_SERVER, true) . "</pre>";
}

?>