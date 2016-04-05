<?php
	header('Access-Control-Allow-Origin: *');
	include '../server/error.php';
	if(empty($_GET['rs'])){
		return_error('GET parameter missing', 1001);
		exit;
	}
	$_SESSION['rs'] = $_GET['rs'];
?>

<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <title>RS Evaluation</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width">
	<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<script src="https://code.jquery.com/jquery-2.2.2.min.js" integrity="sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI=" crossorigin="anonymous"></script>
</head>

<body>
	<div class="container" style="text-align: center;">
		<br><br><br><br>
		<h3>Welcome to our online evaluation</h3>
		<br>
		<h3>Make sure you open the Study in a new window / tab</h3>
		<br><br><br>
		<div class="form-group" style="width: 500px; margin-left: auto; margin-right: auto;">
			<h4>Please enter your <strong>Prolific</strong> ID</h4><br>
			<input class="form-control" id="prolific-id"></input>
		</div>
		<br>
		<a href="index.html" id="btn-start" class="btn btn-primary btn-large disabled"> Start </a>
	</div>

	<script type="text/javascript">
		var rs = "<?php echo $_SESSION['rs']; ?>";
		window.sessionStorage.setItem('rs', rs);
		console.log(rs);

		var validateInput = function(text){
			if(text !== '') {
				window.sessionStorage.setItem('user-id', text);
				$('#btn-start').removeClass('disabled');
			}
			else {
				$('#btn-start').addClass('disabled')
			}
		};

		$('#prolific-id').keyup(function(evt){
			evt.stopPropagation();
			validateInput($(this).val());
		});


		$('#prolific-id').bind('paste', function(e) {
     		var _this = this;
          	setTimeout(function(e) {
            	validateInput($(_this).val());
          	}, 0);
		});

	</script>
</body>
</html>
