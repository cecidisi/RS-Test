<?php
header('Access-Control-Allow-Origin: *');
include 'error.php';
if(empty($_POST['filename']) || empty($_POST['ratings']) || empty($_POST['session']) || empty($_POST['session_summary'])){
    return_error('POST parameter missing', 1001);
    exit;
}

$output_dir = "./logs";
if(!file_exists($output_dir)) {
    mkdir($output_dir, 0755, true);
}
chmod($output_dir, 0755);

if(!is_writable($output_dir)) {
    return_error('no writing permission', 1337);
    exit;
}

$filename = $_POST['filename'];
$ratings = $_POST['ratings'];
$session = $_POST['session'];
$session_summary = $_POST['session_summary'];
$file1 = fopen($output_dir.'/ratings_'.$filename, 'w') or die('Unable to open file!');
fwrite($file1, $ratings);
fclose($file1);

$file2 = fopen($output_dir.'/session_summary_'.$filename, 'w') or die('Unable to open file!');
fwrite($file2, $session_summary);
fclose($file2);

$file3 = fopen($output_dir.'/session_'.$filename, 'w') or die('Unable to open file!');
fwrite($file3, $session);
fclose($file3);


echo 'Session data for "'.$filename.'"" saved succesfully';

?>
