(function($){

    'use strict';

    var host = (window.location.port === '9000') ? 'http://localhost/RS-Test/server/' : '../server/';
    //var host = 'http://localhost/RS-Test/server/';

    var $list = $('#recs-list'),
        $docViewer = $('#doc-viewer'),
        $btnNext = $('#btn-next');

    var documents = window.documents,
        recs = window.recs,
        topics = Object.keys(recs);
        //tasks = Object.keys(recs[topics[0]]),
        //recommenders = Object.keys(recs[topics[0]][tasks[0]].recs);

    var shuffle = function(original) {
        var o = original.slice();
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
        return o;
    };
    var rs = window.sessionStorage.getItem('rs') || 'TU';
    var userId = window.sessionStorage.getItem('user-id') || 'no-user';
    //console.log('rs = ' + rs + '; user id = ' + userId);
    var conds = [], curCond = 0;
    var ratings = [], curRatings ={}, user = {}, timer;
    var session  = [], curSession = {};
    var msg = {
        'T1 WW': {
            pretty: 'Women in Workforce',
            tasks: [
                "Participation of women in the workforce",
                "Gender wage gap",
                "Women in the workforce earning wages or a salary are part of a modern phenomenon, one that developed at the same time as the growth of paid employment for men; yet women have been challenged by inequality in the workforce."
            ]
        },
        'T2 Ro': {
            pretty: 'Robots',
            tasks: [
                "Autonomous robots",
                "Human-robot interaction",
                "The branch of technology that deals with the design, construction, operation, and application of robots, as well as computer systems for their control, sensory feedback, and information processing is robotics"
            ]
        },
        'T3 AR': {
            pretty: 'Augmented Reality',
            tasks: [
                "Virtual environments",
                "Context-based object recognition",
                "Augmented reality (AR) is a live direct or indirect view of a physical, real-world environment whose elements are augmented (or supplemented) by computer-generated sensory input such as sound, video, graphics or GPS data"
            ]
        },
        'T4 CE': {
            pretty: 'Circular Economy',
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
                    curRatings[rec.doc] = { user: userId, 'task-num': (condNum+1),  doc: rec.doc, pos: (i+1), rating: numStars, tmsp: ($.now()-timer) };
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

        curSession['user-id'] = userId;
        curSession['task-num'] = condNum+1;
        curSession = $.extend(true, {}, cond);
        curSession.start = timer;
        curSession['start-pretty'] = (new Date(curSession.start)).toString();        
    };


    var getTimestamp = function(date){
        date = date || new Date();
        var year = date.getFullYear(),
            month = (date.getMonth() + 1) < 10 ? '0'+(date.getMonth() + 1) : (date.getMonth() + 1),
            day = date.getDate() < 10 ? '0'+date.getDate() : date.getDate(),
            hour= date.getHours() < 10 ? '0'+date.getHours() : date.getHours(),
            minutes = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes(),
            seconds = date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds();
        return (year+'-'+month+'-'+day+'_'+hour+'.'+minutes+'.'+seconds);
    };

    var getCsv = function(arr) {
        var keys = Object.keys(arr[0]),
            csv = keys.join(',') + '\n';
        for(var i=0; i<arr.length; ++i) {
            var values = [];
            for(var k=0, len=keys.length; k<len; ++k) {
                values.push(arr[i][keys[k]]);
            }
            csv += (values.join(',') + '\n');
        }
        return csv;
    };


    var submitRatings = function(){
        window.onbeforeunload = null;
        // show dark backgorund and spinner
        var $bg = $('<div/>', { class: 'dark-background' }).appendTo($('body')).click(function(evt){ evt.stopPropagation(); });
        $('<span/>', { class: 'loading fa fa-circle-o-notch' }).appendTo($bg);

        // Summarize session
        var sessionSummary = [{
            'user-id': userId,
            start: session[0].start,
            'start-pretty': session[0]['start-pretty'],
            end: session[session.length-1].end,
            'end-pretty': session[session.length-1]['end-pretty'],
            'time-lapse': session.map(function(s){ return s['time-lapse'] }).reduce(function(t1, t2){ return t1+t2 }),
            'tot-timeout': session.map(function(s){ return s['tot-timeout'] }).reduce(function(t1, t2){ return t1+t2 }),
            'time-lapse-wbreaks': session.map(function(s){ return s['time-lapse-wbreaks'] }).reduce(function(t1, t2){ return t1+t2 }),
            'tot-breaks': session.map(function(s){ return s['tot-breaks']  }).reduce(function(b1, b2){ return b1+b2 })
        }];

        var filenameSfx = getTimestamp() + '_' + rs + '_' + userId + '.csv';

        // Submit ratings and redirect to 'finished' page
        $.ajax({ method: 'POST', url: host + 'save.php', data: { filename: filenameSfx , ratings: getCsv(ratings), session: getCsv(session), session_summary: getCsv(sessionSummary) }
        }).done(function(response){
            console.log(response);
            window.location.href = 'finished.html';
        }).fail(function(jqXHR){
            console.log('post failed');
            console.log(jqXHR);
            if(confirm('Session data could not be saved. Please download and send to cdisciascio@know-center.at')) {
                $.generateFile({ filename: filename, content: ratingsData, script: host+'download.php' });
                setTimeout(function(){
                    window.location.href = 'finished.html';
                }, 500);
            }
        });
    };

    var addCurrentRatings = function(){

        // add curRatings to ratings array
        var docIDs = Object.keys(curRatings);
        for(var i=0, len=docIDs.length; i<len; ++i ) {
            ratings.push($.extend(true, {}, conds[curCond], curRatings[docIDs[i]] ));
        }
        curRatings = {};
        // Set end and time lapse of curSession and save to session array
        curSession.end = $.now();
        curSession['end-pretty'] = (new Date(curSession.end)).toString();
        curSession['time-lapse'] = parseFloat(curSession.end - curSession.start);
        curSession['tot-timeout'] = (curSession.breaks) ? curSession.breaks.map(function(b){ return b.timeout }).reduce(function(t1, t2){ return t1 + t2 }, 0.0) : 0.0;
        curSession['time-lapse-wbreaks'] = curSession.breaks ? parseFloat(curSession['time-lapse'] - curSession['tot-timeout']) : curSession['time-lapse'];
        curSession['tot-breaks'] = curSession.breaks ? curSession.breaks.length : 0
        delete curSession.breaks;
        session.push(curSession);
        curSession = {};

        if(++curCond < conds.length)
            loadRecs(curCond);
        else
            submitRatings();
    }


    $btnNext.click(function(evt){
        evt.stopPropagation();
        if(Object.keys(curRatings).length < 5)
            return alert('Some documents are not rated yet!');
        addCurrentRatings();
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
    window.onbeforeunload = function(){
        return 'Session not finished!';
    };


    // Set the name of the hidden property and the change event for visibility
    var hidden, visibilityChange; 
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
      hidden = "mozHidden";
      visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }

    var handleVisibilityChange = function() {
      if (document[hidden]) {
        if(!curSession.breaks) curSession.breaks = [];
        curSession.breaks.push({ 'tmsp-out': $.now() });
      } else {
        var index = curSession.breaks.length-1;
        curSession.breaks[index]['tmsp-back'] = $.now() ;
        curSession.breaks[index].timeout = parseFloat(curSession.breaks[index]['tmsp-back'] - curSession.breaks[index]['tmsp-out']);
      }
    }

    // Handle page visibility change   
  document.addEventListener(visibilityChange, handleVisibilityChange, false);



})(jQuery);
