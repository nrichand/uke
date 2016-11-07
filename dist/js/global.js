/* ****************************** */
/*   DECLARATION DES FONCTIONS   */
/* **************************** */

/* BREAK POINT */
function assign_bootstrap_mode() {
	
   winWidth = $( window ).width();
   var mode = '';

    $("body").removeClass("mode-xs").removeClass("mode-sm").removeClass("mode-md").removeClass("mode-lg").removeClass("mode-desktop");

	if ( winWidth < 768) { $('body').addClass('mode-xs').removeClass('mode-desktop');}
	else if ( winWidth >= 769 &&  winWidth <= 992) { $('body').addClass('mode-sm mode-desktop');}
	else if ( winWidth > 993 &&  winWidth <= 1200) { $('body').addClass('mode-md mode-desktop');}
	else if ( winWidth > 1201) { $('body').addClass('mode-lg');}
	else  { $('body').addClass('mode-basic');}
   
}

 

/* Page home - vertical center */
function dashboardheight() {
  
  var theviewport = '';
  var theCookie = '';	
  var thefooter = '';	
	
	
	var theviewport = $(window).height();
	var theCookie = $('#cookistop').outerHeight();	
	var thefooter = $('#ft').outerHeight();	
	$('.wrapper').removeAttr('style');
	
	var thetotal =  theviewport - (theCookie + thefooter) ;
	  
	
	$('.mode-desktop .wrapper').css('height',thetotal);
}
 

 


/* ******************************** */
/*  DOCUMENT                       */
/* ****************************** */
$(document).ready(function() {
 
	 
	
/* ********************** BREAK POINT DECLARATIONS ********************** */
assign_bootstrap_mode();


/* btn search */	 
 $('.btn-searching a').click(function(){	
 	if ($('.block-search').is(":hidden")) {
       $('.block-search').slideDown("slow");
		$(this).addClass('active');
      } else {
 		$('.block-search').slideUp("Slow");
		  	$(this).removeClass('active');
      }
	  return false;
 });
	
	
 $('.li-search a').click(function(){	
 	if ($('.block-search').is(":hidden")) {
       $('.block-search').slideDown("slow");
		$(this).addClass('active');
      } else {
 		$('.block-search').slideUp("Slow");
		  	$(this).removeClass('active');
      }
	  return false;
 });	
	

/* Filtres */
$('#btnfilter').click(function(){	
		
 if ( $('#aside-filter').is(":hidden")) {
       $('#aside-filter').slideDown("slow");
		$(this).addClass('active');
      } else {
 		$('#aside-filter').slideUp("Slow");
		  	$(this).removeClass('active');
      }
	  return false;
 });	
	
	
$('.mode-xs .block-filter h2').click(function(){	
		
		var thebox = $(this).parent().find('.box');
		
 	if (thebox.is(":hidden")) {
       thebox.slideDown("slow");
		$(this).addClass('active');
      } else {
 		thebox.slideUp("Slow");
		  	$(this).removeClass('active');
      }
	  return false;
 });	
	

  
/* ********************** Cookies Sweep Day ********************** */
$( '#closecookiediv' ).click(function () {
            $.cookie( 'cookiepop', 'set', {expires: 7, path: '/' } );
            $( '#cookistop' ).remove();
			return false;
});
		
 
/* See comments */
	
 $('.mode-xs .p-seecomments').click(function(){	
 
 	if ($('.list-comments').is(":hidden")) {
       $('.list-comments').show("slow");
		$('#block-replyform').show("slow");
		$(this).find('.btn').html("<i class='fa fa-times' aria-hidden='true'></i></i>Hide comments...");
		
      } else {
 		$('.list-comments').hide("Slow");
		  	$('#block-replyform').hide("slow");
			$(this).find('.btn').html("<i class='fa fa-commenting-o' aria-hidden='true'></i> See comments...");      }
	  return false;
	});
	
	
	
	
	
/* end document */
});

 
 


/* ******************************** */
/*  REZISE                         */
/* ****************************** */
// Reload JavaScript
$(window).bind('resize', function(e){ 
 assign_bootstrap_mode();
 

});
 
