/* Code for the birthday app*/

'use strict';

/* Helpers */

function dayOfYear(date) {
  /*Compute an approximation of dayOfYear, for sorting purpose*/
  return date.getDate() + 31*date.getMonth()
}

function bdaySort(contact1, contact2) {
  /* sort contacts by birthday date (month, day), but not year*/
  var doy1 = dayOfYear(contact1.bday);
  var doy2 = dayOfYear(contact2.bday);
  return doy1 - doy2
}

function processContacts(bdayContacts) {
  bdayContacts.sort(bdaySort)
  
  console.log(bdayContacts)
  
  /* Display */
  bdayContacts.forEach(function (contact, index) {
    var bday_list = document.getElementById('bday_list_m' + contact.bday.getMonth())
    var li = document.createElement('li');
    li.innerHTML = "<strong class='day'>" + contact.bday.getDate() + "</strong>" + " " +
                   "<span class='name'>" + contact.name + "</span>";
    bday_list.appendChild(li);
  });

}


function start() {
  /*Main function*/
  
  // Browse the contacts
  var allContacts = navigator.mozContacts.getAll();
  var bdayContacts = [];

  allContacts.onsuccess = function(event) {
    var cursor = event.target;
    
    if (cursor.result) {
      var contact = cursor.result;
      if (contact.bday) {
        bdayContacts.push({
          'name': contact.name[0],
          'bday': contact.bday
        });
      }
      cursor.continue();
    } else {
      console.log("Browsing contacts done");
      processContacts(bdayContacts);
    }
  };
}


// Launch the code once the document has been loaded and parsed
window.addEventListener('DOMContentLoaded', function() {
  var translate = navigator.mozL10n.get;
  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(start);
});
