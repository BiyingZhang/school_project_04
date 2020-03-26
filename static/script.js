var CATEGORIES;
var UNCATEGORIZED_AMOUNT;

window.addEventListener('load', (event) => {
	pullCategories();
});

function makeRec(method, target, retCode, handlerAction, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, handlerAction);
	httpRequest.open(method, target);

	if (data) {
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	console.log("making handler!");
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("received response text:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}

function pullCategories() {
	makeRec("GET", "/cats", 200, populateCat);
	// pullPurchases();
}

function pullPurchases() {
	makeRec("GET", "/purchases", 200, populatePur);
}

function populateCat(responseText) {
	console.log("repopulating category!");
	var categories = JSON.parse(responseText);
	CATEGORIES = categories;
	var catDiv = document.getElementById("category");
	catDiv.innerHTML = "";

	for (var i = 0; i < categories.length; i ++) {
		//create element and append
		let category = categories[i];

		let hr = document.createElement("hr");
		let br = document.createElement("br");
		let div = document.createElement("div");
		div.setAttribute("class", "container");
		div.setAttribute("id", category.name);

		let cName = document.createElement("h2");
		let cLim = document.createElement("h4");

		cName.style.display = "inline";
		cLim.style.display = "inline";

		cName.textContent = "Category: " + category.name;
		cLim.textContent = "Limit: $" + category.limit;

		let del = document.createElement("button");
		del.textContent = "Delete";
		del.setAttribute("id", "delCat" + category.name);
		del.style.marginTop = "20px";
		del.addEventListener("click",  function() { deleteCat(category.name); });

		let table = document.createElement("table");
		table.setAttribute("id", "table" + category.name);

		let report = document.createElement("h4");
		report.setAttribute("id", "report" + category.name);
		report.setAttribute("class", "report");

		div.appendChild(cName);
		div.appendChild(cLim);

		catDiv.appendChild(div);
		catDiv.appendChild(table);
		catDiv.appendChild(report);
		catDiv.appendChild(del);
		catDiv.appendChild(br);
		catDiv.appendChild(hr);
	}
	pullPurchases();
}

function populatePur(responseText) {
	console.log("repopulating purchases!");
	UNCATEGORIZED_AMOUNT = 0;
	let allCats = CATEGORIES.map( c => c.name);
	let spent = {};
	allCats.forEach(c => {
		spent[c] = 0;
	});

	//clear existing tables
	for (var j = 0; j < allCats.length; j++) {
		document.getElementById("table" + allCats[j]).innerHTML = "";
	}
	document.getElementById("tableuncategorized").innerHTML = "";

	let purchases = JSON.parse(responseText);
	let purDiv = document.createElement("table");

	for (var i = 0; i < purchases.length; i++) {
		purchase = purchases[i];
		if(allCats.includes(purchase.category)) {
			if (document.getElementById("table" + purchase.category).innerHTML === "") {
				createTableEntry(purchase.category, "Amount", "Date", "Purchase Detail");
			}
			createTableEntry(purchase.category, purchase.amount.replace(/\.0+$/,''), purchase.date, purchase.what);
			var d = new Date();
			if (d.getMonth() + 1 === parseInt(purchase.date.substring(5,7))) {
				spent[purchase.category] += parseFloat(purchase.amount);
			}
		} else {
			UNCATEGORIZED_AMOUNT += parseFloat(purchase.amount);
			if (document.getElementById("tableuncategorized").innerHTML === "") {
				createTableEntry("uncategorized", "Amount", "Date", "Purchase Detail");
			}
			createTableEntry("uncategorized", purchase.amount.replace(/\.0+$/,''), purchase.date, purchase.what);
		}
	}
	for (let key in spent){
		let msg = `You have spent $${spent[key].toFixed(2)} on ${key} this month.`;
		let lim = getLimit(key);
		if (spent[key].toFixed(2) <= lim) {
			msg += ` You have $${(lim - spent[key]).toFixed(2)} left to spend.`;
		} else {
			msg += ` You have spent $${(spent[key] - lim).toFixed(2)} over the limit.`;
		}
		let reportDiv = document.getElementById("report" + key);
		reportDiv.textContent = msg;
	}
	document.getElementById("uncatamount").textContent = "Amount spent: $" + UNCATEGORIZED_AMOUNT.toFixed(2);
}
function getLimit(category) {
	for (let i = 0; i < CATEGORIES.length; i++) {
		if (category == CATEGORIES[i].name) return CATEGORIES[i].limit;
	}
	return -1;
}


function createTableEntry(category, amount, date, what) {
	let table = document.getElementById("table" + category);
	let tr = document.createElement("tr");

	let tdAmount = document.createElement("td");
	let tdDate = document.createElement("td");
	let tdWhat = document.createElement("td");

	if (amount === "Amount") {
		tr.setAttribute("class", "label");
		tdAmount.textContent = amount;
	} else {
		tdAmount.textContent = "$" + amount;
	}
	tdDate.textContent = date;
	tdWhat.textContent = what;
	tdWhat.setAttribute("class", "what");

	tr.appendChild(tdAmount);
	tr.appendChild(tdDate);
	tr.appendChild(tdWhat);

	table.appendChild(tr);
}

function sendCategory() {
	let newCategory = document.getElementById('newCat').value.trim();
	let newLimit = document.getElementById('newLim').value.trim();
	let message = "";
	if (newCategory === "") message += "Category cannot be empty!";
	if (!newLimit.match(/^\d+([.]\d{0,2})?$/)) message += " Limit is invalid!";
	if (message !== "") {
		alert(message);
	} else {
		data = "name=" + newCategory + "&limit=" + newLimit;
		makeRec("POST", "/cats", 200, pullCategories, data);
	}
	document.getElementById('newCat').value = "";
	document.getElementById('newLim').value = "";
}

function deleteCat(cat_name) {
	makeRec("DELETE", "/cats/" + cat_name, 200, pullCategories);
}

function sendPurchase() {
	let amount = document.getElementById('newPurAmount').value.trim().replace(/\.0+$/,'');
	let date = document.getElementById('newPurDate').value;
	let what = document.getElementById('newPurWhat').value.trim();
	let category = document.getElementById('newPurCat').value.trim();

	let message = "";
	if (!amount.match(/^\d+([.]\d{0,2})?$/)) message += "Amount is invalid!";
	if (what === "") message += " Missing purchase details";

	if (message !== "") {
		alert(message);
	} else {
		data = `amount=${amount}&date=${date}&what=${what}&category=${category}`;
		makeRec("PUT", "/purchases", 200, pullPurchases, data);

		document.getElementById('newPurAmount').value = "";
		document.getElementById('newPurDate').value = "";
		document.getElementById('newPurWhat').value = "";
		document.getElementById('newPurCat').value = "";
	}
}
