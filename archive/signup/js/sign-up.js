		$(document).ready(function(){
			$('input[type=text][name=password]').tooltip({
			    placement: "right",
			    trigger: "focus"});			    			
		    $("button").click(function(){
		        $("button").replaceWith("<p>Complete!</p>");
		    });
		    	$(".various").fancybox({
					maxWidth	: 800,
					maxHeight	: 600,
					fitToView	: false,
					width		: '75%',
					height		: '60%',
					autoSize	: true,
					closeClick	: false,
					openEffect	: 'none',
					closeEffect	: 'none',
					padding : 0
				});

		});