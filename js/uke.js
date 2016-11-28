var songs;

var downArrowIcon = '<i class="fa fa-long-arrow-down" aria-hidden="true"></i>';
var downArrowIconRed = '<i style="color: crimson;" class="fa fa-long-arrow-down" aria-hidden="true"></i>';

var upArrowIcon = '<i class="fa fa-long-arrow-up" aria-hidden="true"></i>';
var upArrowIconRed = '<i style="color: crimson;" class="fa fa-long-arrow-up" aria-hidden="true"></i>';

var minusIcon = '<i class="fa fa-minus" aria-hidden="true"></i>';
var chuckIcon = '<i class="fa fa-hand-paper-o" aria-hidden="true"></i>';
var closeHandIcon = '<i class="fa fa-hand-rock-o" aria-hidden="true"></i>';

function displaySongsList(query, orderCriteria){
	Helpers.withPrismic(function(ctx) {
		var request = ctx.api.form("everything").ref(ctx.ref);

		if(query){
        	request.query(query);
        }

        request.set('page', parseInt(window.location.hash.substring(1)) || 1 )
            .orderings('[' + orderCriteria + ']')
            .pageSize(100)
        	.submit(function(err, docs) {
            if (err) { Configuration.onPrismicError(err); return; }

            if(! songs){
            	songs = $("#list-song-template").html();          
            }
            var song_template = Handlebars.compile(songs);

            $("#listSongs").html(song_template(docs.results))

            injectMicroDataList(docs.results);

            checkIfFavorited(updateFavoriteButtonForList);
            addAnimationsOnList();
        });
    });
}

function injectMicroDataList(listing){
    var microDataResult = [];
    var index = 1;

    listing.forEach(function(song){
        var microDataItem = {
            "@type": "ListItem",
            "position": index,
            "item": {
                "@type": "MusicRecording",
                "name": song.data['uke-song.name'].value,
                "url": "http://www.doyoukulele.com/song.html?id=" + song.id + "&slug=" + song.slug,
                "byArtist": {
                  "@type": "MusicGroup",
                  "name": song.data['uke-song.artist'].value
                }
            }
        };

        microDataResult.push(microDataItem);
        index++;
    });

    $("#microdataId").text(function() {
    return JSON.stringify({
        "@context": "http://schema.org/",
        "@type": "ItemList",
        "name": "Ukulele songs to learn",
        "description": "The best songs to learn for ukulele beginner",
        "itemListElement": microDataResult
    });
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
            doc.chords_img_url = [];
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

            if(doc.data['uke-song.soundcloud_id'] == null){
                $("#soundcloud_iframe").html("Sorry, we are recording this song. Comeback later!");
            }

            var bread = $("#breadcrumb-template").html();
            var bread_template = Handlebars.compile(bread);            
            $("#bread").html(bread_template(doc));

            doc.strumming_alternatives = [];
            var strumming_alternatives = doc.data['uke-song.alternative_strum'].value;
            strumming_alternatives.forEach(function(elem){
                var strumming_alt = convertStrumToArrow(elem.label.value);
                doc.strumming_alternatives.push(strumming_alt);
            });

            var alternatives = $("#alternative-template").html();
            var alternative_template = Handlebars.compile(alternatives);            
            $("#alternatives").html(alternative_template(doc));            

            checkIfFavorited(updateFavoriteButtonForSong);       
        });
    });
}

function addAnimationsOnList(){
    $(".blockSong").click(function() {
        $(this).addClass("animated rubberBand");
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

function printDiv(divName) {
     var printContents = document.getElementById(divName).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;

     window.print();

     document.body.innerHTML = originalContents;
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

/*
 *
 * Handling scrolling
 *
 */
var scroller = (function() {
    var state = "inactive"; // Private Variable
    var speed = 1;
    var delay = 125;

    var pub = {};// public object - returned at end of module

    pub.toggle = function() {
        if(state == "active"){
            state = "inactive";
            $("#bs-play").removeClass("active");
        } else {
            state = "active";
            $("#bs-play").addClass("active");
            pageScroll();
        }
    };

    pub.plus = function() {
        if(delay > 25){
            delay = delay - 25;
            updateDisplay();
        }
    };

    pub.less = function() {
        if(delay < 225){
            delay = delay + 25;
            updateDisplay();
        }
    };

    pub.getState = function(){
        return state;
    }
    pub.getDelay = function() {
        return delay;
    }

    function updateDisplay() {
        delayToDisplay = (delay /25) - ((2 * delay / 25) -10);
        $("#scrollerSpeed").html(delayToDisplay );
    }

    return pub; // expose externally
}());

function pageScroll(){
    if(scroller.getState() == "active"){
        window.scrollBy(0, 1); // horizontal and vertical scroll increments in px
        scrolldelay = setTimeout('pageScroll()', scroller.getDelay()); // scrolls every 100 milliseconds
    }
}

/*
 *
 * Favorites
 *
 */
//Display favorites on main page
/*
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
*/

//Get all favorited then display fav icon
function checkIfFavorited(fun){
    var currentUser = firebase.auth().currentUser;

    if(currentUser){
        var userId = currentUser.uid;

        var favoriteSongs = firebase.database().ref('users/' + userId + '/favorite');
        favoriteSongs.once('value', function(favList) {            
            fun(favList.val());
        });
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

        updateFavoriteButtonForSong(favorites);
    }, true);
}

function updateFavoriteButtonForSong(favorites){
    var songId = Helpers.queryString['id'];

    if(_.includes(favorites, songId)) {
        $("#yourfavorite").addClass("active");
        $("#heartfavorite").html('Remove favorite');
    } else {
        $("#yourfavorite").removeClass("active");
        $("#heartfavorite").html('Add to favorite');
    }
}

function updateFavoriteButtonForList(favorites){
    for (fav of favorites){
        $("#fav-"+fav).addClass("active");
        $("#fav-mobile-"+fav).addClass("active");
    }
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

/*
 *
 * User
 *
 */
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
            $("#login").html('<i class="fa fa-sign-out" aria-hidden="true"></i> Logout');
        });
      }
    }, function(error) {
      console.log("Error init user : "+error);
    });
}

/*
 * 
 * Filters
 *
 */
function addFiltersHandler(){
    $("#chords_level").on('click', function() { reloadSongWithFilters(); });
    $("#strumming_level").on('click', function() { reloadSongWithFilters(); });
    $("#language").on('click', function() { reloadSongWithFilters(); });
    $("#genre").on('click', function() { reloadSongWithFilters(); });
    $("#orderBy").on('click', function() { reloadSongWithFilters(); });
}

function reloadSongWithFilters(){
    var query = "[";

    var selectedLevel = $('#chords_level input:radio:checked').val();
    if(selectedLevel){
        query += '[:d = at(my.uke-song.Chords_diff, "' + selectedLevel + '")]';        
    }

    var selectedStrumLevel = $('#strumming_level input:radio:checked').val();
    if(selectedStrumLevel){
        query += '[:d = at(my.uke-song.Strummming_diff, "' + selectedStrumLevel + '")]';        
    }

    var selectedLang = $('#language input:radio:checked').val();
    if(selectedLang){
        query += '[:d = at(my.uke-song.lang, "' + selectedLang + '")]';        
    }

    var selectedGenre = $('#genre input:radio:checked').val();
    if(selectedGenre){
        query += '[:d = at(my.uke-song.musical_style, "' + selectedGenre + '")]';        
    }

    query += "]"

    var selectedOrderCriteria = $('#orderBy input:radio:checked').val();

    displaySongsList(query, selectedOrderCriteria);
}
