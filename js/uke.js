var songs;

var downArrowIcon = '<i class="fa fa-long-arrow-down" aria-hidden="true"></i>';
var downArrowIconRed = '<i style="color: crimson;" class="fa fa-long-arrow-down" aria-hidden="true"></i>';

var upArrowIcon = '<i class="fa fa-long-arrow-up" aria-hidden="true"></i>';
var upArrowIconRed = '<i style="color: crimson;" class="fa fa-long-arrow-up" aria-hidden="true"></i>';

var minusIcon = '<i class="fa fa-minus" aria-hidden="true"></i>';
var chuckIcon = '<i class="fa fa-hand-paper-o" aria-hidden="true"></i>';
var closeHandIcon = '<i class="fa fa-hand-rock-o" aria-hidden="true"></i>';

function displaySongsList(query){
	Helpers.withPrismic(function(ctx) {
		var request = ctx.api.form("everything").ref(ctx.ref);

		if(query){
        	request.query(query);
        }

        request.set('page', parseInt(window.location.hash.substring(1)) || 1 )
            .orderings('[my.uke-song.name]')
        	.submit(function(err, docs) {
            if (err) { Configuration.onPrismicError(err); return; }
            // Feed the templates
            //console.log(docs.results);

            if(! songs){
            	songs = $("#list-song-template").html();          
            }
            var song_template = Handlebars.compile(songs);

            $("#listSongs").html(song_template(docs.results))
        });
    });
}

function addFilterHandler(){
	$("#level").on('change', function() {
	  var selectedLevel = this.value;

	  if(selectedLevel){
	  	var query = '[[:d = at(my.uke-song.ukelevel, "' + selectedLevel + '")]]';
	  	displaySongsList(query);	
	  } else {
	  	displaySongsList();
	  }

	});
}

function displayASong(){
	Helpers.withPrismic(function(ctx) {

        var id = Helpers.queryString['id'],
            slug = Helpers.queryString['slug'];

        ctx.api.form("everything").ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]').submit(function(err, docs) {

            if (err) { Configuration.onPrismicError(err); return; }

            var doc = docs.results[0];

            // If there is no documents for this id
            if(!doc) {
                document.location = '404.html';
            }

            //console.log(doc);
            document.title = "Ukulele tutorial - " + doc.data['uke-song.artist'].value + " " + doc.data['uke-song.name'].value;

            //improve tablature
            doc.tablature = doc.getStructuredText('uke-song.tabs').asHtml(ctx.linkResolver);
            doc.tablature = doc.tablature.replace(/ /g, "&nbsp;")
                .replace(new RegExp("\\(U\\)", 'g'), upArrowIcon)
                .replace(new RegExp("\\(D\\)", 'g'), downArrowIcon);
                    
            //replace chords by url from ukulele-chords website
            doc.chords_img_url = []
            var prismic_chords = doc.data['uke-song.chords'].value;
            prismic_chords.forEach(function(elem){
                var chord_first_alternative = all_chords[elem.label.value][0];
                var chord_img_url = chord_first_alternative.chord_diag_mini;
                var chord_url = chord_first_alternative.chord_url;
                var newChord = { "diag_mini" : chord_img_url, "chord_url" : chord_url}
                doc.chords_img_url.push(newChord);
            });            

            doc.arrowStrum = convertStrumToArrow(doc.data['uke-song.strumming_pattern'].value);

            var song = $("#song-template").html();
            var song_template = Handlebars.compile(song);
            $("#ukeSong").html(song_template(doc));

            var bread = $("#breadcrumb-template").html();
            var bread_template = Handlebars.compile(bread);            
            $("#bread").html(bread_template(doc));

            checkIfFavorited();       
        });

    });
}

function getURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function displaySongFromTab(){
    //var tabId = $("#ukeTabId").val();

    var tabId = getURLParameter("tabId");
    var url = "http://ukulele-agiletribu.rhcloud.com/tab?tabid="+tabId;

    $.get( url, function( doc ) {
        doc.tablature = doc.infos.song.replace(/ /g, "&nbsp;")
                .replace(new RegExp("\\\r", 'g'), "<br />")
                .replace(new RegExp("\\\n", 'g'), "<br />")
                .replace(new RegExp("\\(U\\)", 'g'), upArrowIcon)
                .replace(new RegExp("\\(D\\)", 'g'), downArrowIcon);


        doc.chords_img_url = []
        var prismic_chords = doc.infos.chords;
        prismic_chords.forEach(function(elem){
            var chord_first_alternative = all_chords[elem][0];
            var chord_img_url = chord_first_alternative.chord_diag_mini;
            var chord_url = chord_first_alternative.chord_url;
            var newChord = { "diag_mini" : chord_img_url, "chord_url" : chord_url}
            doc.chords_img_url.push(newChord);
        });

        var bread = $("#breadcrumb-template").html();
        var bread_template = Handlebars.compile(bread);            
        $("#bread").html(bread_template(doc));

        var song = $("#song-template").html();
        var song_template = Handlebars.compile(song);
        $("#ukeSong").html(song_template(doc));
    });
}

function printDiv(divName) {
     var printContents = document.getElementById(divName).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;

     window.print();

     document.body.innerHTML = originalContents;
}

function initFirebase(){
  var config = {
    apiKey: "AIzaSyDt379V8lGTwY8B2fXyy1CxIGhVxVgKSDg",
    authDomain: "ukulele-600b8.firebaseapp.com",
    databaseURL: "https://ukulele-600b8.firebaseio.com",
    storageBucket: "ukulele-600b8.appspot.com",
    messagingSenderId: "201984941780"
  };
  firebase.initializeApp(config);
}

function login(){
    if(firebase.auth().currentUser){
        firebase.auth().signOut().then(function() {              
          location.reload();
        }, function(error) {
          console.log(error);
        });
    } else {
        window.location='login.html';
    }
}

function initUser(){
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var uid = user.uid;
        var providerData = user.providerData;
        user.getToken().then(function(accessToken) {
            $("#username").html("<i>" + displayName + "</i>");
            $("#login").html('<i class="fa fa-sign-out" aria-hidden="true"></i>Logout');
            $("#login").addClass("secondary");
        });
      }
    }, function(error) {
      console.log("Error init user : "+error);
    });
}

function doWithFavorites(fun, forceLogin){
    var currentUser = firebase.auth().currentUser;

    if(currentUser){
        var userId = currentUser.uid;

        var favoriteSongs = firebase.database().ref('users/' + userId + '/favorite');
        favoriteSongs.once('value', function(favList) {            
            fun(favList.val(), userId);
        });
    } else {
        console.log("Is not logged !");
        if(forceLogin){
            window.location='login.html';
        }
    }
}

//Display favorites on main page
function displayFavorites(){
    doWithFavorites(function(favorites, userId){
        if(favorites){
            var query = "[[:d = any(document.id, "+ JSON.stringify(favorites) + ")]]";
            displaySongsList(query);
        } else {
            $("#listSongs").html('<div class="column">No favorites</di>');
        }
    }, true);
}

function checkIfFavorited(){
    var currentUser = firebase.auth().currentUser;

    if(currentUser){
        var userId = currentUser.uid;

        var favoriteSongs = firebase.database().ref('users/' + userId + '/favorite');
        favoriteSongs.once('value', function(favList) {            
            updateFavoriteButton(favList.val());
        });
    }
}

function updateFavoriteButton(favorites){
    var songId = Helpers.queryString['id'];

    if(_.includes(favorites, songId)) {
        console.log("is a fav");
        $("#favory").removeClass("warning").addClass("secondary");
        $("#favory").html('<i class="fa fa-star-o" aria-hidden="true"></i> Remove favorite');
    } else {
        console.log("is not a fav");
        $("#favory").removeClass("secondary").addClass("warning");
        $("#favory").html('<i class="fa fa-star" aria-hidden="true"></i> Add to favorite');
    }
}

function addOrDeleteFavorite(){

    doWithFavorites(function(favorites, userId){
        var songId = Helpers.queryString['id'];

        //Add favorite
        if(!_.includes(favorites, songId)) {            
            if(favorites) {
                favorites.push(songId);
            } else {
                favorites = [songId];
            }
        //Remove favorite
        } else {
            favorites= _.without(favorites, songId);
        }

        firebase.database().ref('users/' + userId).set({
            favorite: favorites
        });

        updateFavoriteButton(favorites);
    }, true);
}

function convertStrumToArrow(strum){
    return strum.replace(new RegExp("--", 'g'), "- -")
        .replace(new RegExp(" ", 'g'), "&nbsp;")
        
        .replace(new RegExp("\\(U\\)", 'g'), upArrowIconRed)
        .replace(new RegExp("\\(D\\)", 'g'), downArrowIconRed)
        .replace(new RegExp("U", 'g'), upArrowIcon)
        .replace(new RegExp("D", 'g'), downArrowIcon)
        .replace(new RegExp("X", 'g'), chuckIcon)
        .replace(new RegExp("O", 'g'), closeHandIcon);
}

function pageScroll() {
    window.scrollBy(0,1); // horizontal and vertical scroll increments
    scrolldelay = setTimeout('pageScroll()',125); // scrolls every 100 milliseconds
}
