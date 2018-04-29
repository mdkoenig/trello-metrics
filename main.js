// TO DO - deal with cards that aren't done

// GLOBAL VARIABLES

// esbalish an object for the cards that exist on trello
var cards = {"index":[]};

// establish and object of the project-wide metrics
var metrics = {totalBatches: 0, currentBatch: 0};

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define the default values if the user wants to use the key.js files

$("#default-options").on("click", function() {
	defaultOptions();
})

// use the default options from key.js
function defaultOptions() {
	// get the key and token from the key.js file if they exist. 
	try {
		$("#board-val").val(board1);
		$("#key-val").val(key);
		$("#token-val").val(token);
		$("#start-date").val(startDate);
		$("#first-sprint").val(firstSprint1);
		$("#data-type").val("real");
	}

	// if they don't exist, then prompt the user to enter them
	catch(err) {
		$("#options").prepend("<span class='important'>Please enter values</span><br>");
		console.log("no values");
	}
}

$("#other-options").on("click", function() {
	otherOptions();
})

// use the default options from key.js
function otherOptions() {
	// get the key and token from the key.js file if they exist. 
	try {
		$("#board-val").val(board2);
		$("#key-val").val(key);
		$("#token-val").val(token);
		$("#start-date").val(startDate);
		$("#first-sprint").val(firstSprint2);
		$("#data-type").val("real");
	}

	// if they don't exist, then prompt the user to enter them
	catch(err) {
		$("#options").prepend("<span class='important'>Please enter values</span><br>");
		console.log("no values");
	}
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// USER INPUTED INFORMATION

// add the datepicker function to the id of "start-date"
$( function() {
	// $("#start-date").val("08/30/17")
	$("#start-date").datepicker();
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// USER ACTIONS

$('#start').on('click', function() { 
	start();
})

// get started with either real or mock data
function start() {
	var dataType = $("#data-type").val();

	keyToken = "key=" + $("#key-val").val() + "&token=" + $("#token-val").val();
	board = $("#board-val").val();
	firstSprint = parseInt($("#first-sprint").val());

	$("#start").attr("hidden", true);
	$("#reset").attr("hidden", false);

	if(dataType === "real") {
		getCards();
	}
	else if(dataType === "mock") {
		notGet();
	}
	else {
		console.log("Problem");
	}
}

$("#options-check").change(function() {
	optionsCheck();
})

function optionsCheck() {
	var isChecked = $("#options-check").prop("checked");
	if(isChecked === true) 	{
		console.log("Show options");
		$("#options").css("display", "block");
	}
	else {
		console.log("Hide options");
		$("#options").css("display", "none");
	}
}

$('#reset').on('click', function() { 
	reset();
})

// reset the entire page
function reset() {
	// esbalish an object for the cards that exist on trello
	cards = {"index":[]};

	// establish and object of the project-wide metrics
	metrics = {totalBatches: 0, currentBatch: 0};

	var del = $("#output");
	del.remove();

	$("#options-check").prop("checked", true);
	optionsCheck();
	$("#start").attr("hidden", false);
	$("#reset").attr("hidden", true);
	$("#board-val").val("");
	$("#key-val").val("");
	$("#token-val").val("");
	$("#start-date").val("");
	$("#first-sprint").val("");
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------

// get the cards from the Trello API 
function getCards() {
	console.log("getCards - 1");
	$(".loader").css("display","block");

	$.ajax({
		url: "https://api.trello.com/1/search?query=" + board + "&idBoards=mine&modelTypes=cards&board_fields=name%2CidOrganization&boards_limit=10&card_fields=all&cards_limit=1000&cards_page=0&card_list=true&card_attachments=false&organization_fields=name%2CdisplayName&organizations_limit=10&member_fields=avatarHash%2CfullName%2Cinitials%2Cusername%2Cconfirmed&members_limit=10&" + keyToken,
		method: 'GET',
	}).done(function(result) {
		createCards(result);	// send results to the createCards function to populate the cards object with certain information from the results
	}).fail(function(err) {
		throw err;
	});
}

// create all the cards from the board in the cards object
function createCards(trello) {
	console.log("createCards - 2");

	metrics.totalBatches = Math.ceil(trello.cards.length/10,1); // figure out how many batches are needed to get all the details

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
			if(batchCount === 0) { // if there's only one card in the batch %2 needs to be removed from the api call to make it work
				apiCalls = apiCalls + "%2Fcards%2F" + cards.index[i][0] + "%2Factions%3Ffilter%3Dall%26limit%3D100"; // add the next api call to the batch
				cardsCalled.push(cards.index[i][0]);

				getActions(apiCalls, status);

				batchCount = 0; // reset batchCount for next batch of apis
				apiCalls = ""; // reset api list for next batch of apis
			}
			
			else { // otherwise, whenever the index is done or there are 10 cards in a batch, make a call and reset everything else
				apiCalls = apiCalls + "%2C%2Fcards%2F" + cards.index[i][0] + "%2Factions%3Ffilter%3Dall%26limit%3D100"; // add the next api call to the batch
				cardsCalled.push(cards.index[i][0]);

				getActions(apiCalls, status);

				batchCount = 0; // reset batchCount for next batch of apis
				apiCalls = ""; // reset api list for next batch of apis
			}
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
			url: "https://api.trello.com/1/batch?urls=" + apiCalls + "&" + keyToken,
			method: 'GET',
		}).done(function(result) {
		}).fail(function(err) {
			throw err;
		})
	).then(function(data, textStatus, jqXHR) {
		logActions(data);
		// metrics.currentBatch = metrics.currentBatch + 1;
		// if(metrics.currentBatch === metrics.totalBatches) {
		// 	calculateCycle();
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

				var lists = {"listId": actionCard.listBefore, "listAfter": actionCard.listAfter, "date": actionCard.date,"nameBefore": actionCard.nameBefore, "nameAfter":actionCard.nameAfter};
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

	// console.log(metrics.currentBatch + " : " + metrics.totalBatches);

	metrics.currentBatch = metrics.currentBatch + 1;
	if(metrics.currentBatch === metrics.totalBatches) {
		calculateCycle();
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

		if(results[j].data.listAfter.id === "59ba90e88560a24c20e4a7a3" || results[j].data.listAfter.id === "59cbcf4fcf8d0dc60028b1f2" || results[j].data.listAfter.id === "59f0d42be9f96ec56fcbc289" ) {
			cards[this.id].endDate = new Date(results[j].date);
		}
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
		// console.log("Cycle: " + id + " is " + cycle);
		if(cycle >= 0) {
			cards[id].cycleMS = cycle;//convertMS(cycle);
			cards[id].cycleDays = convertMS(cycle);
		}
		else {
			cards[id].cycleMS = 0;
			cards[id].cycleDays = 0;
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
		startDate = new Date(startDate);
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
	console.log("sprints - 8");

	var projectTime = convertMS(projectEnd-projectStart); // calculate the total time of the project
	var days = projectTime.d; // find out the number of days for the project
	var sprints = Math.floor(days/length); // find out the number of sprints within the project
	
	metrics.sprints = []; // create an array within the metrics object for the sprints
	
	for(let i = 0; i < sprints; i++) {
		// var name = "sprint" + i; // create the sprint name
		metrics.sprints[i] = {}; // create the sprint object within the sprints array
		
		var day = projectStart.getDate(); // getting the day the project starts
		
		var sprintStart = new Date(projectStart); // establish the start of the new sprint (to be changed later)
		sprintStart.setDate(day + (length * i)); // set the start of the sprint as the start of the project plus the length of the sprint times the sprint number
		
		var sprintEnd = new Date(sprintStart); // create new date object for the sprint end equal to the start of the sprint
		sprintEnd.setDate(sprintStart.getDate()+length); // set it as the start plus the length of the sprint
		
		metrics.sprints[i].sprintStart = sprintStart; // set the start of the sprint in the metrics object
		metrics.sprints[i].sprintEnd = sprintEnd; // set the end of the sprint in the metrics object

		metrics.sprints[i].name = "Sprint" + (i + firstSprint);

		metrics.sprints[i].lists = {};
	}
	metrics.sprints.undefined = {"cards": []};

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
				cards[id].sprint = "sprint" + (i + firstSprint); // herehere
			}
			else if (i === metrics.sprints.length-1 && cards[id].sprint === undefined) {
				cards[id].sprint = undefined;
			}
			else {
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
	calculateLists();
}

// create an onlick function calculate lists
$('#calculate-lists').on('click', function() { 
	calculateLists();
})


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
    getLists()
}

// get the lists from the board
function getLists() {
    console.log("getLists -11");
    
    $.ajax({
		url: "https://api.trello.com/1/boards/" + board + "/lists?filter=all&" + keyToken,
		method: 'GET',
	}).done(function(result) {
		// console.log(result);
		logLists(result);
	}).fail(function(err) {
		throw err;
	});
}

function logLists(listResults) {
	console.log("logLists - 12");
	for(i = 0; i < listResults.length; i++) {
		for(j = 0; j < metrics.sprints.length; j++) {
			var listId = listResults[i].id;
			var listName = listResults[i].name;
			// console.log(listName);
			var listPos = listResults[i].pos;
			metrics.sprints[j].lists[listId] = {"listName": listName, "listPos": listPos, "cardCount": 0, "listMS": 0};
		}
	}
	listCycle();
}

function listCycle() {
	console.log("listCylce - 13");

	for(i = 0; i < cards.index.length; i++) { 
		var id = cards.index[i][0];

		if(cards[id].sprint == undefined) {
			// console.log("undefined(i/j): " + id + ": " + i + "/" + j);
			metrics.sprints.undefined.cards.push(cards[id]);
			// console.log(cards[id]);
			// console.log("sprintNum: " + sprintNum);
		}
		else {
			var sprintNum = parseInt(cards[id].sprint.slice(6,8)) - firstSprint;

			for(j = cards[id].lists.length-1; j > 0; j--) {
				
				var list = cards[id].lists[j].listId;
				metrics.sprints[sprintNum].lists[list].listMS = metrics.sprints[sprintNum].lists[list].listMS + cards[id].lists[j].cycleMs;
				// console.log(i,j);
				metrics.sprints[sprintNum].lists[list].cardCount += 1;
			}
		}
	}
	revealGraph();
}

function revealGraph() {
	$(".loader").css("display","none");
	draw()
	showOutput();
	var $x = $("#display-cards");
	$x.prop("hidden",false);
	$("#options-check").prop("checked", false);
	optionsCheck();
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
		url: "https://api.trello.com/1/batch?urls=" + batchVal + "&" + keyToken,
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
		url: "https://api.trello.com/1/cards/" + cardNum + "/actions?filter=all&limit=100" + "&" + keyToken,
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
		url: "https://api.trello.com/1/actions/" + actionNum + "&" + keyToken,
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
	var jsonCards = JSON.stringify(cards);
	console.log("JSON cards");
	console.log(jsonCards);

	var jsonMetrics = JSON.stringify(metrics);
	console.log("JSON metrics");
	console.log(jsonMetrics);
}

$('#not-get').on('click', function() { 
	notGet();
})

function notGet() {
    fullCards();
	displayCards();
	draw();
	showOutput();
	$("#options-check").prop("checked", false);
	optionsCheck();
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
	var $experiments = $("#output");
	$experiments.append($("<br><br><table width='50%' id='summary'><tr><th>Sprint</th><th>Cards</th><th>Cycle Time</th></tr>"));
	for(i = 0; i < metrics.sprints.length; i++) {
		var days = metrics.sprints[i].cycleAvg.d;
		days = days + Math.round(metrics.sprints[i].cycleAvg.h/24*100,4)/100;

		// var $rowOfStuff = $("<tr><td>").html(metrics.sprints[i].name + "</td></tr>");
		var $rowOfStuff = $("<tr><td>" + metrics.sprints[i].name + "</td><td>" + metrics.sprints[i].cards.length + "</td><td>" + days + " days</td></tr>");

		// var $sprintHeader = $("<h3>").html(metrics.sprints[i].name + "</h3>");
		// var $sprintData = (
		// 	"<p>Sprint Start: " + metrics.sprints[i].sprintStart + // .toDateString()
		// 	"<br>Sprint End: " + metrics.sprints[i].sprintEnd + // .toDateString()
		// 	"<br>Cards: " + metrics.sprints[i].cards.length + 
		// 	"<br>Average card cycle time: " + days + " days");//metrics.sprints[i].cycleAvg.h/24;// + Math.round((metrics.sprints[i].cycleAvg.h/24),2));
		
		var $output = $("#summary");
		// $output.append($sprintHeader);
		// $output.append($sprintData);

		$output.append($rowOfStuff);
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

function draw() {
	var dataset = [];

	console.log(dataset);

	for(let i = 0; i < metrics.sprints.length; i++) {
		var time = Math.round((metrics.sprints[i].cycleInt*100),2);
		time = time/100;
	  var sprint = parseInt(metrics.sprints[i].name.slice(6,8));
		dataset.push([time, sprint]);
	}

	var yMax = d3.max(dataset, function(d) { return d[0] });
	var xMin = d3.min(dataset, function(d) { return d[1] });
	var xMax = d3.max(dataset, function(d) { return d[1] });

	console.log(xMin, xMax);

	//Width and height
	var w = (dataset.length * 50) + 50;
	var h = 140;

	//Create div for output
	var z = $("#d3-experiments");
	z.append("<div id='output'></div>");

	//Create SVG element
	var svg = d3.select("#output")
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.style("background-color", "#e8e8e8");

	var xScale = d3.scaleLinear()
	  .domain([xMin-0.5, xMax])
	  .range([0, w - 75]);

	var yScale = d3.scaleLinear()
	  .domain([yMax, 0])
	  .rangeRound([0, 100]); //

	var rect = svg.selectAll("rect")
	    .data(dataset)
	    .enter()
	    .append("rect");

	rect.attr("width", 49)
	   .attr("height", function(d) { return 100-yScale(d[0]); })
	   	.attr("y", function(d) { return 20 + yScale(d[0]); })
	   	.attr("x", function(d, i) { return (i * 50) +25 ; })
	   	// .attr("fill", function(d) {return "rgb(0, 0, " + (d[0] * 10) + ")";})
	    .attr("fill", "#2D2E75")
	    .attr("title", function(d) { return d[0] })
	    .attr("class", "dialog");

	svg.selectAll("text")
		.data(dataset)
		.enter()
		.append("text")
		.text(function(d) { return d[0]; })
		.attr("y", function(d) { return 20 + (yScale(d[0])) - 1; })
	   	.attr("x", function(d, i) { return (i * 50) + 50; })
		.attr("font-family", "sans-serif")
		.attr("font-size", "11px")
		.attr("text-anchor", "middle");

	// Add the x Axis
	svg.append("g")
	  .attr("transform", "translate(25,120)")
	  .attr("class", "axis")
	  .call(d3.axisBottom(xScale)
	  	.ticks(dataset.length));

	svg.append("g")
	  .attr("transform", "translate(25, 20)")
	  .call(d3.axisLeft(yScale)
	    .ticks(5));

	// $('.dialog').on('click', function() { 
	// 	$(".dialog").dialog();
	// })
}

