// esbalish an object for the cards that exist on trello
var cards = {"index":[]};

// establish and object of the project-wide metrics
var metrics = {};

metrics.actionNumber = 0;

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// use the date picker to select the start date that you'd like to look at your sprints from
$("#submit").on('click', function() {
	var startDate = $("#start-date").val();
})

// add the datepicker function to the id of "start-date"
$( function() {
	$( "#start-date" ).datepicker();
});

// onclick to call fillDate
$('#fill-date').on('click', function() {
	fillDate();
})

// fill the date picker with the hard coded date of 08-30-17
function fillDate() {
	$('#start-date').val("08-30-17");
}

$('#sprints').on('click', function() { 
	calculateSprints();
})

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// create an onlick function to get the call the actions from a board
$('#get-board-actions').on('click', function() { 
	getBoardActions();
})

// use an ajax call to get the actions from a board
function getBoardActions() {
	 $.ajax({
		url: "https://api.trello.com/1/boards/59b957fde1709e3aae62b5c8/actions?limit=100&filter=all" + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
	}).fail(function(err) {
		throw err;
	});
}

$('#get-board-actions2').on('click', function() { 
	getBoardActions2();
})

// use an ajax call to get the actions from a board
function getBoardActions2() {
	 $.ajax({
		url: "https://api.trello.com/1/boards/59b957fde1709e3aae62b5c8/actions?limit=100&filter=all&before=5aaff0aa4177f0ce4fd081f5" + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
	}).fail(function(err) {
		throw err;
	});
}


// create an onlick function to get the call the getList function
$('#get-list').on('click', function() { 
	getList();
})

// use an ajax call to get the lists of the team board from Trello
function getList() {
	 $.ajax({
		url: "https://api.trello.com/1/boards/59b957fde1709e3aae62b5c8/lists?" + key,
		method: 'GET',
	}).done(function(result) {
		var json = JSON.stringify(result);
	}).fail(function(err) {
		throw err;
	});
}

// on click to call the dateRange function
$('#date-range').on('click', function() { 
	dateRange();
})

// find the start and final date of all the cards
function dateRange() {
	var finalDate = new Date(cards[cards.index[0][0]].endDate); // establish the end date as the first card's end date
	for(i = 0; i < cards.index.length; i++) { // go through all the cards
		if(cards[cards.index[i][0]].endDate > finalDate) { // if the card's end date is later than the curent final date, change the final end date to the card's end date
			finalDate = new Date(cards[cards.index[i][0]].endDate);
		}
	}

	var startDate = $('#start-date').val(); // get the starting date from the UI
	if(startDate == 0) {
		startDate = new Date("08/30/17"); // if there is none, assume 08-30-17
	}
	else {
		startDate = new Date(start);
	}

	// put the starting and final dates into the metrics object
	metrics.startDate = startDate;
	metrics.finalDate = finalDate;

	// get the sprint length from the UI
	var sprintLength = parseInt($("#sprint-length").val());

	sprints(startDate,finalDate,sprintLength);
}

// find the start and end of all the sprints and put them into the metrics.sprints array
function sprints(projectStart,projectEnd,length) {
	var projectTime = convertMS(projectEnd-projectStart); // calculate the total time of the project
	var days = projectTime.d; // find out the number of days for the project
	var sprints = Math.floor(days/length); // find out the number of sprints within the project
	
	metrics.sprints = []; // create an array within the metrics object for the sprints
	
	for(let i = 0; i < sprints; i++) {
		var name = "sprint" + i; // create the sprint name
		metrics.sprints[i] = {}; // creat the sprint ojbect within teh sprints array
		
		var day = projectStart.getDate(); // getting the day the project starts
		
		var sprintStart = new Date(projectStart); // establish the start of the new sprint (to be changed later)
		sprintStart.setDate(day + (length * i)); // set the start of the sprint as the start of the project plus the length of the sprint times the sprint number
		
		var sprintEnd = new Date(sprintStart); // create new date object for the sprint end equal to the start of the sprint
		sprintEnd.setDate(sprintStart.getDate()+length); // set it as the start plus the length of the sprint
		
		metrics.sprints[i].sprintStart = sprintStart; // set the start of the sprint in the metrics object
		metrics.sprints[i].sprintEnd = sprintEnd; // set the end of the sprint in the metrics object

		metrics.sprints[i].name = "Sprint" + (i + 38);
	}

	addCycle();	
}

//
function addCycle() {
// go through the spritns and establish the total time "used" in that sprint and a blank array for the cards in the sprint
	for(i = 0; i < metrics.sprints.length; i++) {
		metrics.sprints[i].total = 0;
		metrics.sprints[i].cards = [];

// go through all the cards
		for(j = 0; j < cards.index.length; j++) {
			var id = cards.index[j][0][0]; // get the card id
			if(cards[id].endDate > metrics.sprints[i].sprintStart && cards[id].endDate < metrics.sprints[i].sprintEnd) { // if the end date of the card fit into the sprint start and end dates
				metrics.sprints[i].total = metrics.sprints[i].total + cards[id].cycleMS; // then add the card's cycle time to the sprint's cycle time
				metrics.sprints[i].cards.push(cards[id]); // and add the card's id to the array of cards in the sprint
			}
		}

		console.log("Sprint: " + i + " & total MS: ")
		if(metrics.sprints[i].total === 0) {
			metrics.sprints[i].cycleAvg = convertMS(0);
		}
		else {
			metrics.sprints[i].cycleAvg = convertMS(metrics.sprints[i].total/metrics.sprints[i].cards.length); // when done going through all the cards, convert the time to a more human readable format
		}
	}

	var total = 0;
	for(i = 0; i < cards.index.length; i++) {
		var MS = 0;
		//console.log(typeof cards[cards.index[i][0][0]].cycleMS)
		if(cards[cards.index[i][0][0]].cycleMS == NaN) {
			console.log("NaN & i: " + i);
		}
		else {
			MS = cards[cards.index[i][0][0]].cycleMS;
		}
		//console.log(MS);
		total = total + MS;
	}
	total = convertMS(total);
	console.log(total);



	for(i = 0; i < metrics.sprints.length; i++) {
		// console.log(metrics.sprints[i].cycle);
		// console.log(metrics.sprints[i]);
		metrics.sprints[i].cycleInt = (metrics.sprints[i].cycleAvg.d + (metrics.sprints[i].cycleAvg.h/24))/(metrics.sprints[i].cards.length);
		// console.log(metrics.sprints[i].cycleInt);
	}


}

$('#specific-card').on('click', function() { 
	specificCard();
})

//look up a specific card by providing a card number on the UI to faciliate testing
function specificCard() {
    console.log("specificCard");
    var cardNum = $('#card-num').val();
    console.log(cardNum);
    // var suffix = "https://api.trello.com/1/cards/" + cardNum + "/actions?filter=all&limit=100&key...";
    // console.log(suffix);

    $.ajax({
		url: "https://api.trello.com/1/cards/" + cardNum + "/actions?filter=all&limit=100" + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
		console.log("here");
		var json = JSON.stringify(result);
		console.log("json");
		console.log(json);
	}).fail(function(err) {
		throw err;
	});
}

//look up a specific action by providing a action number on the UI to faciliate testing
$('#specific-action').on('click', function() {
	specificAction();
})

function specificAction() {
    console.log("specificAction");
    var actionNum = $('#action-num').val();
    
    $.ajax({
		url: "https://api.trello.com/1/actions/" + actionNum + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
	}).fail(function(err) {
		throw err;
	});
}

$('#display-cards').on('click', function() { 
	displayCards();
})

function displayCards() {
	// var displayCards = ["5a3ad4b3f8e064912cdc06f2","5a021f661b540c72eff74020","59ef488f1da86489e5a918c4","5a2ab288e7c2bb0ec311340a","5a85b95606e27bc3b3e9462e","5a158a939cd58fa0fb84d8ff","5a8303a729da9f70c9e69884","5a65f5f3ab6dedd5f4cb84f5","5a2ea39ddc66bcdab31fa951","5a7c6afda3efbefe4708acf5","5a81db47cbfad3742300565c","5a54dcbf1519e9bcf78e2dbd","5a4e98f9acaba2d0cf46894b","5a4d518b117092791e4013b5","5a7c6a95605f9828e3ae5265","5a29741b07341db216a4a681","5a942714e054dced401cf629","5a4d51a0a2952de5e9bad92c","5a5fa21d90ddeddcbc085f90","5a33da7e30b778663391b071"]
	// var sampleCards = {};
	// for(i = 0; i < 20; i++) {
	// 	var id = displayCards[i];
	// 	sampleCards[id] = cards[id];
	// }
	
	// console.log("sampleCards");
	// console.log(sampleCards);
	
	// var json = JSON.stringify(sampleCards);
	// console.log("JSON");
	// console.log(json);
	console.log(cards);
	console.log(metrics);
}

$('#json-cards').on('click', function() { // on click to get call the getCards function
	jsonCards();
})

function jsonCards() {
	var json = JSON.stringify(cards);
	console.log("JSON cards");
	console.log(json);
}

$('#full-cards').on('click', function() { // on click to get call the getCards function
	fullCards();
})

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

$('#get-cards').on('click', function() { // on click to get call the getCards function
	getCards();
})

function getCards() {	// ajax call to the Trello api to get all the cards for the board with all fields
	$.ajax({
		url: "https://api.trello.com/1/search?query=59b957fde1709e3aae62b5c8&idBoards=mine&modelTypes=cards&board_fields=name%2CidOrganization&boards_limit=10&card_fields=all&cards_limit=1000&cards_page=0&card_list=true&card_attachments=false&organization_fields=name%2CdisplayName&organizations_limit=10&member_fields=avatarHash%2CfullName%2Cinitials%2Cusername%2Cconfirmed&members_limit=10" + key,
		method: 'GET',
	}).done(function(result) {
		createCards(result);	// send results to the createCards function to populate the cards object with certain information from the results
	}).fail(function(err) {
		throw err;
	});
}

function createCards(trello) { // function to go through the results and pull out the relevent information

	console.log(trello);

	for(i = 0; i < trello.cards.length; i++) { // go through each card int he array
		var id = trello.cards[i].id; // define the card's id
		var labels = []; // establish a variable for labels
		for (j = 0; j < trello.cards[i].labels.length; j++) { // go through the array of potential labels and add them to the labels variable
			labels.push(trello.cards[i].labels[j].name);
		}
		var name = trello.cards[i].name; // define the card's name
		var endDate = new Date(trello.cards[i].dateLastActivity); // define the card/s last date
		var actions = [] // make a blank array for actions to be populate later
		var shortId = "short" + trello.cards[i].idShort; // define the shortId
		cards[id] = {"id":id,"shortId":shortId,"labels":labels,"name":name,"endDate":endDate,"startDate":"","actions":actions,"cycleMS":0}; // add all the stuff to the card object
		var index = [[id],[shortId]]; // create an index associating the id and short id
		cards.index.push(index); // add to the index
	}

	console.log("Cards created");
	console.log(cards);

	organizeBatches();
}

// find some way to put arrays of 10 cards into an array of arrays so that you can iterate through the batch API call to do 25 calls, each of which has 10 GET calls for cards
function organizeBatches() {
	console.log("Organizing");

	var batchCount = 0;
	var apiCalls = "";
	var cardsCalled = [];

	for(i = 0; i < cards.index.length; i++) { //cards.index.length
		if(batchCount+1 === 10 || i === cards.index.length-1) {
			apiCalls = apiCalls + "/cards/" + cards.index[i][0] + "/actions?filter=all,"; // add the next api call to the batch
			cardsCalled.push(cards.index[i][0]);
			apiCalls = apiCalls.slice(0,-1); // slice off the trailing comma before sending it

			console.log("apiCalls: " + apiCalls);
			console.log(i);

			getActions(apiCalls);

			batchCount = 0; // reset batchCount for next batch of apis
			apiCalls = ""; // reset api list for next batch of apis
		}
		else {
			batchCount +=1; // count number of apis up to get to ten for a batch
			apiCalls = apiCalls + "/cards/" + cards.index[i][0] + "/actions?filter=all,"; // trello format for api calls in batch
			cardsCalled.push(cards.index[i][0]);
		}
	}

	console.log("cardsCalled");
	console.log(cardsCalled);
}

function getActions(apiCalls) {
	$.when(
		$.ajax({
			url: "https://api.trello.com/1/batch?urls=" + apiCalls + key,
			method: 'GET',
		}).done(function(result) {
			//actionResults(result);
		}).fail(function(err) {
			throw err;
		})
	).then(function(data, textStatus, jqXHR) { 
		actionResults(data);
		});
}

function actionResults(actionResults) {
//this only gets updateCards:idList and commentCard by default -- I can find a way to querry all, but not to do multiple types of filters on the batch api call
	console.log("actionResults: " + actionResults.length);
	console.log(actionResults);


	for(i = 0; i < actionResults.length; i++) {	// iterate through the actions per card to relevent data
		if(actionResults[i][200].length === 50) {
			console.log("Big mama: " + actionResults[i][200][0].data.card.id);
			metrics.actionNumber = metrics.actionNumber + 50;
		}
		else {
			for(j = 0; j < actionResults[i][200].length; j++) { //interate through the number of actions for that card for relevent data
				metrics.actionNumber = metrics.actionNumber + 1;
				if(actionResults[i][200][j].type === "createCard" || actionResults[i][200][j].type === "copyCard") {
					console.log("id:" + id + " & i/j " + i + "/" + j);
					//console.log("i: " + i + " & j: " + j + " | create or copy");
					//console.log(actionResults[i][200][j].type);
					//console.log("I: " + i + "& J: " + j);
					var id = actionResults[i][200][j].data.card.id;
					var type = actionResults[i][200][j].type;
					var date = new Date(actionResults[i][200][j].date);
					cards[id].startDate = date;
					var actionId = actionResults[i][200][j].id;
					var old = actionResults[i][200][j].data.old;

					if(actionResults[i][200][j].data.listBefore !== undefined) {
						var listBefore = actionResults[i][200][j].data.listBefore.id;
						var listAfter = actionResults[i][200][j].data.listAfter.id;
					}
					else {
						var listBefore = "";
						var listAfter = "";
					}
				
					var actionObject = {"date":date,"cardId":id,"type":type,"actionId":actionId,"listBefore":listBefore,"listAfter":listAfter,"old":old}; // consoldate data into an object
					//console.log("cardId: " + id);
					cards[id].actions.push(actionObject); // push action object to the appropriate card
				}
				// else if(actionResults[i][200][j].type === "updateCard" && actionResults[i][200][j].data.old.hasOwnProperty("pos")) {
				// console.log("position change");
				// }
				else if(
					(actionResults[i][200][j].type === "updateCard" && actionResults[i][200][j].data.old.hasOwnProperty("closed")) ||
					(actionResults[i][200][j].type === "updateCard" && actionResults[i][200][j].data.old.hasOwnProperty("idList")) 
					) {
					//console.log("I: " + i + "& J: " + j + " | updateCard");
					var id = actionResults[i][200][j].data.card.id;
					var type = actionResults[i][200][j].type;
					var date = new Date(actionResults[i][200][j].date);
					var actionId = actionResults[i][200][j].id;
					var old = actionResults[i][200][j].data.old;

					if(actionResults[i][200][j].data.listBefore !== undefined) {
						var listBefore = actionResults[i][200][j].data.listBefore.id;
						var listAfter = actionResults[i][200][j].data.listAfter.id;
					}
					else {
						var listBefore = "";
						var listAfter = "";
				}
			
				var actionObject = {"date":date,"cardId":id,"type":type,"actionId":actionId,"listBefore":listBefore,"listAfter":listAfter,"old":old}; // consoldate data into an object
				//console.log("cardId: " + id);
				cards[id].actions.push(actionObject); // push action object to the appropriate card
				}
				else {
				}
			}
		}
	// console.log("got here");
	// console.log(cards);
	}
}

$('#calculate-cycle').on('click', function() { 
	calculateCycle();
})

function calculateCycle()
{
	// console.log("Start cycling");
	// console.log(cards.index);
	for(i = 0; i < cards.index.length; i++) {
		var id = cards.index[i][0][0];
		var cycle = cards[id].endDate-cards[id].startDate;
		if(cycle >= 0) {
			cards[id].cycleMS = cycle;//convertMS(cycle);
		}
		else {
			cards[id].cycleMS = 0;
		}
	}

	console.log(cards);
}

// create an onlick function to show the results on the UI
$('#show-output').on('click', function() { 
	showOutput();
})

// once clicked, show some info from the Sprints
function showOutput() {
	console.log(metrics.sprints.length);
	for(i = 0; i < metrics.sprints.length; i++) {
		var days = metrics.sprints[i].cycleAvg.d;
		days = days + Math.round(metrics.sprints[i].cycleAvg.h/24*100,4)/100;

		var $sprintHeader = $("<h3>").html(metrics.sprints[i].name + "</h3>");
		var $sprintData = (
			"<p>Sprint Start: " + metrics.sprints[i].sprintStart.toDateString() + 
			"<br>Sprint End: " + metrics.sprints[i].sprintEnd.toDateString() + 
			"<br>Cards: " + metrics.sprints[i].cards.length + 
			"<br>Average card cycle time: " + days + " days");//metrics.sprints[i].cycleAvg.h/24;// + Math.round((metrics.sprints[i].cycleAvg.h/24),2));
		
		var $output = $("#output");
		$output.append($sprintHeader);
		$output.append($sprintData);
	}
}

function convertMS(ms) {
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return { d: d, h: h, m: m, s: s };
};

$('#not-get').on('click', function() { 
	notGet();
})

function notGet() {
    fullCards();
	calculateCycle();
	dateRange();
}



//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

var n = 6; // number of layers
var m = 12; // number of samples per layer
var stack = d3.stack();
//var data = d3.range(n).map(function() { return bumpLayer(m, .1); });

var data = [[2.7,2,3.2,4.3,2.8,2.5,2.5,3.8,4,4,3,5.3],[0,0,0.3,0.3,0.8,0.4,0,0,1.5,0.3,0,0.7],[0,0.3,0.3,0,0,0,0.3,0,0,0,0,0],[1.5,3.3,0.8,0.8,0.2,0.4,0.3,0.5,1,1.3,1.7,1],[0,0.3,0.3,0,0,0,0.3,0.3,0,0,0,0],[0.8,1,2,0.5,0.4,0.2,1.8,0.3,0,0,0.5,0]];

$('#new-data').on('click', function() { 
	newData();
})

function newData() {
	var newData = [[5.4,4,6.4,8.6,5.6,5,5,7.6,8,8,6,10.6],[0,0,0.6,0.6,1.6,0.8,0,0,3,0.6,0,1.4],[0,0.6,0.6,0,0,0,0.6,0,0,0,0,0],[3,6.6,1.6,1.6,0.4,0.8,0.6,1,2,2.6,3.4,2],[0,0.6,0.6,0,0,0,0.6,0.6,0,0,0,0],[1.6,2,4,1,0.8,0.4,3.6,0.6,0,0,1,0]];
	data = newData;
	reset();
}

	var formatPercent = d3.format(".0%");
	var formatNumber = d3.format("");

	// transpose data
	data = data[0].map(function(col, i) { 
	    return data.map(function(row) { 
	        return row[i] 
	    })
	});

//console.log(data);

var layers = stack.keys(d3.range(n))(data),
    yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1]; }); }),
    yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1] - d[0]; }); });

var margin = {top: 40, right: 10, bottom: 20, left: 35},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var dates = ["Aug 30","Sep 13","Sep 27","Oct 11","Oct 25","Nov 8","Nov 22","Dec 6","Dec 20","Jan 3","Jan 17","Jan 31"];

var x = d3.scaleBand()
    .domain(d3.range(m)) //dates || d3.range(m)
    .rangeRound([0, width])
    .padding(0.1)
    .align(0.1);

var y = d3.scaleLinear()
    .domain([0, yStackMax])
    .rangeRound([height, 0]);

var color = d3.scaleLinear()
    .domain([0, n - 1])
    .range(["#aad", "#556"]);

var xAxis = d3.axisBottom()
    .scale(x)
    .tickSize(0)
    .tickPadding(6)
    .tickFormat(function(d, i) { return dates[i]});

var yAxis = d3.axisLeft()
    .scale(y)
    .tickSize(2)
    .tickPadding(6);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var layer = svg.selectAll(".layer")
    .data(layers)
  .enter().append("g")
    .attr("class", "layer")
    .attr("id", function(d) { return d.key; })
    .style("fill", function(d, i) { return color(i); });

var rect = layer.selectAll("rect")
    .data(function(d) { return d; })
  .enter().append("rect")
    .attr("x", function(d, i) { return x(i); })
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0);

rect.transition()
    .delay(function(d, i) {return i * 10; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + 0 + ",0)")
    .style("font-size", "10px")
    .call(yAxis);

d3.selectAll("input").on("change", change);

var timeout = setTimeout(function() { 
    d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
    setTimeout(function() {
        d3.select("input[value=\"percent\"]").property("checked", true).each(change);
    }, 2000);
}, 2000);

function reset() {
	console.log("Got here");
	// var data = [];

	// function makeData(data) {
	//     data = data;
	//}

	//console.log(data);

	formatPercent = d3.format(".0%");
	formatNumber = d3.format("");

	// transpose data
	data = data[0].map(function(col, i) { 
	    return data.map(function(row) { 
	        return row[i] 
	    })
	});

	//console.log(data);

	layers = stack.keys(d3.range(n))(data);
	yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1]; }); });
	yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1] - d[0]; }); });

	margin = {top: 40, right: 10, bottom: 20, left: 35};
	width = 960 - margin.left - margin.right;
	height = 500 - margin.top - margin.bottom;

	dates = ["Aug 30","Sep 13","Sep 27","Oct 11","Oct 25","Nov 8","Nov 22","Dec 6","Dec 20","Jan 3","Jan 17","Jan 31"];

	x = d3.scaleBand()
	    .domain(d3.range(m)) //dates || d3.range(m)
	    .rangeRound([0, width])
	    .padding(0.1)
	    .align(0.1);

	y = d3.scaleLinear()
	    .domain([0, yStackMax])
	    .rangeRound([height, 0]);

	color = d3.scaleLinear()
	    .domain([0, n - 1])
	    .range(["#aad", "#556"]);

	xAxis = d3.axisBottom()
	    .scale(x)
	    .tickSize(0)
	    .tickPadding(6)
	    .tickFormat(function(d, i) { return dates[i]});

	yAxis = d3.axisLeft()
	    .scale(y)
	    .tickSize(2)
	    .tickPadding(6);

	// svg = d3.select("body").append("svg")
	//     .attr("width", width + margin.left + margin.right)
	//     .attr("height", height + margin.top + margin.bottom)
	//   .append("g")
	//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	layer = svg.selectAll(".layer")
	    .data(layers)
	  .enter().append("g")
	    .attr("class", "layer")
	    .attr("id", function(d) { return d.key; })
	    .style("fill", function(d, i) { return color(i); });

	rect = layer.selectAll("rect")
	    .data(function(d) { return d; })
	  .enter().append("rect")
	    .attr("x", function(d, i) { return x(i); })
	    .attr("y", height)
	    .attr("width", x.bandwidth())
	    .attr("height", 0);

	rect.transition()
	    .delay(function(d, i) {return i * 10; })
	    .attr("y", function(d) { return y(d[1]); })
	    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

	svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + 0 + ",0)")
	    .style("font-size", "10px")
	    .call(yAxis);

	d3.selectAll("input").on("change", change);

	timeout = setTimeout(function() { 
	    d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
	    setTimeout(function() {
	        d3.select("input[value=\"percent\"]").property("checked", true).each(change);
	    }, 2000);
	}, 2000);
}

function change() {
    clearTimeout(timeout);
    if (this.value === "grouped") transitionGrouped();
    else if (this.value === "stacked") transitionStacked();
    else if (this.value === "percent") transitionPercent();

}

function transitionGrouped() {
    y.domain([0, yGroupMax]);

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d, i, j) { return x(i) + x.bandwidth() / n * parseInt(this.parentNode.id); })
        .attr("width", x.bandwidth() / n)
    .transition()
        .attr("y", function(d) { return height - (y(d[0]) - y(d[1])); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); });

    yAxis.tickFormat(formatNumber)
    svg.selectAll(".y.axis").transition()
        .delay(500)
        .duration(500)
        .call(yAxis)
}

function transitionStacked() {
    y.domain([0, yStackMax]);
    console.log("yStackMax: " + yStackMax);

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .transition()
        .attr("x", function(d, i) { return x(i); })
        .attr("width", x.bandwidth());

    yAxis.tickFormat(formatNumber)
    svg.selectAll(".y.axis").transition()
        .delay(500)
        .duration(500)
        .call(yAxis)

}

function transitionPercent() {
    y.domain([0, 1]); // .5

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { 
            var total = d3.sum(d3.values(d.data));
            return y(d[1] / total); })
        .attr("height", function(d) { 
            var total = d3.sum(d3.values(d.data));
            //console.log("d[0]: " + d[0] + " | d[1] / y num: " + d[1] + " | total: " + total);
            //console.log(d);
            return y(d[0] / total) - y(d[1] / total); })
    .transition()
        .attr("x", function(d, i) { return x(i); })
        .attr("width", x.bandwidth());

    yAxis.tickFormat(formatPercent)

    svg.selectAll(".y.axis").transition()
        .delay(500)
        .duration(500)
        .call(yAxis)

}
