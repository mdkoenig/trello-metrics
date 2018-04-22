// TO DO - deal with cards that aren't done

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


$('#start').on('click', function() { // on click to get call the getCards function
	getCards();
})

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

	metrics.totalBatches = Math.ceil(trello.cards.length/10,1);
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
			url: "https://api.trello.com/1/batch?urls=" + apiCalls + "&" + key,
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
				cards[id].sprint = i;
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
		url: "https://api.trello.com/1/boards/59b957fde1709e3aae62b5c8/lists?filter=all&" + key,
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
		// console.log(id);
		var sprintNum = cards[id].sprint;
		// console.log("sprintNum: " + sprintNum);

		if(cards[id].sprint == undefined) {
			// console.log("undefined(i/j): " + id + ": " + i + "/" + j);
			metrics.sprints.undefined.cards.push(cards[id]);
			// console.log(cards[id]);
			// console.log("sprintNum: " + sprintNum);
		}
		else {
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
	draw()
	showOutput();
	var $x = $("#display-cards");
	$x.prop("hidden",false);
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
			"<p>Sprint Start: " + metrics.sprints[i].sprintStart + // .toDateString()
			"<br>Sprint End: " + metrics.sprints[i].sprintEnd + // .toDateString()
			"<br>Cards: " + metrics.sprints[i].cards.length + 
			"<br>Average card cycle time: " + days + " days");//metrics.sprints[i].cycleAvg.h/24;// + Math.round((metrics.sprints[i].cycleAvg.h/24),2));
		
		var $output = $("#d3-experiments");
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

function draw() {
	var dataset = [];

	for(let i = 0; i < metrics.sprints.length; i++) {
		var time = Math.round((metrics.sprints[i].cycleInt*100),2);
		time = time/100;
	  var sprint = parseInt(metrics.sprints[i].name.slice(6,8));
		dataset.push([time, sprint]);
	}

	console.log(dataset);

	//Width and height
	var w = (dataset.length * 50) + 50;
	var h = 140;

	//Create SVG element
	var svg = d3.select("#d3-experiments")
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.style("background-color", "#e8e8e8");

	var rect = svg.selectAll("rect")
	    .data(dataset)
	    .enter()
	    .append("rect");

	rect.attr("width", 49)
	   .attr("height", function(d) {
	   		return d[0] * 4;
	   	})
	   	.attr("y", function(d) {
	   		return 120 - (d[0] * 4);
	   	})
	   	.attr("x", function(d, i) {
	   		return (i * 50) +25 ;
	   	})
	   	// .attr("fill", function(d) {return "rgb(0, 0, " + (d[0] * 10) + ")";})
	    .attr("fill", "teal");

	svg.selectAll("text")
		.data(dataset)
		.enter()
		.append("text")
		.text(function(d) {
			return d[0];
		})
		.attr("y", function(d) {
	   		return 120 - (d[0] * 4) - 1;
	   	})
	   	.attr("x", function(d, i) {
	   		return (i * 50) + 50;
	   	})
		.attr("font-family", "sans-serif")
		.attr("font-size", "11px")
		.attr("text-anchor", "middle");

	// var xScale = d3.scaleLinear()
	//   .domain([0, d3.max(dataset, function(d) { return d[1]; })])
	//   .range([0, w]);

	// var yScale = d3.scaleLinear()
	//   .domain([0, 100])
	//   .rangeRound([0, h]);

	var xScale = d3.scaleLinear()
	  .domain([37.5, d3.max(dataset, function(d) { return d[1]; })])
	  .range([0, w - 75]);

	var yScale = d3.scaleLinear()
	  .domain([25, 0])
	  .rangeRound([0, 100]);

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
}