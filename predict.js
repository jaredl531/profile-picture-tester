// Global Variables
var generalTags = [], celebrityTags = [];
var faceAmount = "", focusScore = "", nsfwScore = ""; 

/*
  Purpose: Pass information to other helper functions after a user clicks 'Upload'
  Args:
    value - Actual filename or URL
    source - 'url' or 'file'
*/
function predict_click(value, source) {
  
  // Clear Global Variables
  generalTags, celebrityTags = [];
  faceAmount, focusScore, nsfwScore = "";
  
  // Display image
  if(document.getElementById("img_preview").style.display == "none")
  	document.getElementById("img_preview").style.display = "block";
      
  // Delete old results table, show Loading GIF
  document.getElementById("ResultsTable").innerHTML = "<span style='margin-top:100px'><img src='calculating.gif'/></span>";
  document.getElementById("ResultsTable").style.visibility = "visible";
  document.getElementById("bottomMessage").innerHTML = "";
  
  if(source == "url") {
    document.getElementById("img_preview").src = value;
    sleep(500).then(doPredictions({ url: value }));
    sleep(5500).then(doAnalysis);
  }
    
  else if(source == "file") {
    var preview = document.querySelector("#img_preview");
    var file    = document.querySelector("input[type=file]").files[0];
    var reader  = new FileReader();

    // load local file picture
    reader.addEventListener("load", function () {
      preview.src = reader.result;
      var localBase64 = reader.result.split("base64,")[1];
      sleep(500).then(doPredictions({ base64: localBase64 }));
    	sleep(5500).then(doAnalysis);
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }
  } 
}

/*
  Purpose: Does some v2 predictions based on user-submitted picture
  Args:
    value - Either {url : urlValue} or { base64 : base64Value }
*/
function doPredictions(value) {
	// Need to evaluate several models: 
	// General, NSFW, Faces, Focus, Celebrity
	
	// GENERAL
  app.models.predict(Clarifai.GENERAL_MODEL, value).then(
    
    function(response) {
      console.log(response);
      generalTags = response.rawData.outputs[0].data.concepts;
      console.log("General Tag: " + generalTags[0].name);
    },
    function(err) {
      console.log(err);
    }
  );
  
  // NSFW
  app.models.predict(Clarifai.NSFW_MODEL, value).then(
    
    function(response) {
      console.log(response);
      var nsfwTags = response.rawData.outputs[0].data.concepts;
      if(nsfwTags[0].name == "nsfw")
      	nsfwScore = nsfwTags[0].value;
      else
      	nsfwScore = nsfwTags[1].value;
      console.log("NSFW score: " + nsfwScore);
    },
    function(err) {
      console.log(err);
    }
  );
  
  // FACES
  app.models.predict(Clarifai.FACE_DETECT_MODEL, value).then(
    
    function(response) {
      console.log(response);
      if(response.rawData.outputs[0].data.hasOwnProperty("regions"))
      	faceAmount = response.rawData.outputs[0].data.regions.length;
      else
      	faceAmount = 0;
      console.log("Face count: " + faceAmount);
    },
    function(err) {
      console.log(err);
    }
  );
  
  // FOCUS
  app.models.predict(Clarifai.FOCUS_MODEL, value).then(
    
    function(response) {
      console.log(response);
      focusScore = response.rawData.outputs[0].data.focus.value;
      console.log("Focus score: " + focusScore);
    },
    function(err) {
      console.log(err);
    }
  );
  
  // CELEBRITY
  app.models.predict("e466caa0619f444ab97497640cefc4dc", value).then(
    
    function(response) {
      console.log(response);
      celebrityTags = response.rawData.outputs[0].data.regions;
      console.log("Celebrity Tags: " + celebrityTags);
    },
    function(err) {
      console.log(err);
    }
  );
}

/*
  Purpose: Analyze the values given for three categories: Authenticity, Safety and Clarity
  Args:
  	None
*/
function doAnalysis() {	
	var faceFail = false, textFail = false, nsfwFail = false, nudeOrShirtlessFail = false, focusFail = false, celebFail = false;
	var celebContent = [];
	
	var resultsTable = document.getElementById("ResultsTable");
	
	// CHECK 1: Make sure it has people in it
	if(typeof faceAmount == "undefined") {
		if(!generalHas(["woman"]) && !generalHas(["man"])) {
			faceFail = true;
		}
		else {
			// CHECK 2: Make sure it's not just celebrities
			var celebs = getCelebNames(celebrityTags);
			celebContent = celebs;

			if(celebs.length > 0)
				celebFail = true;
		}
	}
	else {
		if(faceAmount == 0) {
			faceFail = true;
		}
		else if(faceAmount > 0) {
			// CHECK 2: Make sure it's not just celebrities
			var celebs = getCelebNames(celebrityTags);
		
			if(faceAmount == celebs.length) {
				celebFail = true;
				celebContent = celebs;
			}
			
			// And also that the face model didn't mess up by accident
			if(!generalHas(["woman"]) && !generalHas(["man"])) {
				faceFail = true;
			}
		}
	}
	
	// CHECK 3: Make sure there's no text
	if(generalHas(["text"])) {
		textFail = true;
	}
		
	// CHECK 4: Make sure it's safe for work
	if(nsfwScore > 0.80) {
		nsfwFail = true;
	}
	
	if(generalHas(["nude", "shirtless"])) {
		nudeOrShirtlessFail = true;
	}

	// CHECK 5: Make sure it's high quality resolution
	if(typeof focusScore == "undefined" || focusScore < 0.70) {
		focusFail = true;
	}
	
	// Then build Results table
	
	// Remove Loader
	document.getElementById("ResultsTable").innerHTML = "";
	
	// Add Main Authenticity Row first
	var AuthRow1 = resultsTable.insertRow(-1);
	var AuthenticityTitle = AuthRow1.insertCell(0);
	var AuthenticityCheck = AuthRow1.insertCell(1);
	
	AuthenticityTitle.innerHTML = "<span class='categoryTitle'>Authenticity</span>";
	
	if(faceFail || celebFail || textFail)
		AuthenticityCheck.innerHTML = "<img src='ex.png'/>";
	else
		AuthenticityCheck.innerHTML = "<img src='check.png'/>";
	
	// Smaller, detailed Authenticity Rows
	var AuthRow2 = resultsTable.insertRow(-1);
	AuthRow2.insertCell(0).innerHTML = "<span class='subCategory'>Face count: " + faceAmount + "</span>";
	
	var AuthRow3 = resultsTable.insertRow(-1);
	AuthRow3.insertCell(0).innerHTML = "<span class='subCategory'>Just celebs: " + capitalize(celebFail.toString()) + "</span>";

	var AuthRow4 = resultsTable.insertRow(-1);
	
	if(typeof textFail == "undefined")
		AuthRow4.insertCell(0).innerHTML = "<span class='subCategory'>Text: Unsure</span>";
	else
		AuthRow4.insertCell(0).innerHTML = "<span class='subCategory'>Text: " + capitalize(textFail.toString()) + "</span>";
	
	// Add blank rows
	resultsTable.insertRow(-1);
	resultsTable.insertRow(-1);

	// Add Main Safety Row
	var SafetyRow1 = resultsTable.insertRow(-1);
	var SafetyTitle = SafetyRow1.insertCell(0);
	var SafetyCheck = SafetyRow1.insertCell(1);
	
	SafetyTitle.innerHTML = "<span class='categoryTitle'>Appropriateness&nbsp;&nbsp;&nbsp;</span>";
	
	if(nsfwFail || nudeOrShirtlessFail)
		SafetyCheck.innerHTML = "<img src='ex.png'/>";
	else
		SafetyCheck.innerHTML = "<img src='check.png'/>";
	
	// Smaller, detailed Safety Rows
	var SafetyRow2 = resultsTable.insertRow(-1);
	var SafetyRow3 = resultsTable.insertRow(-1);
	SafetyRow2.insertCell(0).innerHTML = "<span class='subCategory'>NSFW Score: " + (nsfwScore*100).toFixed(2) + "%</span>";
	SafetyRow3.insertCell(0).innerHTML = "<span class='subCategory'>Nude/Shirtless: " + capitalize(nudeOrShirtlessFail.toString()) + "</span>";
	
	// Add blank rows
	resultsTable.insertRow(-1);
	resultsTable.insertRow(-1);

	// Add Main Clarity Row first
	var ClarityRow1 = resultsTable.insertRow(-1);
	var ClarityTitle = ClarityRow1.insertCell(0);
	var ClarityCheck = ClarityRow1.insertCell(1);
	
	ClarityTitle.innerHTML = "<span class='categoryTitle'>Clarity</span>";
	
	if(focusFail)
		ClarityCheck.innerHTML = "<img src='ex.png'/>";
	else
		ClarityCheck.innerHTML = "<img src='check.png'/>";
	
	// Smaller, detailed Clarity Row
	var ClarityRow2 = resultsTable.insertRow(-1);
	
	if(typeof focusScore != "undefined")
		ClarityRow2.insertCell(0).innerHTML = "<span class='subCategory'>Focus Score: " + (focusScore*100).toFixed(2) + "%</span>";
	else
		ClarityRow2.insertCell(0).innerHTML = "<span class='subCategory'>Focus Score: Bad</span>";
	
	// Finally, add a message to the bottom
	document.getElementById("bottomMessage").innerHTML = generateRandomMessage(faceFail, textFail, nsfwFail, nudeOrShirtlessFail, focusFail, celebFail, celebContent);
}


/*
  Purpose: Returns a random message for the end user
  Args:
  	faceFail - boolean
  	textFail - boolean
  	nsfwFail - boolean
  	nudeOrShirtlessFail - boolean
  	focusFail - boolean
  	celebFail - boolean
  	celebCount - array of celebrities (if they exist)
*/
function generateRandomMessage(faceFail, textFail, nsfwFail, nudeOrShirtlessFail, focusFail, celebFail, celebContent) {

	var message = "";
	
	// Face check failed
	if(faceFail) {
		var topGeneralTag = generalTags[0].name;
	
		var generalMsgs = 
			[ "A " + topGeneralTag + " picture for your profile?!?!? Come on!",
				"Oh great, a " +  topGeneralTag + ". You can do better than that!",
				"If we wanted to see a " + topGeneralTag + " we could just go to Google..."
			];
			
		message += generalMsgs[(Math.floor((Math.random() * generalMsgs.length)))];
	}
	
	// Text in the picture
	if(textFail) {
		var textMsgs = 
			[ "Text belongs in text messages and memes, am I right?",
				"I see some writing on your photo. It says \"This shouldn't be your profile picture.\"",
				"We're not supposed to read your profile photo!"
			];
			
		if(message != "")
			message += " And " + textMsgs[(Math.floor((Math.random() * textMsgs.length)))].toLowerCase();
			
		else
			message += textMsgs[(Math.floor((Math.random() * textMsgs.length)))];	
	}
	
	// NSFW failed
	if(nsfwFail) {
		var nsfwMsgs = 
			[ "Yeah...a little racy for Facebook's code of conduct don't you think?",
				"It might be better to keep this one offline...",
				"Mark Zuckerberg would DEFINITELY not approve of this."
			];
			
		if(message != "")
			message += " And " + nsfwMsgs[(Math.floor((Math.random() * nsfwMsgs.length)))].toLowerCase();
			
		else
			message += nsfwMsgs[(Math.floor((Math.random() * nsfwMsgs.length)))];
	}
	
	// Nude Or Shirtless from General Model
	if(nudeOrShirtlessFail) {
		var nudeShirtlessMsgs = 
			[ "I'm sure your abs are great, but this is a profile picture!",
				"No shoes. No shirt. No profile picture.",
				"Save this for your upcoming Abercrombie shoot!"
			];
			
		if(message != "")
			message += " And " + nudeShirtlessMsgs[(Math.floor((Math.random() * nudeShirtlessMsgs.length)))].toLowerCase();
			
		else
			message += nudeShirtlessMsgs[(Math.floor((Math.random() * nudeShirtlessMsgs.length)))];
	}
	
	// Focus failed
	if(focusFail) {
		var focusMsgs = 
			[ "Blurrrrrrrr, it's cold in here! There must be some pixels in the atmosphere.",
				"Was this taken with a flip phone?",
				"This should be crisp, like a fall breeze in New York City, or Coco Puffs."
			];
			
		if(message != "")
			message += " And " + focusMsgs[(Math.floor((Math.random() * focusMsgs.length)))].toLowerCase();
			
		else
			message += focusMsgs[(Math.floor((Math.random() * focusMsgs.length)))];
	
	}
	
	// Celebrities exist (only)
	if(celebFail) {
		var celebs = celebContent; // array of celebs
		
		// turn this into a sentence
		var celebSentence = 
			celebs.reduce(
  			function(prev, curr, i){ 
    			return prev + curr + ((i===celebs.length-2) ? ' and ' : ', ')
  			}, '')
			.slice(0, -2);
	
		var celebMsgs = 
			[ "Umm, no....you should not make " + capitalize(celebSentence) + " your profile picture. Unless it's really you " + capitalize(celebSentence.split(" ")[0]) + ".",
				"Whoa....you look JUST  like " + capitalize(celebSentence) + "!",
				"" + capitalize(celebSentence) + " seems better suited for a Favorite Celebrity section on MySpace."
			];
		
		if(message != "")
			message += " And " + celebMsgs[(Math.floor((Math.random() * celebMsgs.length)))].toLowerCase();
			
		else
			message += celebMsgs[(Math.floor((Math.random() * celebMsgs.length)))];
	}
	
	if(!faceFail && !textFail && !nsfwFail && !nudeOrShirtlessFail && !focusFail && !celebFail) {
		var goodMsgs = 
			[ "Lookin' good there! Get that thing on the interwebs.",
				"Now THAT is Facebook quality. Wow.",
				"Booyah!!! A perfect 3 for 3.",
				"Worthy of many successive slow claps, for sure."
			];
	
		message = goodMsgs[(Math.floor((Math.random() * goodMsgs.length)))];
	}
	
	return message;
}

/*
  Purpose: Determine if the General Model a certain tag or tags
  Args:
  	theseTags - an array of tags to check for
*/ 
function generalHas(theseTags) {
	for(var i=0; i < generalTags.length; i++) {
		if(theseTags.includes(generalTags[i].name))
			return true;
	}
	
	return false;
}

/*
  Purpose: Returns an array of celebrity names in the picture
  Args:
  	tags - the Celebrity Model regions array
*/
function getCelebNames(regions) {
	var celebCount = 0;
	var celebs = [];

	if(regions) {
		for(var i = 0; i < regions.length; i++) {
			tagArray = regions[i].data.face.identity.concepts;
			if(tagArray[0].value > 0.10)
				celebs.push(tagArray[0].name);
		}
	}
	return celebs;
}

/*
  Purpose: Helper function for sleeping
  Args:
  	tags - the amount of time in milliseconds to sleep
*/ 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/*
  Purpose: Capitalizes words in a String
  Args:
  	s - A String
*/ 
function capitalize(s){
    return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
};