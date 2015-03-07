/*
To implement
    1. Link to PCR site
    2. Remove links from default headers in table
    3. Fix styling
    4. Make it easy to find easy classes that fulfill requirements
    5. Quality to ease ratio
    6. Fix "NA" rating
    7. double countring for sectors and foundation
    8. Make PCR headings more clear
    9. don't check recitations
*/

var baseURL = "https://penncourseplus.com/pcr";
var PCR_AUTH_TOKEN = 'qL_UuCVxRBUmjWbkCdI554grLjRMPY';


//keep checking if state is ready
var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        if (document.title === 'Course Search & Mock Schedule') {
            var data = [];
            $('#courseCartBoxForm a span.fastButtonLinkText').each(function() {
                var text = $(this).html();
                if (text.indexOf('-') >= 0 && text.indexOf('Delete') == -1) {
                    data.push(text);
                }
            })
            var $button = $('<input type="button" value="classes" />');
            $button.appendTo($('body'));
            $button.on('click', function() {
                console.log('opening');
                chrome.runtime.sendMessage({
                    type: 'launch_scheduler',
                    data: data
                });
            });
        }


        var $courseCart = $('.studentRightRailTableData .fastButtonLinkText');
        var title = $(document).find("title").text(); //grabs title of current page
        var secondWord = title.split(' ')[1]; //grabs second word of the title

        if (secondWord == 'Search') { //checks if user is on the course search page
           // $('head').append('<link rel="stylesheet" href="' + chrome.extension.getURL("src/inject/theme.default.css") + '" type="text/css" />');

            //formats table so it can be sorted using TableSorter plugin
            $('.pitDarkDataTable tr:first').unwrap().wrap("<thead/>");
            $('thead').children().children().children().children().unwrap().wrap("<span/>");
            $('.pitDarkDataTable').children().unwrap().wrapAll("<table class='tablesorter pit'/>");
            $('.pit tr:nth-child(2)').nextUntil(".pit tr:last").andSelf().wrapAll("<tbody/>");


            //adds columns to table
            $(".pit thead tr").append('<th id="difficulty">Difficulty</th>');
            $(".pit thead tr").append('<th id="quality">Quality</th>');
            $(".pit thead tr").append('<th id="professor">Professor</th>');

           // $('head').append('<link rel="stylesheet" href="' + chrome.extension.getURL("src/inject/theme.default.css") + '" type="text/css" />');
           //document.styleSheets[0].insertRule('.tablesorter .tablesorter-header {padding: 4px 20px 4px 4px;}',0);


            $('#quality').tooltipster({
                content: "Average quality of course; higher is better."
            });
            $('#difficulty').tooltipster({
                content: "Difficulty of course; lower is better."
            });
            $('#professor').tooltipster({
                content: "Quality of Professor of course; higher is better."
            });

            //document.styleSheets[0].insertRule('.pit' + ' {display: inline !important}', 0);
               $('.pit').show();
            //fetches all courses in the course table
            var courseList = $('.pit tbody').children();
            $(courseList).each(function() {

                var that = this;
                var courseId = $(this).find('td:nth-child(1)').text();
                var courseType = $(this).find('td:nth-child(3)').text();
                var inst = $(this).find('td:nth-child(4)').text().toUpperCase().trim();
                var lastName = inst.split(" ").pop();
                var firstName = inst.split(" ")[0];

                courseId = courseId.trim();
                courseId = courseId.slice(0, -4).replace(/\s/g, '');
                $(that).append("<td class='diff'>" + " " + "</td>");
                $(that).append("<td class='qual'>" + " " + "</td>");
                $(that).append("<td class='prof'>" + " " + "</td>");


                if (courseType.trim() !== 'Recitation' && courseType.trim() !== 'Laboratory') {
                    var dept = courseId.split('-')[0];
                    var history;
                    var url = baseURL + '/coursehistories/' + courseId + '/?token=public';
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
                            url: baseURL + history.result.reviews.path + '?token=' + PCR_AUTH_TOKEN,
                            dataType: 'json',
                            success: function(data) {
                                var difficulty = 0;
                                var quality = 0;
                                var prof = 0;
                                var i = 0;
                                for (section in data.result.values) {
                                    difficulty += parseFloat(data.result.values[section].ratings.rDifficulty) || 0;
                                    quality += parseFloat(data.result.values[section].ratings.rCourseQuality) || 0;
                                    i++;
                                }
                                difficulty = difficulty / i;
                                quality = quality / i;
                                if (!Number.isNaN(difficulty) && difficulty > 0) {
                                    $(that).find('.diff').text(difficulty.toFixed(2));
                                }
                                if (!Number.isNaN(quality) && quality > 0) {
                                    $(that).find('.qual').text(quality.toFixed(2));
                                }
                            }
                        });
                    });

                    if (lastName.length > 0) {
                        $.getJSON(chrome.extension.getURL('src/inject/profHash.json'),
                            function(prof) {

                                var p = prof[lastName];
                                for (var person in p) {
                                    if ($.inArray(dept, p[person].depts) >= 0 && p[person].first_name.split(" ")[0] == firstName) {
                                        var url = baseURL + '/instructors/' + p[person]["id"] + '/reviews?token=' + PCR_AUTH_TOKEN;
                                        $.getJSON(url, function(profReviews) {
                                            var rProf = 0;
                                            var j = 0;
                                            for (section in profReviews.result.values) {
                                                rProf += parseFloat(profReviews.result.values[section].ratings.rInstructorQuality);
                                                j++;
                                            }
                                            rProf = rProf / j;
                                            if (!Number.isNaN(rProf) && rProf > 0) {
                                                $(that).find('.prof').text(rProf.toFixed(2));
                                            }
                                        });
                                    }
                                }
                            }
                        );
                    }
                }
            });

            $(document).ajaxStop(function() {

                $(".pit").tablesorter({
                    headers: {
                        7: {
                            sorter: "false", //prevents sorting of "add to cart" column
                        },
                        8: {
                            sorter: "digit", //data in this column will be sorted numericall
                            string: "bottom" //all non-numeric values will be pushed below sorted results
                        },
                        9: {
                            sorter: "digit",
                            string: "bottom"
                        },
                        10: {
                            sorter: "digit",
                            string: "bottom"
                        }
                    },
                    // theme: "default"
                });

              //  $('.pit').show();


            });
        }
        $('.pitDarkDataTable').show();


    }
}, 50);
