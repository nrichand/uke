function displaySongFromTab(){

    var tabId = getURLParameter("tabId");
    var url = "https://ukulele-agiletribu.rhcloud.com/tab?tabid="+tabId;

    $.get( url, function( doc ) {
        doc.tablature = doc.infos.song.replace(/ /g, "&nbsp;")
                .replace(new RegExp("\\\r", 'g'), "<br />")
                .replace(new RegExp("\\\n", 'g'), "<br />")
                .replace(new RegExp("\\(U\\)", 'g'), upArrowIcon)
                .replace(new RegExp("\\(D\\)", 'g'), downArrowIcon);


        doc.chords_img_url = []
        var prismic_chords = doc.infos.chords;
        prismic_chords.forEach(function(elem){
            if(all_chords[elem]){
                var chord_first_alternative = all_chords[elem][0];
                var chord_img_url = chord_first_alternative.chord_diag_mini;
                var chord_url = chord_first_alternative.chord_url;
                var newChord = { "diag_mini" : chord_img_url, "chord_url" : chord_url}
                doc.chords_img_url.push(newChord);
            } else {
                console.log("Missing chord : "+elem);
            }
        });

        var bread = $("#breadcrumb-template").html();
        var bread_template = Handlebars.compile(bread);            
        $("#bread").html(bread_template(doc));

        var song = $("#song-template").html();
        var song_template = Handlebars.compile(song);
        $("#ukeSong").html(song_template(doc));

        document.title = doc.infos.title + " - Ukulele tutorial";
    });
}