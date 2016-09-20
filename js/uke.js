var songs;

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
            document.title = "Ukulele song - " + doc.data['uke-song.artist'].value;

            doc.tablature = doc.getStructuredText('uke-song.tabs').asHtml(ctx.linkResolver);
            doc.tablature = doc.tablature.replace(/ /g, "&nbsp;");

            var song = $("#song-template").html();
            var song_template = Handlebars.compile(song);
            $("#ukeSong").html(song_template(doc))

            var bread = $("#breadcrumb-template").html();
            var bread_template = Handlebars.compile(bread);            
            $("#bread").html(bread_template(doc))         
        });

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

function doWithFavorites(fun){
    var currentUser = firebase.auth().currentUser;

    console.log(currentUser);

    if(currentUser){
        var userId = currentUser.uid;

        var favoriteSongs = firebase.database().ref('users/' + userId + '/favorite');
        favoriteSongs.on('value', function(favList) {            
            fun(favList.val(), userId);
        });
    } else {
        window.location='login.html';
    }
}

function displayFavorites(){
    doWithFavorites(function(favorites, userId){
        if(favorites){
            var query = "[[:d = any(document.id, "+ JSON.stringify(favorites) + ")]]";
            displaySongsList(query);
        }
    });
}

function checkIfFavorited(){
    doWithFavorites(function(favorites, userId){
        var songId = Helpers.queryString['id'];

        if(_.includes(favorites, songId)) {
            $("#favory").removeClass("warning").addClass("secondary");
            $("#favory").html('<i class="fa fa-star-o" aria-hidden="true"></i> Remove favorite');
        } else {
            console.log("is not a favory");
        }
    });
}

function addFavorite(){
    doWithFavorites(function(favorites, userId){
        var songId = Helpers.queryString['id'];

        if(!_.includes(favorites, songId)) {            
            if(favorites) {
                favorites.push(songId);
            } else {
                favorites = [songId];
            }
            
            firebase.database().ref('users/' + userId).set({
                favorite: favorites
            });

            checkIfFavorited();
        } 
    });
}
