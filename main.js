// GLOBAL VARIABLES

// esbalish an object for the cards that exist on trello
var cards = {"index":[]};

// establish and object of the project-wide metrics
var metrics = {totalBatches: 0, currentBatch: 0};

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// USER INPUTED INFORMATION

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

// FUTURE FUNCTIONALITY

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

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// var lists = [{"id":"5a1c3168ec582ec6b5525f77","name":"Team Backlog","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":32767.5,"subscribed":false},{"id":"59b99bfec694acd6d384a115","name":"In Dev","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":65535,"subscribed":false},{"id":"59b99c0430ddaadbe1d22d93","name":"Pull Request","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":131071,"subscribed":false},{"id":"59b99c097600a8d5c832b64f","name":"BA Review","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":196607,"subscribed":false},{"id":"59b99c0f20d57c7e366b042a","name":"508","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":262143,"subscribed":false},{"id":"59b99c13f18d666f83eade72","name":"PO Review","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":278527,"subscribed":false},{"id":"59f0d42be9f96ec56fcbc289","name":"Done (Archive all cards at once after Sprint Review)","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":368639,"subscribed":false},{"id":"5a79d8775196db7d0bf33754","name":"Closed (but not done)","closed":false,"idBoard":"59b957fde1709e3aae62b5c8","pos":540671,"subscribed":false}];

// function List(id, name, first, last, pos) {
// 	this.id = id;
// 	this.name = name;
// 	this.first = first;
// 	this.last = last;
// 	this.pos = pos;
// }

// function makeLists() {

// }

$('#get-cards').on('click', function() { // on click to get call the getCards function
	getCards();
})

function getCards() {	// ajax call to the Trello api to get all the cards for the board with all fields
	console.log("getCards - 1");
	$.ajax({
		url: "https://api.trello.com/1/search?query=59b957fde1709e3aae62b5c8&idBoards=mine&modelTypes=cards&board_fields=name%2CidOrganization&boards_limit=10&card_fields=all&cards_limit=1000&cards_page=0&card_list=true&card_attachments=false&organization_fields=name%2CdisplayName&organizations_limit=10&member_fields=avatarHash%2CfullName%2Cinitials%2Cusername%2Cconfirmed&members_limit=10&" + key,
		method: 'GET',
	}).done(function(result) {
		createCards(result);	// send results to the createCards function to populate the cards object with certain information from the results
	}).fail(function(err) {
		throw err;
	});
}

function createCards(trello) { // function to go through the results and pull out the relevent information
	console.log("createCards - 2");

	metrics.totalBatches = Math.floor(trello.cards.length/10,1)+1;
	console.log(metrics.totalBatches);

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
		var lists = [];
		cards[id] = {"id":id,"shortId":shortId,"labels":labels,"lists": lists,"name":name,"endDate":endDate,"startDate":"","actions":actions,"cycleMS":0}; // add all the stuff to the card object
		var index = [id,shortId];//[[id],[shortId]]; // create an index associating the id and short id
		cards.index.push(index); // add to the index
	}

	organizeBatches();
}

// find some way to put arrays of 10 cards into an array of arrays so that you can iterate through the batch API call to do 25 calls, each of which has 10 GET calls for cards
function organizeBatches() {
	console.log("organizeBatches - 3");

	var batchCount = 0;
	var apiCalls = "";
	var cardsCalled = [];

	for(i = 0; i < cards.index.length; i++) { //cards.index.length
		if(batchCount+1 === 10 || i === cards.index.length-1) {
			apiCalls = apiCalls + "%2C%2Fcards%2F" + cards.index[i][0] + "%2Factions%3Ffilter%3Dall%26limit%3D100"; // add the next api call to the batch
			cardsCalled.push(cards.index[i][0]);

			getActions(apiCalls, status);

			batchCount = 0; // reset batchCount for next batch of apis
			apiCalls = ""; // reset api list for next batch of apis
		}
		else if(batchCount > 0) {
			batchCount +=1; // count number of apis up to get to ten for a batch
			apiCalls = apiCalls + "%2C%2Fcards%2F" + cards.index[i][0] + "%2Factions%3Ffilter%3Dall%26limit%3D100"; // trello format for api calls in batch
			cardsCalled.push(cards.index[i][0]);
		}
		else if(batchCount === 0) {
			batchCount +=1; // count number of apis up to get to ten for a batch
			apiCalls = apiCalls + "%2Fcards%2F" + cards.index[i][0] + "%2Factions%3Ffilter%3Dall%26limit%3D100"; // trello format for api calls in batch
			cardsCalled.push(cards.index[i][0]);
		}
	}
}

function getActions(apiCalls) {
	console.log("getActions - 4");

	$.when(
		$.ajax({
			url: "https://api.trello.com/1/batch?urls=" + apiCalls + "&" + key,
			method: 'GET',
		}).done(function(result) {
		}).fail(function(err) {
			throw err;
		})
	).then(function(data, textStatus, jqXHR) {
		logActions(data);
		metrics.currentBatch = metrics.currentBatch + 1;
		if(metrics.currentBatch === metrics.totalBatches) {
			calculateCycle();
		}
	});
}

function logActions(actionResults) { 
	console.log("logActions - 5");

	for(i = 0; i < actionResults.length; i++) {	// iterate through the actions per card to relevent data
		var results = actionResults[i][200];

		for(j = 0; j < results.length; j++) { //interate through the number of actions for that card for relevent data
			if(results[j].type === "createCard" || results[j].type === "copyCard") {
				var actionCard = new CreateAction(results, j);
				cards[actionCard.id].actions.push(actionCard);
				
				var lists = {"listId": actionCard.listId, "date": actionCard.date, "name": actionCard.name};
				cards[actionCard.id].lists.push(lists);
			}

			else if(results[j].type === "updateCard" && results[j].data.old.hasOwnProperty("idList")) {
				var actionCard = new UpdateAction(results, j); // construct new Update action object
				cards[actionCard.id].actions.push(actionCard); // push Update to the card

				var lists = {"listBefore": actionCard.listBefore, "listAfter": actionCard.listAfter, "date": actionCard.date,"nameBefore": actionCard.nameBefore, "nameAfter":actionCard.nameAfter};
				cards[actionCard.id].lists.push(lists);
			}

			else if (results[j].type === "updateCard" && results[j].data.old.hasOwnProperty("closed")) {
				var actionCard = new CloseActions(results, j);
				cards[actionCard.id].actions.push(actionCard);
				
				var lists = {"listId": actionCard.listId, "date": actionCard.date, "name": actionCard.name};
				cards[actionCard.id].lists.push(lists);
			}
		
			else {
			}
		}
	}
}

// constructor for Create actions
function CreateAction(results, j) {
	this.id = results[j].data.card.id;
	this.type = results[j].type;
	this.date = new Date(results[j].date);
	cards[this.id].startDate = this.date;
	this.actionId = results[j].id;
	this.old = results[j].data.old;
	this.listId = results[j].data.list.id;
	this.name = results[j].data.list.name;
}

// constructor for Update actions
function UpdateAction(results, j) {
	this.id = results[j].data.card.id;
	this.type = results[j].type;
	this.date = new Date(results[j].date);
	cards[this.id].startDate = this.date;
	this.actionId = results[j].id;
	this.old = results[j].data.old;
	if(results[j].data.listBefore === undefined) {
	}
	else {
		this.listBefore = results[j].data.listBefore.id;
		this.nameBefore = results[j].data.listBefore.name;
		this.listAfter = results[j].data.listAfter.id;
		this.nameAfter = results[j].data.listAfter.name;
	}
}

// constructor for Update actions
function CloseActions(results, j) {
	this.id = results[j].data.card.id;
	this.type = results[j].type;
	this.date = new Date(results[j].date);
	cards[this.id].startDate = this.date;
	this.actionId = results[j].id;
	this.old = results[j].data.old;
	this.listId = results[j].data.list.id;
	this.name = results[j].data.list.name;
}

function calculateCycle() {
	console.log("calculateCycle - 6");

	for(i = 0; i < cards.index.length; i++) {
		var id = cards.index[i][0];
		var cycle = cards[id].endDate-cards[id].startDate;
		if(cycle >= 0) {
			cards[id].cycleMS = cycle;//convertMS(cycle);
		}
		else {
			cards[id].cycleMS = 0;
		}
	}
	dateRange();
}

// find the start and final date of all the cards
function dateRange() {
	console.log("dateRange - 7");

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
	console.log("done");
}

// find the start and end of all the sprints and put them into the metrics.sprints array
function sprints(projectStart,projectEnd,length) {
	console.log("sprints - 8");

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

		metrics.sprints[i].lists = {};
	}

	addCycle();	
}

// go through the spritns and establish the total time "used" in that sprint and a blank array for the cards in the sprint
function addCycle() {
	console.log("addCycle - 9");

	for(i = 0; i < metrics.sprints.length; i++) {
		metrics.sprints[i].total = 0; // establish baselines for sprint i
		metrics.sprints[i].cards = [];

// go through all the cards
		for(j = 0; j < cards.index.length; j++) {
			var id = cards.index[j][0]; // get the card id
			if(cards[id].endDate > metrics.sprints[i].sprintStart && cards[id].endDate < metrics.sprints[i].sprintEnd) { // if the end date of the card fit into the sprint start and end dates
				metrics.sprints[i].total = metrics.sprints[i].total + cards[id].cycleMS; // then add the card's cycle time to the sprint's cycle time
				metrics.sprints[i].cards.push(cards[id]); // and add the card's id to the array of cards in the sprint
			}
		}

		if(metrics.sprints[i].total === 0) {
			metrics.sprints[i].cycleAvg = convertMS(0); // for the case of a Sprint having no cards... annoying first Sprint
		}
		else {
			metrics.sprints[i].cycleAvg = convertMS(metrics.sprints[i].total/metrics.sprints[i].cards.length); // when done going through all the cards, convert the time to a more human readable format
		}
	}

	var sprintTotal = 0; // instantiate total time
	for(i = 0; i < cards.index.length; i++) { // go through the cards and add up the time spent
		var MS = 0;
		var id = cards.index[i][0];
		if(cards[id].cycleMS == NaN) {
			console.log("NaN & i: " + i); // I guess this was for when things were blank?
		}
		else {
			MS = cards[id].cycleMS; // grab the MS from the card
		}
		sprintTotal = sprintTotal + MS; // add the MS from the card to the Sprint total
	}
	sprintTotal = convertMS(sprintTotal);

	for(i = 0; i < metrics.sprints.length; i++) {
		metrics.sprints[i].cycleInt = (metrics.sprints[i].cycleAvg.d + (metrics.sprints[i].cycleAvg.h/24)) // once done with all the sprints, go through them and get an interger (okay, it's not a real integer) for the average cycle time
	}
	// calculateLists();
}

// go through all the changes in the list a card is on and determine how many MS they were on each list
function calculateLists() {
	console.log("calculateLists - 10");
    for(i = 0; i < cards.index.length; i++) {
    	var id = cards.index[i][0];

    	for(j = cards[id].lists.length-1; j > 0; j--) {
    		var timeInList = cards[id].lists[j-1].date - cards[id].lists[j].date;
    		cards[id].lists[j].cycleMs = timeInList;
    	}
    }
    getList()
}

// get the lists from the board
function getLists() {
    console.log("getLists -11");
    
    $.ajax({
		url: "https://api.trello.com/1/boards/59b957fde1709e3aae62b5c8/lists?" + key,
		method: 'GET',
	}).done(function(result) {
		logLists(result);
	}).fail(function(err) {
		throw err;
	});
}

function logLists(listResults) {
	console.log("logLists");
	for(i = 0; i < listResults.length; i++) {
		if(listResults[i].closed === true) {
		}
		else {
			for(j = 0; j < metrics.sprints.length; j++) {
				var listId = listResults[i].id;
				var listName = listResults[i].name;
				var listPos = listResults[i].pos;
				metrics.sprints[j].lists[listId] = {"listName": listName, "listPos": listPos};
			}
		}
	}
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// TESTING FUNCTIONS

$('#specific-batch').on('click', function() { 
	specificBatch();
})

//look up a batch of api calls
function specificBatch() {
    console.log("specificBatch");
    var batchVal = $('#batch-val').val();
    console.log(batchVal);

    $.ajax({
		url: "https://api.trello.com/1/batch?urls=" + batchVal + "&" + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
	}).fail(function(err) {
		throw err;
	});
}

$('#specific-card').on('click', function() { 
	specificCard();
})

//look up a specific card by providing a card number on the UI to faciliate testing
function specificCard() {
    console.log("specificCard");
    var cardNum = $('#card-num').val();
    console.log(cardNum);
    
    $.ajax({
		url: "https://api.trello.com/1/cards/" + cardNum + "/actions?filter=all&limit=100" + "&" + key,
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
		url: "https://api.trello.com/1/actions/" + actionNum + "&" + key,
		method: 'GET',
	}).done(function(result) {
		console.log(result);
	}).fail(function(err) {
		throw err;
	});
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------


$('#display-cards').on('click', function() { 
	displayCards();
})

function displayCards() {
	console.log(cards);
	console.log(metrics);
}

$('#json-cards').on('click', function() { // make the cards into a JSON
	jsonCards();
})

function jsonCards() {
	var json = JSON.stringify(cards);
	console.log("JSON cards");
	console.log(json);
}

$('#not-get').on('click', function() { 
	notGet();
})

function notGet() {
    fullCards();
	calculateCycle();
}

$('#full-cards').on('click', function() { // get the full cards stored within the js
	fullCards();
})

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// create an onlick function to show the results on the UI
$('#show-output').on('click', function() { 
	showOutput();
})

// once clicked, show some info from the Sprints
function showOutput() {
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

// concert MS to a day, hour, etc object
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

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// D3 IS SCARY AND EXCITING

// an attempt to change the data with a function
$('#new-data').on('click', function() { 
	newData();
})

function newData() {
	var newData = [[5.4,4,6.4,8.6,5.6,5,5,7.6,8,8,6,10.6],[0,0,0.6,0.6,1.6,0.8,0,0,3,0.6,0,1.4],[0,0.6,0.6,0,0,0,0.6,0,0,0,0,0],[3,6.6,1.6,1.6,0.4,0.8,0.6,1,2,2.6,3.4,2],[0,0.6,0.6,0,0,0,0.6,0.6,0,0,0,0],[1.6,2,4,1,0.8,0.4,3.6,0.6,0,0,1,0]];
	data = newData;
	reset();
}

// Base information

var n = 6; // number of layers
var m = 12; // number of samples per layer
var stack = d3.stack();
//var data = d3.range(n).map(function() { return bumpLayer(m, .1); }); // random data for an example (I think)

var data = [[2.7,2,3.2,4.3,2.8,2.5,2.5,3.8,4,4,3,5.3],[0,0,0.3,0.3,0.8,0.4,0,0,1.5,0.3,0,0.7],[0,0.3,0.3,0,0,0,0.3,0,0,0,0,0],[1.5,3.3,0.8,0.8,0.2,0.4,0.3,0.5,1,1.3,1.7,1],[0,0.3,0.3,0,0,0,0.3,0.3,0,0,0,0],[0.8,1,2,0.5,0.4,0.2,1.8,0.3,0,0,0.5,0]];
var dates = ["Aug 30","Sep 13","Sep 27","Oct 11","Oct 25","Nov 8","Nov 22","Dec 6","Dec 20","Jan 3","Jan 17","Jan 31"];

// base D3 magic
	var formatPercent = d3.format(".0%");
	var formatNumber = d3.format("");

	// transpose data
	data = data[0].map(function(col, i) { 
	    return data.map(function(row) { 
	        return row[i] 
	    })
	});

//console.log(data);

var layers = stack.keys(d3.range(n))(data);
var yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1]; }); });
var yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d[1] - d[0]; }); });

var margin = {top: 40, right: 10, bottom: 20, left: 35};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

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
            return y(d[1] / total); }
)        .attr("height", function(d) { 
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
