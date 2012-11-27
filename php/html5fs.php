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
	// echo get_mime_type('Stuk-jszip-5b88e21.zip');
}

function get_mime_type($filename){
	$dir = explode('/', $_SERVER['DOCUMENT_ROOT']);
	array_pop($dir);
	array_pop($dir);
	array_pop($dir);
	$dir = implode('/', $dir) . "/apache/conf/";
	$fileext = substr(strrchr($filename, '.'), 1);
	if(empty($fileext)) return (false);
	$regex = "/^([\w\+\-\.\/]+)\s+(\w+\s)*($fileext\s)/i";
	$lines = file($dir."mime.types");
	foreach($lines as $line){
			if(substr($line, 0, 1) == '#') continue;
			$line = rtrim($line) . " ";
			if(!preg_match($regex, $line, $matches)) continue;
			return ($matches[1]);
	}
	return (false);
}

?>