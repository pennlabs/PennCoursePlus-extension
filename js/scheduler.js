function processTimes(data) {
    var minTime = 24;
    var maxTime = 0;
    var ret = {};
    var i = 0;
    for (var section in data) {
        var startTime = data[section][0].start_time_24;
        var endTime = data[section][0].end_time_24;
        if (startTime % 1 !== 0) {
            startTime += 0.2;
        }
        if (endTime % 1 !== 0) {
            endTime += 0.2;
        }
        minTime = startTime < minTime ? startTime : minTime;
        maxTime = endTime > maxTime ? endTime : maxTime;
        ret[section] = {
            'startTime': startTime,
            'endTime': endTime,
            'meetings': data[section][0].meeting_days.split(''), 
            'color': palette[i]
        };
        i++;
    }
    ret.minTime = minTime;
    ret.maxTime = maxTime;
    return ret;
}

function convertToTime(time) {
    if (time % 1 !== 0) {
        time -= 0.2;
    }
    return time.toString().replace('.', '-');
}

var days = ['M', 'T', 'W', 'R', 'F'];

/*
*@param data 
format: {minTime
         maxTime
         class: {startTime, endTime}
        }
*/
var palette = ['#FCA93E', '#C23CFF', '#6453FF', '#63D8BD', '#D84568'];
function generateGraph(data) {
    console.log(data);
    for (var date = data.minTime; date <= data.maxTime; date += 0.5) {
        var tr = document.createElement('tr');
        var timeBlock = document.createElement('td');
        timeBlock.className = 'time';
        var x = convertToTime(date);
        tr.id = x;
        timeBlock.innerHTML = x;
        $('tbody').append(tr);
        $(tr).append(timeBlock);
        for (var day in days) {
            var td2 = document.createElement('td');
            $(tr).append(td2);
            $(td2).css('background-color', '#fff');
            $(td2).addClass(days[day]);
        }
    }

    delete data.minTime;
    delete data.maxTime;
    for (var c in data) {
        for (var meeting in data[c].meetings) {
            for (var time = data[c].startTime; time < data[c].endTime; time+=0.5 ) {
                var y = convertToTime(time);
                var $block = $('#' + y + ' .' + data[c].meetings[meeting]);
                $block.css('background-color', data[c].color);
                if (time == data[c].startTime) {
                  $block.html(c);
                }
            }

        }
    }
}

$(function() {
    var classes;
    if (document.location.hostname == 'localhost') {
        classes = ["CIS-262-001", "CIS-380-001", "STAT-430-002", "CIS-542-001"];
    } else {
        classes = [];
    }
    var info = {};
    for (var i in classes) {
        $('#checkboxes').append('<input type="checkbox" name=' + classes[i] + '>' + classes[i] + '<br>');
    }
    var promises = classes.map(function(id) {
        // debugger
        return $.ajax({
            url: 'http://localhost:8080/scheduler',
            type: 'GET',
            dataType: 'json',
            async: false,
            data: {
                'class': id
            }
        }).done(function(data) {
            info[id] = data;
        });
    });
    RSVP.all(promises).then(function(posts) {
        console.log(info);
        var times = processTimes(info);
        generateGraph(times);
    });
});
