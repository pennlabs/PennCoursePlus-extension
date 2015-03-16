var baseURL = "https://penncourseplus.com";
var PCR_AUTH_TOKEN = 'qL_UuCVxRBUmjWbkCdI554grLjRMPY';


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

function formatTime(time) {
    var temp_time = time.replace('-', ':');
    var temp_time_split = temp_time.split(':');
    if (temp_time_split.length == 1) {
        temp_time += ":00";
    } else {
        temp_time += "0";
    }
    return temp_time
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
        $('#schedule tbody').append(tr);
        $(tr).append(timeBlock);
        for (var day in days) {
            var td2 = document.createElement('td');
            $(tr).append(td2);
            $(td2).css('background-color', '#ffffff');
            $(td2).addClass(days[day]);
        }
    }
    delete data.minTime;
    delete data.maxTime;
    for (var c in data) {
        for (var meeting in data[c].meetings) {
            for (var time = data[c].startTime; time < data[c].endTime; time += 0.5) {
                var y = convertToTime(time);
                // color the corresponding label in the table
                $('#' + c + 'label').parent().css('background-color', data[c].color);

                var $block = $('#' + y + ' .' + data[c].meetings[meeting]);
                var newBlock = document.createElement('td');
                newBlock.style.backgroundColor = data[c].color;
                newBlock.id = c;
                if (time == data[c].startTime) {
                    newBlock.innerHTML = "<span>" + c + "</span>";
                }
                newBlock.style.height = $block.height();
                $block.append(newBlock);
                var numChildren = $block.children().length;
                var newWidth = 150 / numChildren;

                var day_of_week = data[c].meetings[meeting];
                //for each child
                $block.children().each(function(collidingNode) {
                    var id = $(this).attr('id');
                    //update the widths of all of its class blocks
                    $('.' + day_of_week + " #" + id).each(function(classNode) {
                        var indexInParent = $(this).parent().children().index(this);

                        if (collidingNode > indexInParent) {
                            var newBlock = document.createElement('td');
                            //set spacer block to have the correct width
                            newBlock.style.width = newWidth;
                            $(this).before(newBlock);
                        }
                        //update the widths of all siblins
                        $(this).siblings().each(function(sibling) {
                            $(this).css('width', newWidth);
                        })
                        $(this).css('width', newWidth);
                    })
                });
            }

        }
    }

    $('.time').each(function(timeBlock) {
        $(this).html("<span>" + formatTime($(this).html()) + "</span>");
    })
}

function render(classes) {
    var info = {};
    $('.container tbody').empty();
    $('#panel td').css('background-color', '#fff');
    var promises = classes.map(function(id) {
        return $.ajax({
            url: baseURL + '/scheduler',
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
        var times = processTimes(info);
        generateGraph(times);
    });
}

function generateInfo(classes) {
    var ratings = {};
    var promises = classes.map(function(id) {
        var cl = id;
        courseId = id.trim();
        courseId = courseId.slice(0, -4).replace(/\s/g, '');
        var dept = courseId.split('-')[0];
        var history;
        var url = baseURL + '/pcr/coursehistories/' + courseId + '/?token=public';
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(data) {
                history = data;
            }
        }).done(function(data) {
            $.ajax({
                type: 'GET',
                url: baseURL + '/pcr' + history.result.reviews.path + '?token=' + PCR_AUTH_TOKEN,
                dataType: 'json',
                success: function(data) {
                    var difficulty = 0;
                    var quality = 0;
                    var i = 0;
                    for (section in data.result.values) {
                        difficulty += parseFloat(data.result.values[section].ratings.rDifficulty) || 0;
                        quality += parseFloat(data.result.values[section].ratings.rCourseQuality) || 0;
                        i++;
                    }
                    difficulty = difficulty / i;
                    quality = quality / i;
                    if (!Number.isNaN(difficulty) && difficulty > 0) {
                        $('#' + cl + 'label').parent().parent().append('<td>' + difficulty.toFixed(2) + '</td>')
                    }
                    if (!Number.isNaN(quality) && quality > 0) {
                        $('#' + cl + 'label').parent().parent().append('<td>' + quality.toFixed(2) + '</td>')
                    }
                }
            });
        });
    });
}


$(function() {
    var classes;
    if (document.location.hostname == 'localhost') {
        classes = ["CIS-120-001", "CIS-520-001", "CIS-380-001", "CIS-555-401"];
    } else {
        var bg = chrome.extension.getBackgroundPage();
        var classes = bg.classes;
        for (var i in classes) {
            //randomly generate new hexcodes!
            var hex;
            do {
                hex = '#' + Math.floor(Math.random() * 16777215).toString(16)
                    //make sure you don't have white, black, or repeat colors
                console.log(hex);
            } while (hex == "#000000" || hex == "#ffffff" || palette.indexOf(hex) > 0)

            palette.push(hex);
        }
    }
    for (var i in classes) {
        var cl = classes[i]
        if (i < 2) {
            $('#panel tbody').append('<tr><td><input type="checkbox" checked="true" name="' + cl + '" id="' + cl + 'label">' + '<label for="' + cl + 'label"><span>' + cl + '</span></label>' + '</td></tr>');
        } else {
            $('#panel tbody').append('<tr><td><input type="checkbox" name="' + cl + '" id="' + cl + 'label">' + '<label for="' + cl + 'label"><span>' + cl + '</span></label>' + '</td></tr>');

        }
    }
    if (classes.length > 2) {
        render(classes.slice(0, 2));
    } else {
        render(classes);
    }
    generateInfo(classes);

    $('#rerender').click(function() {
        classes = [];
        $(':checked').each(function() {
            classes.push($(this).attr('name'));
        })
        render(classes);
    });

});
