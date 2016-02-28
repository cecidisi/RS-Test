(function($){

    'use strict';


    var $list = $('#recs-list'),
        $docViewer = $('#doc-viewer'),
        $btnNext = $('#btn-next');

    var documents = window.documents,
        recs = window.recs,
        topics = Object.keys(recs),
        tasks = Object.keys(recs[topics[0]]),
        recommenders = Object.keys(recs[topics[0]][tasks[0]].recs);

    var shuffle = function(original) {
        var o = original.slice();
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
        return o;
    };

    var conds = [], curCond = 0;
    var session = [], curRatings ={}, user = {};


    var loadRecs = function(cond){
        var list = recs[cond.topic][cond.task].recs[cond.rs];
        $list.empty();
        $docViewer.find('.panel-body').empty();

        list.forEach(function(rec, i){

            var doc = documents[rec.doc];
            var $row = $('<li/>', { doc: rec.doc}).appendTo($list);
            var $secTitle = $('<div/>', { class: 'section-title' }).appendTo($row);
            var $title = $('<a/>', { href: '#' }).appendTo($secTitle);
            $('<h5/>', { html: doc.title }).appendTo($title);
            if(cond.wExpl) {
                $('<p/>', { html: rec.expl }).appendTo($secTitle);
            }

            var $relSection = $('<div/>', { class: 'section-relevance' }).appendTo($row);
            for(var j=1; j<=5; ++j) {
                $('<span>/', { class: 'star star-off', stars: j }).appendTo($relSection).click(function(evt){
                    evt.stopPropagation();
                    // Turn on/off sibling stars
                    var numStars = parseInt($(this).attr('stars'));
                    $(this).removeClass('star-off').addClass('star-on');
                    $(this).siblings().each(function(s,star){
                        var $star = $(star);
                        if(parseInt($star.attr('stars')) <= numStars) {
                            $star.removeClass('star-off').addClass('star-on');
                        }
                        else {
                            $star.removeClass('star-on').addClass('star-off');
                        }
                    });
                    // set document rating
                    curRatings[rec.doc] = { pos: (i+1), rating: numStars };
                });
            }

            $title.click(function(evt){
                evt.stopPropagation();
                var html = '<h6>' + doc.title + '</h6><br><p>' + doc.description + '</p>';
                $docViewer.find('.panel-body').html(html);
            });

            $relSection.click(function(evt){ evt.stopPropagation(); });
        });

    };


    var getCsv = function(arr) {
        var keys = Object.keys(arr[0]),
            csv = keys.join(',') + '\n';

        arr.forEach(function(a){
            var values = [];
            keys.forEach(function(key){ values.push(a[key]); });
            csv += values.join(',') + '\n';
        });
        return csv;
    };



    $btnNext.click(function(evt){
        evt.stopPropagation();
        if(++curCond < conds.length) {
            console.log(curRatings);
//            if(Object.keys(curRatings).length < 5)
//                return alert('Some documents have not been rated!');

            Object.keys(curRatings).forEach(function(docId){
                var obj = $.extend(user, conds[curCond-1], {
                    doc: docId,
                    pos: curRatings[docId].pos,
                    rating: curRatings[docId].rating
                });
                session.push(obj);
            });

            var host = 'http://localhost/RS-Test2/server/';
            $.post(host + 'save.php', { data: getCsv(session), ext: 'csv'})
                .done(function(response){
                console.log(response);
                window.location.href = 'finished.html';
            }).fail(function(jqXHR){
                console.log('post failed');
                console.log(jqXHR);
                if(confirm('Session data could not be saved.<br>Please download and send to cdisciascio@know-center.at')) {
                    $.post(host + 'download.php', { filename: 'session.csv', content: getCsv(session) })
                     //.done(function(){ window.location.href = 'finished.html'; });
                }
            });

            curRatings = {};
            loadRecs(conds[curCond]);
        }
        else {
//            var host = '../server/';
            var host = 'http://localhost/RS-Test2/server/';
            $.post(host + 'save.php', { data: getCsv(session), ext: 'csv'})
            .done(function(response){
                console.log(response);
                window.location.href = 'finished.html';
            }).fail(function(jqXHR){
                console.log('post failed');
                console.log(jqXHR);
                if(confirm('Session data could not be saved.<br>Please download and send to cdisciascio@know-center.at')) {
                    $.post(host + 'download.php', { filename: 'session.csv', content: getCsv(session) })
                     .complete(function(){ window.location.href = 'finished.html'; });
                }
            });
        }

    });

    ///// Init
    $.get('http://ipinfo.io', function(response) {
        user.ip = response.ip;
        user.country = response.country;

        topics = shuffle(topics).slice(0, topics.length-1);
        recommenders.forEach(function(rs, i){
            [true, false].forEach(function(wExpl){
                [2, 3].forEach(function(task){
                    conds.push({ topic: topics[i], rs: rs, task: task, wExpl: wExpl });
                });
            });
        });
        conds = shuffle(conds);
        loadRecs(conds[curCond]);
    }, 'jsonp');

})(jQuery);
