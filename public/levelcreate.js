var currentColor = 1;
function updateStuff() {
	document.getElementById('colorThing').style.backgroundColor = [
		'white',
		'black',
		'blue',
		'red',
		'green',
		'brown',
		'pink','gold'
	][currentColor];
}
var socket = io();
socket.on('usedUrl', () => {
	alert('That level name is in use.');
});
function getLevel() {
	socket.emit('get_level', document.f.name.value);
	document.f.url.value = document.f.name.value;
	document.f.pw.value = '';
}
socket.on('level_data', (data,color,grav,side) => {
	setEditor(dataToArray(data));
  document.getElementById('gravity').value=grav;
  if(color&&color!="__NONE__"){
    document.f.randomcolor.checked=true;
    document.f.color.style.display='inline';
    document.f.color.value=color;
  }
  else{
    document.f.randomcolor.checked=false;
    document.f.color.style.display='none';
    document.f.color.value="#000000";
  }
  document.getElementById('side').value=side;
});
socket.on('not_exist', () => {
	alert('That level does not exist.');
});
function submitData() {
	socket.emit(
		'start_porting',
		document.f.url.value,
		document.f.pw.value,
		document.getElementById('rc').checked ? document.f.color.value : '__NONE__',
		document.f.gravity.value,
		document.getElementById('side').value
	);
	for (i = 0; i < document.f.code.value.split(',').length; i++) {
		socket.emit('next_line', document.f.code.value.split(',')[i]);
	}
	socket.emit('end_porting');
	setTimeout(() => {
		window.open('/levels/' + document.f.url.value);
	}, 2000);
}
function dataToArray(data) {
	newArray = [];
	allStuff = data.split(',');
	for (i in allStuff) {
		newArray.push([]);
		for (e in allStuff[i]) {
			newArray[i].push(parseInt(allStuff[i][e]));
		}
	}
	return newArray;
}
function setEditor(array) {
	for (i = 0; i < 50; i++) {
		for (e = 0; e < 50; e++) {
			document.getElementById(i + ',' + e).style.backgroundColor = [
				'white',
				'black',
				'blue',
				'red',
				'green',
				'brown',
				'pink','gold'
			][array[i][e]];
		}
	}
	document.getElementById('25,25').style.backgroundColor = 'gray';
}
function updateData() {
	document.f.code.value = toLevel();
	document.f.code.select();
	document.execCommand('copy');
}
function updateColor(id) {
	toUpdate = document.getElementById(id);
	if (
		currentColor ==
		{
			white: 0,
			gray: -1,
			black: 1,
			blue: 2,
			red: 3,
			green: 4,
			brown: 5,
			pink: 6
		}[toUpdate.style.backgroundColor]
	) {
		toUpdate.style.backgroundColor = 'white';
	} else if(toUpdate.style.backgroundColor!="gray") {
		toUpdate.style.backgroundColor = [
			'white',
			'black',
			'blue',
			'red',
			'green',
			'brown',
			'pink','gold'
		][currentColor];
	}
}
table = document.createElement('table');
table.id = 'grid';
table.border = '1';
for (i = 0; i < 50; i++) {
	theThing = document.createElement('tr');
	for (e = 0; e < 50; e++) {
		button = document.createElement('td');
		button.id = i + ',' + e;
		button.setAttribute('onclick', "updateColor('" + i + ',' + e + "')");
		button.style.width = '15px';
		button.style.height = '15px';
		button.style.borderColor = 'black';
		if (i == 25 && e == 25) {
			button.style.backgroundColor = 'gray';
		} else button.style.backgroundColor = 'white';
		theThing.appendChild(button);
	}
	table.appendChild(theThing);
}
document.body.appendChild(table);
function toLevel() {
	theString = '';
	for (i = 0; i < 50; i++) {
		toAdd = '';
		for (e = 0; e < 50; e++) {
			toAdd += {
				white: 0,
				gray: 0,
				black: 1,
				blue: 2,
				red: 3,
				green: 4,
				brown: 5,
				pink: 6,gold:7
			}[document.getElementById(i + ',' + e).style.backgroundColor];
		}
		theString += toAdd;
		theString += ',';
	}
	theString = theString.substr(0, theString.length - 1);
	return theString;
}
