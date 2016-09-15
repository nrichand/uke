function displaySongsList(){
	Helpers.withPrismic(function(ctx) {
        ctx.api.form("everything").set('page', parseInt(window.location.hash.substring(1)) || 1 ).ref(ctx.ref).submit(function(err, docs) {
            if (err) { Configuration.onPrismicError(err); return; }
            // Feed the templates
            console.log(docs.results);

            var songs = $("#song-template").html();
            var song_template = Handlebars.compile(songs);

            $("#listSongs").html(song_template(docs.results))
        });
    });
}
