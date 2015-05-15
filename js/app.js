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

function bdayAge(contact) {
  var birthYear = contact.bday.getFullYear();
  return (new Date).getFullYear() - birthYear;
}

function processContacts(bdayContacts) {
  bdayContacts.sort(bdaySort)
  console.log(bdayContacts)
  
  /* Display */
  bdayContacts.forEach(function (contact, index) {
    var bday_list = document.getElementById('bday_list_m' + contact.bday.getMonth())
    var li = document.createElement('li');
    li.innerHTML = "<p><strong class='day'>" + contact.bday.getDate() + "</strong>" + " " +
                   "<span class='name'>" + contact.name + "</span>" + " " +
                   "<em class='age'>(" + bdayAge(contact) + ")</em>" +
                   "</p>";
    bday_list.appendChild(li);
  });
}

var shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function highlightCurrentDate() {
  /*Current month*/
  var today = new Date()
  var bday_list = document.getElementById('bday_list_m' + today.getMonth());
  bday_list.classList.add('current-month');
  var header = document.getElementById('head_m' + today.getMonth());
  header.classList.add('current-month');
  
  /*Current Day*/
  var days = bday_list.getElementsByClassName('day');
  
  var i;
  for (i = 0; i < days.length; i++) {
    /*check the day*/
    if (days[i].textContent == today.getDate()) {
      days[i].classList.add('current-day');
    }
  }
}

function start() {
  /*Main function*/
  
  // Browse the contacts
  var allContacts = navigator.mozContacts.getAll();
  console.log(allContacts)
  var bdayContacts = [];

  allContacts.onsuccess = function(event) {
    var cursor = event.target;
    
    if (cursor.result) {
      var contact = cursor.result;
      if (contact.bday) {
        //console.log(contact)
        bdayContacts.push({
          'name': contact.name[0],
          'bday': contact.bday
        });
      }
      cursor.continue();
    } else {
      console.log("Browsing contacts done");
      processContacts(bdayContacts);
        
      highlightCurrentDate();
    }
  };
  
  allContacts.onerror = function(event) {
    alert('Could not browse contacts. Loading fake contacts')
    bdayContacts = [
        {
          'name': 'Alphonse',
          'bday': new Date(1950, 1, 3)
        },
        {
          'name': 'Jules',
          'bday': new Date(1980, 1, 3)
        },
        {
          'name': 'Sophie',
          'bday': new Date(1990, 1, 13)
        }
      ];
  processContacts(bdayContacts);
  };
  
}


// Launch the code once the document has been loaded and parsed
window.addEventListener('DOMContentLoaded', function() {
  var translate = navigator.mozL10n.get;
  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(start);
});
