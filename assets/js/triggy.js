var triggy = {
	load: function() {
		/* form */
		$('#create').submit(function(e){
			e.preventDefault();			
			$('#url').attr('disabled','disabled');
			$('#submit').hide().after('<div id="spinner"></div>');
			$.ajax('/api/create',{
				cache: false,
				data: {
					url: $('#url').val(),
					action: $('#warning-action').val(),
					warning: $('#warning-text').val()
				},
				type: 'POST',
				dataType: 'json',
				success: function(data, status, xhr) {
					if ("error" in data) {
						$('#spinner').remove();
						$('#url').removeAttr('disabled');
						$('#submit').show();
						alert(data.error);
					} else {
						if (data.warning.length < 0) {
							$('#action').html('<div class="show"><p>'+data.message+'</p><div id="triggy-link">'+data.adress+': <a href="'+data.shorturl+'">'+data.shorturl+'</a></div></div>');
						} else {
							$('#action').html('<div class="show"><p>'+data.message+'</p><div id="triggy-link">'+data.action+' '+data.warning+'.<br>'+data.adress+': <a href="'+data.shorturl+'">'+data.shorturl+'</a></div></div>');
						}
					}
				}
			});
		});
		/* resize */
		$('#container').css({ minHeight: ($(window).innerHeight()-30) });
	}
}

$(document).ready(function(){
	triggy.load();
});