function displaySongsList(){
	Helpers.withPrismic(function(ctx) {
        ctx.api.form("everything").set('page', parseInt(window.location.hash.substring(1)) || 1 ).ref(ctx.ref).submit(function(err, docs) {
            if (err) { Configuration.onPrismicError(err); return; }
            // Feed the templates
            console.log(docs.results);

            var songs = $("#list-song-template").html();
            var song_template = Handlebars.compile(songs);

            $("#listSongs").html(song_template(docs.results))
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

            console.log(doc);
            document.title = "Ukulele song - " + doc.data['uke-song.artist'].value;

            var song = $("#song-template").html();
            var song_template = Handlebars.compile(song);            
            $("#ukeSong").html(song_template(doc))


            var bread = $("#breadcrumb-template").html();
            var bread_template = Handlebars.compile(bread);            
            $("#bread").html(bread_template(doc))
            
            var img = $("#img-template").html();
            var img_template = Handlebars.compile(img);            
            $("#tabModal").html(img_template(doc))
            

            

            //TODO : a checker 
            //console.log(img(src=pageContent.getImage(doc['data.[uke-song.tab].value.main.url']).url));
        });

    });
}