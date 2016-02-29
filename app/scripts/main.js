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
    var msg = {
        'women in workforce': [
            "Participation of women in the workforce",
            "Gender wage gap",
            "Women in the workforce earning wages or a salary are part of a modern phenomenon, one that developed at the same time as the growth of paid employment for men; yet women have been challenged by inequality in the workforce."
        ],
        'robot': [
            "Autonomous robots",
            "Human-robot interaction",
            "The branch of technology that deals with the design, construction, operation, and application of robots, as well as computer systems for their control, sensory feedback, and information processing is robotics"
        ],
        'augmented reality': [
            "Virtual environments",
            "Context-based object recognition",
            "Augmented reality (AR) is a live direct or indirect view of a physical, real-world environment whose elements are augmented (or supplemented) by computer-generated sensory input such as sound, video, graphics or GPS data"
        ],
        'circular economy': [
            "Waste management",
            "Industrial Symbiosis in China",
            "A circular economy naturally encompasses a shift from fossil fuels to the use of renewable energy, the eradication of waste and the role of diversity as a characteristic of resilient and productive systems"
        ]
    };


    var loadRecs = function(condNum){
        var cond = conds[condNum],
            list = recs[cond.topic][cond.task].recs[cond.rs];
        $list.empty();
        $docViewer.find('.panel-body').empty();
        $('#p-topic').html(cond.topic);
        $('#p-query').html(msg[cond.topic][cond.task-1]);
        $('#task-progress').html('Task ' + (condNum+1) + '/' + conds.length);

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

        for(var i=0; i<arr.length; ++i) {
            var values = [];
            //console.log(arr[i]);
            for(var k=0; k< keys.length;++k) {
                values.push(arr[i][keys[k]]);
            }
            csv += (values.join(',') + '\n');
        }
        return csv;
    };



    $btnNext.click(function(evt){
        evt.stopPropagation();
        if(++curCond < conds.length) {
            console.log(curRatings);
            if(Object.keys(curRatings).length < 5)
                return alert('Some documents are not rated yet!');

            var docIDs = Object.keys(curRatings);
            for(var i=0; i<docIDs.length; ++i ) {
                session.push($.extend(true, {
                    doc: docIDs[i],
                    pos: curRatings[docIDs[i]].pos,
                    rating: curRatings[docIDs[i]].rating
                }, conds[curCond-1], user ));
            }
            curRatings = {};
            loadRecs(curCond);
        }
        else {
//            var host = '../server/';
            var host = 'http://localhost/RS-Test/server/';
//            console.log(getCsv(session));
            $.ajax({
                method: 'POST',
                url: host + 'save.php',
                data: { content: getCsv(session) }
            }).done(function(response){
                console.log(response);
                window.location.href = 'finished.html';
            }).fail(function(jqXHR){
                console.log('post failed');
                console.log(jqXHR);
                if(confirm('Session data could not be saved. Please download and send to cdisciascio@know-center.at')) {
                    var date = new Date(),
                        timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth()) + 1) + '-' + date.getDate() + '_' + date.getHours() + '.' + date.getMinutes() + '.' + date.getSeconds();
                    $.generateFile({ filename: 'session_' + timestamp + '.csv', content: getCsv(session), script: host+'download.php' });
                }
            });
        }

    });

    ///// Init
    $.get('http://ipinfo.io', function(response) {
        user.ip = response.ip;
        user.country = response.country;
        user.tmsp = (new Date()).toDateString() + ' - ' + (new Date()).toTimeString();

        topics = shuffle(topics).slice(0, topics.length-1);
        recommenders.forEach(function(rs, i){
            [true, false].forEach(function(wExpl){
                [2, 3].forEach(function(task){
                    conds.push({ topic: topics[i], rs: rs, task: task, wExpl: wExpl });
                });
            });
        });
        conds = shuffle(conds);
        loadRecs(curCond);
    }, 'jsonp');

})(jQuery);
