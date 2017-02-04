"use strict";

class Storage {
	constructor() {
		this.notes = JSON.parse(localStorage.getItem('notes')) || {};
	}
	
	save(title, content) {
		if (!this.notes.hasOwnProperty(title)) {
			this.notes[title] = content;
			localStorage.setItem('notes', JSON.stringify(this.notes));
		}
		// else - show that the title is already existing
	}

	change(oldTitle, newTitle, newContent) {
		console.log(oldTitle, newTitle, newContent)
		if (oldTitle !== newTitle) {
			this.remove(oldTitle);
			this.save(newTitle, newContent);
		} else {
			this.notes[oldTitle] = newContent;
			localStorage.setItem('notes', JSON.stringify(this.notes));
		}
	}

	remove(title) {
		delete this.notes[title];
		localStorage.setItem('notes', JSON.stringify(this.notes));
	}

	filter(key) {
		let filtered = {};
		for (let title in this.notes) {
			if(~(title.toLowerCase()
					.indexOf(key.toLowerCase())
					)) {
				filtered[title] = this.notes[title];
			}
		}
		return filtered;
	}

	reload() {
		this.notes = JSON.parse(localStorage.getItem('notes')) || {};
	}
}



class Controller {
	constructor(elem) {
		this.storage = new Storage();
		this.view = new AppView(elem);
	}

	init() {
		this.showNotes(this.storage.notes);
		this.bindEvents();
	}

	showNotes(notes) {
		for (let title in notes) {
			if (notes.hasOwnProperty(title)) {
				this.view.appendNote(title, notes[title]);
			}
		}
	}
	
	addNote(title, content) {
		if (!this.storage.notes.hasOwnProperty(title)) {
			this.storage.save(title, content);
			this.view.appendNote(title, content);
		}
	}

	removeNote(title) {
		this.storage.remove(title);
		this.view.removeNote(title);
	}

	changeNote(oldTitle, newTitle, newContent) {
		this.storage.change(oldTitle, newTitle, newContent);
		this.view.changeNote(oldTitle, newTitle, newContent);
	}

	filterNotes(key) {
		this.view.removeAll();
		this.showNotes(this.storage.filter(key));
	}

	bindEvents() {
		let view = this.view,
			addNote = this.addNote.bind(this),
			changeNote = this.changeNote.bind(this),
			filterNotes = this.filterNotes.bind(this),
			removeNote = this.removeNote.bind(this),
			showNotes = this.showNotes.bind(this),
			self = this;

		view.noteForm.addEventListener('submit', function(e) {
			let title = this.elements.title.value,
				content = this.elements.content.value,
				oldTitle;

			switch (this.elements.submitBtn.value) {
				case 'save':
					title = this.elements.title.value,
					content = this.elements.content.value;

					addNote(title, content);

				break;
				case 'change':
					oldTitle = this.elements.submitBtn.getAttribute('data-oldTitle');
					
					changeNote(oldTitle, title, content);
			}
			
			title = content = '';
			view.toggleModal();
			e.preventDefault();
			if (view.filterInput.value.length !== 0) {
				var e = new Event('input');
				view.filterInput.value = '';
				view.filterInput.dispatchEvent(e);
			}
			
		});

		view.filterInput.addEventListener('input', function() {
			filterNotes(this.value);
			view.showFilter(this.value);

			//для отображения в других вкладках
			localStorage.setItem('filter', this.value);
		});

		view.rootElem.addEventListener('noteEvent', function(e) {
			if (e.detail.type === 'delete') {
				removeNote(e.detail.title);
			} else if (e.detail.type === 'change') {
				view.toggleModal();
				// автозаполнение элементов формы
				let formElems = view.noteForm.elements;
				for (let elem in e.detail) {
					if (formElems[elem]) {
						formElems[elem].value = e.detail[elem]
					}
					formElems.submitBtn.value = e.detail.type;
					//сохраняю старый заголовок для его использования в обработчике submit
					formElems.submitBtn.setAttribute('data-oldTitle', formElems.title.value)
				}
			}
		});

		view.createNoteBtn.addEventListener('click', (e) => {
			let formElems = view.noteForm.elements;
			view.toggleModal();

			formElems.title.value = formElems.content.value = '';
			formElems.submitBtn.value = 'save';
			e.preventDefault();
		});

		view.modal.addEventListener('click', (e) => {
			if (e.target.className !== view.modal.className) return;
			view.toggleModal();
		});

		window.addEventListener('storage', (e) => { 
			switch (e.key) {
				case 'notes':
					self.view.removeAll();
					self.storage.reload();
					showNotes(self.storage.notes);
				break;
				case 'filter':
					filterNotes(e.newValue);
					view.filterInput.value = e.newValue;
					view.showFilter(e.newValue);
			} 
		});
	}
}




class AppView {
	constructor(rootElem) {
		this.rootElem = rootElem;
		this.notesBlock = rootElem.querySelector('.notes');
		this.notes = [];

		this.createNoteBtn = this.rootElem.querySelector('#create');
		this.modal = this.rootElem.querySelector('.modal');
		this.noteForm = this.rootElem.querySelector('form');
		this.filterInput = this.rootElem.querySelector('#filter');

	}

	appendNote(title, content) {
		let note = new Note(title, content);
		this.notes.push(note);
		let noteElement = note.createHTMLElement()
		this.notesBlock.appendChild(noteElement);
		noteElement.addEventListener('click', note.eventHandler.bind(note, this.rootElem));
	}

	changeNote(oldTitle, newTitle, newContent) {
		let noteToChange = this.notes.filter((note) => note.title === oldTitle)[0];
		if (noteToChange !== undefined) {
			noteToChange.changeNoteData(newTitle, newContent);
		}
	}

	removeNote(title) {
		let noteToRemove = this.notes.filter((note) => note.title === title)[0];
		if (noteToRemove !== undefined) {
			this.notes = this.notes.filter((note) => note.title !== title);
			this.notesBlock.removeChild(noteToRemove._note);	
		}
	}

	removeAll() {
		this.notesBlock.innerHTML = '';
		this.notes = [];
	}

	showFilter(value) {
		if (value.length == 0) return;
		let messsage = document.createElement('p'),
			keyword = document.createElement('span');
		messsage.textContent = 'Notes filtered by ';
		keyword.textContent = value;
		messsage.classList.add('notes__filter-message');
		messsage.appendChild(keyword);
		this.notesBlock.appendChild(messsage);
	}
	toggleModal() {
		let modal = this.modal;
		if (modal.classList.contains('open')) {
			modal.classList.remove('open');
			setTimeout(()=>modal.classList.add('close'), 200)
		} else {
			modal.classList.remove('close');
			setTimeout(()=>modal.classList.add('open'), 20)
		} 
		
	}

	
}


class Note {
	constructor(title, content) {
		this.title = title;
		this.content = content;
	}

	createHTMLElement() {
		let note = this._note = document.createElement('div'),
			noteTitle = this._noteTitle = document.createElement('h4'),
			noteContent = this._noteContent = document.createElement('p'),
			noteDeleteBtn = document.createElement('span'),
			noteChangeBtn = document.createElement('span');

		note.classList.add('note');

		noteTitle.classList.add('note__title');
		noteTitle.textContent = this.title;

		noteContent.classList.add('note__content');
		noteContent.textContent = this.content;

		noteDeleteBtn.classList.add('icon-cancel');
		noteDeleteBtn.setAttribute('data-action', 'delete');

		noteChangeBtn.classList.add('icon-cog-alt');
		noteChangeBtn.setAttribute('data-action', 'change');

		note.appendChild(noteTitle);
		note.appendChild(noteContent);
		note.appendChild(noteDeleteBtn);
		note.appendChild(noteChangeBtn);
		return note;
	}

	changeNoteData(newTitle, newContent) {
		this.title = newTitle;
		this.content = newContent;

		this._noteTitle.textContent = this.title;
		this._noteContent.textContent = this.content;
	}
	
	eventHandler(targetElem, e) {
		let target = e.target;
	
		if (!target.hasAttribute('data-action')) return;
		let event;
		switch (target.getAttribute('data-action')) {

			case 'delete':
				event = new CustomEvent('noteEvent', {
    				detail: { type: 'delete',
    						  title: this.title }
  				});
  				targetElem.dispatchEvent(event);
  			break;

  			case 'change':
  				event = new CustomEvent('noteEvent', {
    				detail: { type: 'change',
    						  title: this.title,
    						  content: this.content }
  				});
  				targetElem.dispatchEvent(event);
  			break;
		}													
	}
}













