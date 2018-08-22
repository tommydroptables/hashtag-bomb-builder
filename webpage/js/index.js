
        var TAG_COOKIE_STR = "tags_disabled";
        var TAG_SEARCHED_STR = "tags_searched";

        var dataSet = [];
        var hiddenDataSet = [];

        function getDataset(tag, onLoadCallback) {
            if (dataSet.length == 0 && hiddenDataSet.length == 0) {
                console.log("Making request");
                var xhr = new XMLHttpRequest();
                xhr.open('GET', "http://api.hashtagbombbuilder.com/v1/tag/" + tag, true);
                xhr.send();

                xhr.addEventListener("readystatechange", function (e) {
                    try {
                        if (xhr.status != 200) {
                            showError("There was a problem loading the data. Please reload the page and try again.");
                            return;
                        }
                        if (xhr.readyState == 4) {
                            var tagResponse = JSON.parse(xhr.responseText);
                            var backgrounds = randomColor({ count: Object.keys(tagResponse).length, luminosity: 'light' });
                            var index = 0;
                            for (var key in tagResponse) {

                                // check if the property/key is defined in the object itself, not in parent
                                if (tagResponse.hasOwnProperty(key)) {
                                    dataSet.push({
                                        label: key,
                                        backgroundColor: backgrounds[index],
                                        data: [
                                            parseInt(tagResponse[key], 10),
                                        ]
                                    });
                                    console.log(key, tagResponse[key]);
                                    index++;
                                }
                            }
                            showChartContainer();
                            hideLoadingBar();
                            hideInfoContainer();

                            console.log(dataSet)
                            onLoadCallback(dataSet);
                        }
                    }
                    catch (err) {
                        console.log("Error loading data" + err);
                        showError("There was a problem loading data. Please try again.");
                    }
                }, false);

            } else {
                console.log(dataSet)
                onLoadCallback(dataSet);
            }
        }

        function getDatasetPie(tags, pieChartCallback) {
            getDataset(tags, function (tempDataset) {
                var returnData = {
                    "labels": [],
                    "datasets": [{
                        "backgroundColor": [],
                        "data": [],
                    }]
                };

                tempDataset.forEach(function (tempData) {
                    returnData["labels"].push(tempData["label"]);
                    returnData["datasets"][0]["backgroundColor"].push(tempData["backgroundColor"]);
                    returnData["datasets"][0]["data"].push(tempData["data"]);
                });
                pieChartCallback(returnData);
            });
        }

        function getDatasetTags(tags, onLoadCallback) {
            getDataset(tags, function (tempDataset) {
                var returnData = {};
                //var previouslyHiddenTags = getCookieArray(TAG_COOKIE_STR);

                tempDataset.forEach(function (tempData) {
                    // TODO(tom):find a way to save this in a cookie
                    // Mark the tag as hidden if its in the hidden tag cookie
                    returnData[tempData["label"]] = false //previouslyHiddenTags.includes(tempData["label"]);
                });
                onLoadCallback(returnData);
            });
        }

        var allTags = {};

        function getTagSting() {
            var tagText = '<div style="line-height: 1;">.<br/>.<br/>.<br/>.<br/>.<br/></div>';
            var tempTag = "";

            for (var key in allTags) {
                tempTag = key;
                if (allTags[key]) {
                    continue;
                }

                if (!tempTag.includes("#")) {
                    tempTag = "#" + allTags[key];
                }
                tagText = tagText.concat(" " + tempTag);
            }
            return tagText;
        }

        function updateTagBlock() {
            tagText = getTagSting();
            document.getElementById('tags').innerHTML = tagText;

            // When tag block changes reset copy button
            resetCopyButton();
        }
        var allSiteCharts = [];
        var BarCharCtx = document.getElementById('barChart').getContext('2d');
        var PiChartCtx = document.getElementById("myChart").getContext('2d');
        // Override the click handler
        var defaultLegendClickHandler = Chart.defaults.global.legend.onClick;
        var weightChartOptions = {
            pieceLabel: {
                render: 'label',
            },
            responsive: true,
            legendCallback: function (chart) {
                console.log(chart);
                var legendHtml = [];
                legendHtml.push('<ul id="horizontal-list">');
                for (var i = 0; i < chart.data.datasets[0].data.length; i++) {
                    var tempBkndClr = myBar.data.datasets[0].backgroundColor[i];
                    legendHtml.push('<li id="' + i + '" class="legend-item">');
                    legendHtml.push('    <div style="display: inline-block" onclick="newLegendClickHandler(event, ' + '\'' + i + '\'' + ')">');
                    legendHtml.push('        <span class="chart-legend-color" style="background-color:' + tempBkndClr + '"></span>');
                    if (chart.data.labels[i]) {
                        legendHtml.push('        ' + chart.data.labels[i] + '</div></li>');
                    } else {
                        legendHtml.push('    </div>');
                        legendHtml.push('</li>');
                    }
                }
                legendHtml.push('</ul>');
                return legendHtml.join("");
            },
            legend: {
                display: false,
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };



        // Show/hide chart by click legend
        updateDataset = function (e, datasetIndex) {
            var index = datasetIndex;
            var ci = e.view.weightChart;
            var meta = ci.getDatasetMeta(index);

            // See controller.isDatasetVisible comment
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

            // We hid a dataset ... rerender the chart
            ci.update();
        };

        myBar = new Chart(BarCharCtx, {
            type: 'bar',
            data: null,
            options: weightChartOptions,
        });
        allSiteCharts.push(myBar);
        var pieChart = new Chart(PiChartCtx, {
            type: 'pie',
            options: {
                pieceLabel: {
                    render: 'label',
                },
                legend: {
                    display: false,
                }
            },
            data: {
                labels: null,
                datasets: null,
            }
        });
        allSiteCharts.push(pieChart);

        function loadBarChart(tags) {
            getDatasetPie(tags, function (barData) {
                var barChartData = {
                    labels: barData["labels"],
                    datasets: barData["datasets"],
                };
                console.log("bitches");
                console.log(myBar);

                myBar.data = barChartData;
                myBar.update();
            });
        }
        function loadTagCopy(tags) {
            getDatasetTags(tags, function (tempTags) {
                allTags = tempTags;
                updateTagBlock();
            });
        }

        function loadCharts(tags) {
            loadBarChart(tags);

            getDatasetPie(tags, function (pieCharData) {
                var pieChartData = {
                    labels: pieCharData["labels"],
                    datasets: pieCharData["datasets"],
                };
                console.log("more bitches");
                console.log(pieChart);
                pieChart.data = pieChartData;

                // Allow For chart to be modified
                pieChart.update();
            });
            loadTagCopy(tags);

            generateLegend();
        }

        function generateLegend() {
            console.log("Generating Legend");
            var legend = document.getElementById("legendContainer");
            legend.innerHTML = myBar.generateLegend();
        }

        function getCharts() {
            return allSiteCharts
        }

        function resetCopyButton() {
            var copyButton = document.getElementById("copyCodeBlock");
            copyButton.innerHTML = "copy";
        }

        function showLoadingBar() {
            $('.bar').css("visibility", "visible");
            setInfoText("Gathering your tags");
            hideHelpContainer();
        }
        function setInfoText(text) {
            document.getElementById("infoTextLine1").innerHTML = text;
            $('#infoTextLine2').css("display", "none");
        }
        function hideInfoContainer() {
            $('#infoContainer').css("display", "none");
        }
        function showInfoContainer() {
            $('#infoContainer').css("display", "inline");
        }
        function hideHelpContainer() {
            $('#helpContainer').css("display", "none");
        }
        function hideLoadingBar() {
            $('.bar').css("visibility", "hidden");
        }
        function showChartContainer() {
            $('#chartContainer').css("visibility", "visible");
            $('#legendContainer').css("visibility", "visible");
        }
        function hideChartContainer() {
            $('#chartContainer').css("visibility", "hidden");
            $('#legendContainer').css("visibility", "hidden");
        }


        function showError(errorStr) {
            hideLoadingBar();
            hideHelpContainer();
            hideChartContainer();
            showInfoContainer();
            setInfoText(errorStr);
        }

        function newLegendClickHandler(e, legendItemIndex) {
            console.log("INDEX: " + legendItemIndex);
            console.log("text-decoration: " + $(e.target).css("text-decoration"));
            var parent = e.target;
            var line_through = $(e.target).css("text-decoration");
            console.log("debug: " + line_through.includes("line-through"));
            if (!line_through.includes("line-through")) {
                $(e.target).css("text-decoration", "line-through");
            } else {
                $(e.target).css("text-decoration", "none");
            }
            // parent.style.textDecorationColor = 'line-through';
            // $(e.target).css('text-decoration': 'line-through');
            var index = legendItemIndex;

            var tagName = "";
            var tagHidden = false;

            // Loop through all charts and upate them when legend is clicked
            getCharts().forEach(function (siteChart) {
                if (siteChart != null) {
                    console.log(pieChart.data.labels);
                    var tagName = pieChart.data.labels[legendItemIndex];
                    console.log("CLICK LEGEND" + tagName);
                    // POP TAG OUT OF dataSet
                    if (siteChart.config.type === "bar") {
                        var found = false;
                        var item;

                        // Delete the item from the graph
                        for (var i = 0; i < dataSet.length; i++) {
                            item = dataSet[i];

                            console.log(item);
                            if (item.label == tagName) {
                                found = true;
                                // Pop item and put it in hiddenDataSet
                                hiddenDataSet.push(dataSet.splice(i, 1)[0]);
                                break;
                            }
                        }

                        // Add the item back to the graph
                        if (!found) {
                            for (var i = 0; i < hiddenDataSet.length; i++) {
                                item = hiddenDataSet[i];
                                if (item.label == tagName) {
                                    // Pop item and put it in dataSet
                                    dataSet.push(hiddenDataSet.splice(i, 1)[0]);
                                    break;
                                }
                            }
                        }
                        // Update the bar char with the new data. We can't call myBar.Update()
                        // since we are hacking the bar chart library to hold 1 dataset but allow
                        // us to modify the data in a legend
                        loadBarChart("");
                    }
                    if (siteChart.config.type === "pie") {
                        var hideData = !siteChart.legend.legendItems[index].hidden;
                        tagHidden = hideData

                        console.log("pie chart");
                        siteChart.getDatasetMeta(0).data[index].hidden = hideData;
                    }
                    console.log(siteChart)
                    siteChart.update();
                }
            });
            if (tagName != "") {
                allTags[tagName] = tagHidden

            }
            loadTagCopy();
        }

        function searchContainerBadCaracter(tempSearchText) {
            badChars = ['!', '$', '%', '^', '&', '*', '+', '.'];
            for (badChar of badChars) {
                if (tempSearchText.indexOf(badChar) > -1) {
                    return "Hashtags can't contain these special characters: '" + badChars.join("', '") + "'"
                }
            }


            if (tempSearchText.match(/^\d/)) {
                return "Hashtags can't start with a number!"
            }
            return ""
        }

        function setSearchButtonBackgroundRandom() {
            var searchBackgroundColor = randomColor({ count: 1, luminosity: 'light' });
            $('#search_submit').css("background-color", "" + "#A513B6");
            $('#search_submit').css("border-color", "" + "#A513B6");
            $('#search_submit').css("color", "" + "white");
        }

        //setSearchButtonBackgroundRandom();
        $("#codeBlock").click(function () {
            var holdtext = document.getElementById("tags");
            var copyButton = document.getElementById("copyCodeBlock");

            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(holdtext);
            selection.removeAllRanges();
            selection.addRange(range);


            document.execCommand("copy");
            copyButton.innerHTML = "copied to clipboard";
        });

        $("#search_submit").click(function () {
            var tags = $('#search_values').val();
            if (tags == "") {
                return;
            }
            errorStr = searchContainerBadCaracter(tags);
            if (errorStr.length > 0) {
                showError(errorStr);
                return;
            }

            newTags = "";
            for (var i = 0; i < tags.length; i++) {
                if (tags.charAt(i) == '#') {
                    continue;
                }
                if (tags.charAt(i) == ' ' || tags.charAt(i) == ',') {
                    showError("Sorry currently we only support ONE tag at a time");
                    return
                }
                newTags += tags.charAt(i);
            }

            showLoadingBar();
            // Reset Dataset when new value is submited
            dataSet = [];
            hiddenDataSet = [];
            getDataset(newTags, function (data) {
                loadCharts(newTags);
            });
        });

        $('#contactForm').submit(function () {
            return false;
        });
