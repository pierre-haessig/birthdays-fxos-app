/*global window, document, navigator, MozActivity, Notification, OptionMenu*/

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
     * Fetch contact according to its ID
     * @param  {String} cid
     * @return {Promise}
     */
    function getContactFromId(cid) {
        var contactPromise = new Promise(function (resolve, reject) {
            var contactRequest = window.navigator.mozContacts.find({
                filterBy: ['id'],
                filterValue: cid,
                filterOp: 'equals',
                filterLimit: 1
            });

            contactRequest.onsuccess = function () {
                resolve(this.result[0]);
            };

            contactRequest.onerror = function () {
                reject(cid);
            };
        });

        return contactPromise;
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
    }

    /**
     * Add an alarm for a contact birthday
     * @param {Object} contact
     * @return {Promise}
     */
    function addAlarm(contact) {
        var alarmDate = new Date();

        if (
            contact.bday.getMonth() <= alarmDate.getMonth()
            && contact.bday.getDate() <= alarmDate.getDate()
        ) {
            alarmDate.setFullYear(alarmDate.getFullYear() + 1);
        }

        alarmDate.setMonth(contact.bday.getMonth());
        alarmDate.setDate(contact.bday.getDate());
        alarmDate.setHours(alarmTime[0]);
        alarmDate.setMinutes(alarmTime[1]);
        alarmDate.setSeconds(0);
        alarmDate.setMilliseconds(0);

        var alarmPromise = new Promise(function (resolve, reject) {
            var alarmRequest = navigator.mozAlarms.add(alarmDate, 'ignoreTimezone', contact);

            alarmRequest.onsuccess = function () {
                resolve({
                    aid: this.result,
                    cid: contact.id
                });
            };

            alarmRequest.onerror = function () {
                reject({
                    aid: this.result,
                    cid: contact.id
                });
            };
        });

        return alarmPromise;
    }

    /**
     * Remove the alarm of a contact birthday
     * @param  {Object} contact
     * @param  {Number} aid
     * @return {Promise}
     */
    function removeAlarm(contact, aid) {
        var alarmPromise = new Promise(function (resolve) {
            navigator.mozAlarms.remove(aid);

            resolve({
                cid: contact.id
            });
        });

        return alarmPromise;
    }

    /**
     * Add or remove an alarm for a contact
     * @param  {String} cid
     * @param  {Number} aid
     */
    function toggleAlarm(cid, aid) {
        getContactFromId(cid).then(function (contact) {
            if (!!aid) {
                removeAlarm(contact, aid).then(disableAlarmButton);
            } else {
                addAlarm(contact).then(enableAlarmButton);
            }
        });
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
                '<aside class="pack-end">' +
                    '<button class="btn-alarm inactive" data-aid=""' +
                        'title="' + navigator.mozL10n.get('btn_alarm_toggle') + '"' +
                    '>' +
                        navigator.mozL10n.get('alarm_off') +
                    '</button>' +
                '</aside>' +
                '<p>' +
                    '<strong class="day">' + contact.bday.getDate() + '</strong>' + ' ' +
                    '<span class="name">' + contact.name + '</span>' + ' ' +
                    '<em class="age">(' + bdayAge(contact) + ')</em>' +
                '</p>'
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
            addAlarm(contact).then(enableAlarmButton);
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

    function enableAlarmButton(value) {
        var btn = document.querySelector('li[data-cid="' + value.cid + '"] button.btn-alarm');
        btn.classList.remove('inactive');
        btn.dataset.aid = value.aid;
        btn.dataset.cid = value.cid;
        btn.textContent = navigator.mozL10n.get('alarm_on');
    }

    function disableAlarmButton(value) {
        var btn = document.querySelector('li[data-cid="' + value.cid + '"] button.btn-alarm');
        btn.classList.add('inactive');
        btn.dataset.aid = '';
        btn.dataset.cid = value.cid;
        btn.textContent = navigator.mozL10n.get('alarm_off');
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
            window.alert('Contacts permission is required for reading birthdays');
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

        if (!!target && !!target.dataset && (!!target.dataset.aid || target.dataset.aid === '')) {
            // If there is an alaram ID, even empty, toggle the alarm
            toggleAlarm(target.dataset.cid, target.dataset.aid);
        } else if (!!target && !!target.dataset && !!target.dataset.cid) {
            // If there is a contact ID, open it
            openContact(target.dataset.cid);
        }
    }

    /**
     * Event handler for a click on the option button
     * @param  {Event} evt
     */
    function optionsClickHandler(evt) {
        var options = {
            header: {
                l10nId: 'app_title'
            },
            items: [{
                l10nId: 'btn_reload',
                method: reloadAll
            }, {
                l10nId: 'btn_cancel'
            }]
        };

        new OptionMenu(options).show();
    }

    /**
     * Main function: listen to events and reload the contact list
     */
    function start() {
        // listen to the click event on the options button
        document.getElementById('button-options').addEventListener('click', optionsClickHandler);

        // listen to the click event on the reload button
        // document.getElementById('button-reload').addEventListener('click', reloadClickHandler);

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
        navigator.mozSetMessageHandler('alarm', function (alarm) {
            if (alarm.data.id) {
                notifyContactBirthday(alarm.data);
            }
        });
    }
}());
