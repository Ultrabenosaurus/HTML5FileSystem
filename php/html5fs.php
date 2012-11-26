<?php

// echo json_encode($_SERVER);
// echo "<pre>" . print_r($_SERVER, true) . "</pre>";
if(isset($_SERVER['HTTP_REFERER']) && (stripos($_SERVER['HTTP_REFERER'], $_SERVER['HTTP_HOST']) !== false)){
	// echo "<pre>" . print_r($_POST, true) . "</pre>";
	switch($_POST['type']){
		case 'upload':
			$file = fopen($_POST['dir'].$_POST['fname'], 'w+');
			fwrite($file, $_POST['data']);
			fclose($file);
			if(file_exists($_POST['dir'].$_POST['fname'])){
				$dir = explode('/', $_SERVER['SCRIPT_NAME']);
				array_pop($dir);
				$dir = implode('/', $dir);
				$dir = (substr($dir, -1) == '/') ? $dir : $dir.'/';
				$dir = 'http://'.$_SERVER['HTTP_HOST'].$dir.$_POST['dir'].$_POST['fname'];
				echo json_encode(array('result'=>'success', 'file'=>urlencode($dir), 'data'=>urlencode($_POST['data'])));
			} else {
				echo json_encode(array('result'=>'failure', 'details'=>urlencode('file could not be created')));
			}
			break;
		case 'download':
			if(isset($_POST['file']) && file_exists($_POST['file'])){
				$file = fopen($_POST['file'], 'r+');
				$data = fread($file, filesize($_POST['file']));
				fclose($file);
				echo json_encode(array('result'=>'success', 'data'=>urlencode($data)));
			}
			break;
	}
}

?>