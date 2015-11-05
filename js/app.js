/*global window, console, document, navigator, MozActivity, Notification*/

(function () {
    'use strict';

    /* Settings */

    // The default time of the alarm
    var alarmTime = [0, 0];

    /* Helpers */

    /**
     * Compute an approximation of dayOfYear, for sorting purpose
     * @param  {Date} date
     * @return {Number}
     */
    function dayOfYear(date) {
        return date.getDate() + 31 * date.getMonth();
    }

    /**
     * Sort contacts by birthday date (month, day), but not year
     * @param  {Object} contact1
     * @param  {Object} contact2
     * @return {Number}
     */
    function bdaySort(contact1, contact2) {
        return dayOfYear(contact1.bday) - dayOfYear(contact2.bday);
    }

    /**
     * Find the age of the contact
     * @param  {Object} contact
     * @return {Number}
     */
    function bdayAge(contact) {
        if (!(contact.bday instanceof Date)) {
            contact.bday = new Date(contact.bday);
        }

        var birthYear = contact.bday.getFullYear();

        return ((new Date()).getFullYear() - birthYear);
    }

    /**
     * Open the contact according to its ID
     * @param  {String} cid
     */
    function openContact(cid) {
        var activity = new MozActivity({
            name: 'open',
            data: {
                type: 'webcontacts/contact',
                params: {
                    id: cid
                }
            }
        });

        activity.onerror = function () {
            console.log('Error while fetching the contact list.');
        };
    }

    /**
     * Add an alarm for a contact birthday
     * @param {Object} contact
     */
    function addAlarm(contact) {
        var today = new Date();
        var alarmDate = new Date();

        if (
            contact.bday.getMonth() <= today.getMonth()
            && contact.bday.getDate() <= today.getDate()
        ) {
            alarmDate.setFullYear(alarmDate.getFullYear() + 1);
        }

        alarmDate.setMonth(contact.bday.getMonth());
        alarmDate.setDate(contact.bday.getDate());
        alarmDate.setHours(alarmTime[0]);
        alarmDate.setMinutes(alarmTime[1]);
        alarmDate.setSeconds(0);
        alarmDate.setMilliseconds(0);

        var alarmRequest = navigator.mozAlarms.add(alarmDate, "ignoreTimezone", contact);

        alarmRequest.onsuccess = function () {
            var day = document.querySelector('.bday_list li[data-cid="' + contact.id + '"]');
            if (!!day) {
                day.dataset.aid = this.result;
            }
        };
    }

    /**
     * Notify a contact birthday
     * @param  {Object} contact
     */
    function notifyContactBirthday(contact) {
        var notification = new Notification(navigator.mozL10n.get('app_title'), {
            body: contact.name + ' (' + bdayAge(contact) + ')',
            icon: '/img/icons/icon-128.png'
        });

        notification.onclick = function () {
            openContact(contact.id);
            notification.close();
        };
    }

    /**
     * Loop through the contact list, add the contacts to the document, and add alarms and
     * notifications
     * @param  {Array} bdayContacts
     */
    function processContacts(bdayContacts) {
        bdayContacts.sort(bdaySort);

        var today = new Date();

        bdayContacts.forEach(function (contact) {
            // Display
            var bday_list = document.getElementById('bday_list_m' + contact.bday.getMonth());
            var li = document.createElement('li');
            li.dataset.cid = contact.id;
            li.innerHTML = (
                "<p>" +
                "<strong class='day'>" + contact.bday.getDate() + "</strong>" + " " +
                "<span class='name'>" + contact.name + "</span>" + " " +
                "<em class='age'>(" + bdayAge(contact) + ")</em>" +
                "</p>"
            );
            bday_list.appendChild(li);

            // Notifications
            if (
                contact.bday.getMonth() === today.getMonth()
                && contact.bday.getDate() === today.getDate()
            ) {
                notifyContactBirthday(contact);
            }

            // Alarms
            addAlarm(contact);
        });
    }

    /**
     * Remove the contacts from the document
     */
    function removeContacts() {
        var contacts = document.querySelectorAll('.bday_list li');

        var i;
        for (i = 0; i < contacts.length; i += 1) {
            // Remove the alarm
            navigator.mozAlarms.remove(contacts[i].dataset.aid);

            // Remove the contact from the document
            contacts[i].parentElement.removeChild(contacts[i]);
        }
    }

    /**
     * Highlight the current month and day
     */
    function highlightCurrentDate() {
        var today = new Date();
        var bday_list = document.getElementById('bday_list_m' + today.getMonth());
        var days = bday_list.getElementsByClassName('day');

        // Current month
        bday_list.classList.add('current-month');
        document.getElementById('head_m' + today.getMonth()).classList.add('current-month');

        // Current day
        var i;
        for (i = 0; i < days.length; i += 1) {
            // Check the day
            if (days[i].textContent === today.getDate()) {
                days[i].classList.add('current-day');
            }
        }
    }

    /**
     * Remove the month and day highlights
     */
    function removeHighlight() {
        var current_months = document.querySelectorAll('.current-month');

        var i;
        for (i = 0; i < current_months.length; i += 1) {
            current_months[i].classList.remove('current-month');
        }
    }

    /**
     * Fetch the contacts and filter them
     * @return {[type]} [description]
     */
    function fetchContacts() {
        var allContacts = navigator.mozContacts.getAll();
        var bdayContacts = [];

        allContacts.onsuccess = function (event) {
            var cursor = event.target;

            if (cursor.result) {
                var contact = cursor.result;

                if (contact.bday) {
                    bdayContacts.push({
                        name: contact.name[0],
                        bday: contact.bday,
                        id: contact.id
                    });
                }

                cursor.continue();
            } else {
                processContacts(bdayContacts);
                highlightCurrentDate();
            }
        };

        allContacts.onerror = function () {
            console.log('Could not browse contacts. Loading fake contacts');
            bdayContacts = [{
                name: 'Alphonse',
                bday: new Date(1950, 1, 3)
            }, {
                name: 'Jules',
                bday: new Date(1980, 1, 3)
            }, {
                name: 'Sophie',
                bday: new Date(1990, 1, 13)
            }];

            processContacts(bdayContacts);
        };
    }

    /**
     * Reload the app data
     */
    function reloadAll() {
        removeHighlight();
        removeContacts();
        fetchContacts();
    }

    /* Event handlers */

    /**
     * Event handler for a click on the reload button
     * @param  {Event} evt
     */
    function reloadClickHandler(evt) {
        reloadAll();
        evt.preventDefault();
    }

    /**
     * Event handler for a click on the contact list
     * @param  {Event} evt
     */
    function contactClickHandler(evt) {
        var target = evt.target;

        // get the contact ID
        var cid;
        if (target && target.dataset && target.dataset.cid) {
            cid = target.dataset.cid;
            console.log(cid);
            openContact(cid);
        }

        evt.preventDefault();
    }

    /**
     * Main function: listen to events and reload the contact list
     */
    function start() {
        // listen to the click event on the reload button
        document.getElementById('button-reload').addEventListener('click', reloadClickHandler);

        // listen to the click event on the contact list
        document.getElementById('bday_lists').addEventListener('click', contactClickHandler);

        // update the contact list
        fetchContacts();
    }

    /* Event listeners */

    // Launch the code once the document has been loaded and parsed
    window.addEventListener('DOMContentLoaded', function () {
        // We want to wait until the localisations library has loaded all the strings.
        // So we'll tell it to let us know once it's ready.
        navigator.mozL10n.once(start);
    });

    /* Activities */

    if (navigator.mozSetMessageHandler) {
        navigator.mozSetMessageHandler("alarm", function (alarm) {
            if (alarm.data.id) {
                notifyContactBirthday(alarm.data);
            }
        });
    }
}());
