(function($){

    'use strict';

    //            var host = '../server/';
    var host = 'http://localhost/RS-Test/server/';

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
    var rs = window.sessionStorage.getItem('rs') || 'TU';
    var userId = window.sessionStorage.getItem('user-id') || 'no-user';
    console.log('rs = ' + rs + '; user id = ' + userId);
    var conds = [], curCond = 0;
    var session = [], curRatings ={}, user = {}, timer;
    var msg = {
        'T1 WW': {
            pretty: 'women in workforce',
            tasks: [
                "Participation of women in the workforce",
                "Gender wage gap",
                "Women in the workforce earning wages or a salary are part of a modern phenomenon, one that developed at the same time as the growth of paid employment for men; yet women have been challenged by inequality in the workforce."
            ]
        },
        'T2 Robots': {
            pretty: 'robot',
            tasks: [
                "Autonomous robots",
                "Human-robot interaction",
                "The branch of technology that deals with the design, construction, operation, and application of robots, as well as computer systems for their control, sensory feedback, and information processing is robotics"
            ]
        },
        'T3 AR': {
            pretty: 'augmented reality',
            tasks: [
                "Virtual environments",
                "Context-based object recognition",
                "Augmented reality (AR) is a live direct or indirect view of a physical, real-world environment whose elements are augmented (or supplemented) by computer-generated sensory input such as sound, video, graphics or GPS data"
            ]
        },
        'T4 CE': {
            pretty: 'circular economy',
            tasks: [
                "Waste management",
                "Industrial Symbiosis in China",
                "A circular economy naturally encompasses a shift from fossil fuels to the use of renewable energy, the eradication of waste and the role of diversity as a characteristic of resilient and productive systems"
           ]
        }
    };


    var shuffleConditions = function(){

        var taskConds = ['focus','broad'],
            explConds = [false, true],
            conds = [];

        shuffle(topics).forEach(function(topic, i){
            taskConds.forEach(function(taskType, j){
                var k = (i%2) ? j: 1-j, wExpl = explConds[k];
                conds.push({ rs: rs, topic: topic, task: taskType, wExpl: wExpl });
            });
        });
        return shuffle(conds);
    }

    var getExplanation = function(rec, cond) {
        var getExplanationFor = {
            TU: function() {
                var str = 'Bookmarked by <strong>' + rec.misc.users + '</strong> users with similar interests<br><br>Tagged: <br>';
                var tags = rec.misc.tags;
                Object.keys(tags).forEach(function(tag){
                    str +=  '<strong>' + tags[tag].tagged + '</strong> times with <strong>' +  tags[tag].term + '</strong><br>';
                });
                return str;
            },
            U: function() {
                return 'Bookmarked by <strong>' + rec.misc.users + '</strong> users with similar interests<br>';
            },
            T: function() {
                var str = 'Tagged: <br>';
                var tags = rec.misc.tags;
                Object.keys(tags).forEach(function(tag){
                    str +=  '<strong>' + tags[tag].tagged + '</strong> times with <strong>' +  tags[tag].term + '</strong><br>';
                });
                return str;
            },
            MP: function() {
                return 'Bookmarked <strong>' + rec.misc.times + '</strong> times for topic <strong>' +  msg[cond.topic].pretty + '</strong>';
            },
            CB: function() {
                var str = 'Terms in this document:<br>';
                var keywords = rec.misc.keywords;
                Object.keys(keywords).forEach(function(kw){
                    var freq = (keywords[kw]>=0.3 ) ? 'high' : (keywords[kw] >= 0.1 ? 'moderate' : 'low');
                    str += '<strong>' + kw + '</strong> (<strong>' + freq + '</strong> frequency)<br>';
                });
                return str;
            }
        }
       return getExplanationFor[cond.rs]();
    }


    var loadRecs = function(condNum){
        var cond = conds[condNum],
            rs = cond.rs,
            topic = cond.topic,
            task = cond.task == 'focus' ? 2 : 3,
            wExpl = cond.wExpl;
        var list = recs[topic][task].recs[rs];
        console.log(cond);
        $list.empty();
        $docViewer.find('.panel-body').empty();
        $('#p-topic').html(msg[topic].pretty);
        $('#p-query').html(msg[topic].tasks[task-1]);
        $('#task-progress').html('Task ' + (condNum+1) + '/' + conds.length);

        list.forEach(function(rec, i){

            var doc = documents[rec.doc];
            var $row = $('<li/>', { doc: rec.doc}).appendTo($list);
            var $secTitle = $('<div/>', { class: 'section-title' }).appendTo($row);
            var $title = $('<a/>', { href: '#', class: 'title' }).appendTo($secTitle);
            $('<h5/>', { html: doc.title }).appendTo($title);
            $('<i/>', { class: 'expl-icon fa fa-eye' }).appendTo($title);
            if(wExpl) {
                $secTitle.addClass('has-explanation');
                var htmlTooltip = getExplanation(rec, cond);
                var $tooltip = $('<div/>', { class: 'expl-tooltip', html: htmlTooltip }).appendTo($secTitle);
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
                $('.title').removeClass('selected');
                $(this).addClass('selected');
                var html = '<h6>' + doc.title + '</h6><br><p>' + doc.description + '</p>';
                $docViewer.find('.panel-body').html(html);
            });

            $relSection.click(function(evt){ evt.stopPropagation(); });
        });

        timer = $.now();
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
//            console.log(curRatings);
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
//            console.log(getCsv(session));

            var $bg = $('<div/>', { class: 'dark-background' }).appendTo($('body'));
            $('<span/>', { class: 'loading fa fa-circle-o-notch' }).appendTo($bg);

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

    $('.fa-trash').click(function(evt){
        evt.stopPropagation();
        $('.title').removeClass('selected');
        $docViewer.find('.panel-body').empty();
    })

    ///// Init
    conds = shuffleConditions();
    loadRecs(curCond);

    /*$.get('http://ipinfo.io', function(response) {
        user.ip = response.ip;
        user.country = response.country;
        user.tmsp = (new Date()).toDateString() + ' - ' + (new Date()).toTimeString();
        conds = shuffleConditions();
        loadRecs(curCond);
    }, 'jsonp');
    */

    /****************************************
     *  UNCOMMENT FOR NORMAL WORKFLOW
     ****************************************/
    /*window.onbeforeunload = function(){
        return 'The session is not finished';
    }*/

})(jQuery);
