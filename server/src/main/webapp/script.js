var contacts = [];
google.load("gdata", "1.x");

function refreshContacts() {
	var scope = 'https://www.google.com/m8/feeds';
	var status = google.accounts.user.getStatus(scope);

	if (status == google.accounts.AuthSubStatus.LOGGED_OUT)
		google.accounts.user.login(scope);

	var contactsService =
		new google.gdata.contacts.ContactsService('GoogleInc-jsguide-1.0');
	var feedUri = 'https://www.google.com/m8/feeds/contacts/default/full';
	var query = new google.gdata.contacts.ContactQuery(feedUri);
	query.setMaxResults(1000);

	var handleError = function(error) {
		console.error(error);
	}

	contactsService.getContactFeed(query, function(result) {
	var entries = result.feed.entry;

		for (var i = 0; i < entries.length; i++) {
			var contactEntry = entries[i];

			var phoneNumbers = contactEntry.getPhoneNumbers();
			var phoneNumber = null;

			for (var j = 0; j < phoneNumbers.length; j++)
				if (phoneNumbers[j].getRel() == google.gdata.PhoneNumber.REL_MOBILE)
					phoneNumber = phoneNumbers[j].getValue();

			if (phoneNumber != null)
				contacts.push({
					label: contactEntry.getTitle().getText(),
					value: phoneNumber
				});

		}

		window.localStorage.setItem("googleContacts", JSON.stringify(contacts));
		window.location.reload(true);
	}, handleError);
}

function getName(phoneNumber) {
	for (var i = 0; i < contacts.length; i++) {
		var n = contacts[i].value;
		var offset = n.length - phoneNumber.length;

		n = n.substring(offset, offset + phoneNumber.length);

		if (n == phoneNumber)
			return contacts[i].label;
	}

	return phoneNumber;
}

$(document).ready(function() {
	var storage = window.localStorage;

	if (storage["googleContacts"]) {
		contacts = JSON.parse(storage["googleContacts"]);
	} else {
		refreshContacts();
	}

	$("#address").autocomplete({
		source: contacts,
	});

	var formatDate = function(d) {
		var dd = function(x) { return x < 10 ? '0' + x : x; };
		return d.getFullYear() + "-" + dd(d.getMonth() + 1) + "-" + dd(d.getDate()) +
			" " + dd(d.getHours()) + ":" + dd(d.getMinutes()) + ":" + dd(d.getSeconds());
	};
	
	$('textarea').keyup(function() {
		$('span.count').html(this.value.length);
	});
	$('#hidemessages').click(function() {
		var text = "hide";
		var visibility = "visible";

		if (this.innerHTML == text) {
		       text = "show";
		       visibility = "hidden";
		}

		this.innerHTML = text;
		$('#messages').css('visibility', visibility);
	});
	function fetchSms(lastid) {
		
		$.getJSON('msg/list?lastid=' + lastid, function(sms) {
		
			var init = lastid == 0;
			
			for(var i = sms.length - 1; i >= 0; i--) {
				var timestamp = new Date(+sms[i].timestamp);
				$('#messages tbody').prepend('<tr' + (init ? '>' : ' class="unread">') +
					'<td>' + (sms[i].incoming ? 'i' : 'o') + '</td>' +
					'<td>' + getName(sms[i].address) + '</td>' +
					'<td>' + sms[i].body + '</td>' +
					'<td><nobr>' + formatDate(timestamp) + '</nobr></td></tr>');
				lastid = sms[i].id > lastid ? sms[i].id : lastid; 
			}
			if(!init && sms.length > 0) {
				document.title = 'sms (' + $('.unread').length + ')';
			}
			
			window.setTimeout(function() { fetchSms(lastid); }, 2000);
		});
	};
	
	$('body').click(function() {
		document.title = 'sms';
		$('.unread').removeClass('unread');
	});
	
	fetchSms(0);
});
