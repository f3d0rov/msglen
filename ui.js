
class MessageProbabilityEntry {
	constructor (prev = null, name = "x", focus = true, suggestVal = 0, nextCallback, deleteCallback, checkMessages) {
		this.prev = prev;
		this.next = null;
		if (prev != null) {
			this.next = prev.next;
			prev.next = this;
		}
		
		if (this.prev == null)
			this.index = 1;
		else
			this.index = this.prev.index + 1;

		this.template = document.getElementById ('prob_template');
		
		this.nextCallback = nextCallback;
		this.deleteCallback = deleteCallback;
		this.checkMessagesCallback = checkMessages;

		this.createSelf (name, focus, suggestVal);
	}

	createSelf (name, focus, suggestVal) {
		this.elem = this.template.cloneNode (true);
		this.elem.classList.remove ('template');
		this.elem.id = "";

		this.nameElem = this.elem.querySelector (".prob_var");
		this.indexElem = this.elem.querySelector (".prob_index");
		this.inputElem = this.elem.querySelector (".prob_input");
		this.removeButton = this.elem.querySelector (".remove_prob_button");

		this.nameElem.innerHTML = name;
		this.indexElem.innerHTML = this.index;
		this.inputElem.addEventListener ('input', (ev) => {this.checkInput();});
		this.inputElem.addEventListener ('keydown', (ev) => { if (ev.key == "Enter") this.switchToNext();});
		// Delete self if 0
		this.inputElem.addEventListener ('blur', (ev) => { this.onBlur(); } );
		if (suggestVal.equals (new Decimal (0))) {
			this.inputElem.value = "0.0";
		} else {
			this.inputElem.value = suggestVal;
		}
		this.removeButton.addEventListener ('click', () => {this.deleteSelf();});
		
		if (this.prev == null) {
			this.template.parentElement.insertBefore (this.elem, this.template);
		} else {
			this.prev.elem.parentElement.insertBefore (this.elem, this.prev.elem.nextSibling);
		}
		
		if (focus)
			this.focus();
	}

	focus () {
		this.inputElem.focus();
		if (this.inputElem.value.startsWith ("0."))
			this.inputElem.setSelectionRange (2, 30000);
		else
			this.inputElem.select();	
	}

	onBlur () {
		if (this.valueIsValid() && this.value().equals(new Decimal (0))) {
			this.deleteSelf(); // Remove self if 0
			return;
		}
		
		if (this.inputElem.value.trim() == "") {
			this.deleteSelf(); // Remove self if empty
			return;
		}
		
		this.checkMessagesCallback ();
	}

	deleteSelf () {
		if (this.next != null) {
			this.next.prev = this.prev;
			this.next.setIndex (this.index);
		}

		if (this.prev != null) {
			this.prev.next = this.next;
		}

		this.elem.remove();

		if (this.next == null) {
			this.deleteCallback (this.prev);
		}

		this.checkMessagesCallback();
	}

	setIndex (index) {
		this.index = index;
		this.indexElem.innerHTML = this.index;
		this.next?.setIndex (index + 1);
	}

	checkInput () {
		if (this.valueIsValid()) {
			this.inputElem.classList.remove ("bad");
		} else {
			this.inputElem.classList.add ("bad");
		}
		this.checkMessagesCallback();
	}

	switchToNext () {
		if (this.next != null) {
			this.next.focus();
		} else {
			this.nextCallback ();
		}
	}

	value () {
		try {
			return new Decimal (this.inputElem.value);
		} catch {
			return new Decimal (0);
		}
	}

	valueIsValid () {
		let x;
		try {
			x = new Decimal (this.inputElem.value);
		} catch {
			return false; // Can't convert
		}

		// Return false if outside of [0, 1] interval
		if (x.lessThan (new Decimal (0)) || x.greaterThan (new Decimal (1))) {
			return false;
		} else {
			// All good
			return true;
		}
	}

	prevTotal () {
		if (this.prev) {
			return this.value().add (this.prev.prevTotal());
		}
		return this.value();
	}

	getPrevMistake () {
		if (this.valueIsValid()) {
			if (this.prev) {
				return this.prev.getPrevMistake();
			} else {
				return null;
			}
		} else {
			let thisVal;
			try {
				thisVal = new Decimal (this.inputElem.value);
			} catch {
				return { error: "Некорректное значение", obj: this };
			}

			if (thisVal.lessThan (new Decimal (0))) {
				return { error: "Отрицательное значение", obj: this };
			}

			if (thisVal.greaterThan (new Decimal (1))) {
				return { error: "Значение > 1", obj: this };
			}
			
			return { error: "Ошибка", obj: this}; // Hopefully never occurs
		}
	}
}

class Messages {
	constructor () {
		this.addMessageButton = document.getElementById ("add_prob_button");
		this.addMessageButton.addEventListener ('click', () => { this.addMessage(); });

		this.errorMessage = document.getElementById ('error_msg');
		this.errorMessageText = document.getElementById ("error_msg_text");
		this.errorMessage.addEventListener ('click', () => { this.focusErrorSource(); });
		this.errorSource = null;

		this.lastMessage = null;
	}
	
	addMessage (focus = true) {
		let suggestVal = new Decimal (0);

		if (this.lastMessage != null) {
			let currentTotal = this.lastMessage.prevTotal();
			console.log (`Total: ${currentTotal}`)
			// If current total in (0, 1)
			if (currentTotal.lessThan (new Decimal (1)) && currentTotal.greaterThan (new Decimal (0)))
				suggestVal = new Decimal (1).minus (currentTotal); 
		}

		let newMessage = new MessageProbabilityEntry (
			this.lastMessage,
			"x",
			focus,
			suggestVal,
			() => { this.addMessage();},
			(last) => { this.setNewRoot(last);},
			() => { this.checkMessages(); }
		);
		this.lastMessage = newMessage;

		this.checkMessages();
	}

	setNewRoot (root) {
		this.lastMessage = root;
	}

	checkMessages () {
		let lastMistake = this.lastMessage.getPrevMistake();
		if (lastMistake != null) {
			this.setMistake (lastMistake);
			return false;
		} else {
			let total = this.lastMessage.prevTotal ();

			if (total.greaterThan (new Decimal (1))) {
				this.setMistake ({ error: "Общ. вероятность > 1", obj: null });
				return false;

			} else if (total.lessThan (new Decimal (1))) {
				this.setMistake ({ error: "Общ. вероятность < 1", obj: null });
				return false;
			}

			this.resetMistake ();
			return true;
		}
	}

	setMistake (mistake) {
		this.errorSource = mistake.obj;
		this.errorMessageText.innerHTML = mistake.error;
		this.errorMessage.classList.remove ("template");
	}

	resetMistake () {
		this.errorSource = null;
		this.errorMessage.classList.add ("template");
	}

	focusErrorSource () {
		if (this.errorSource != null) this.errorSource.focus();
	}
}

class AlgoUI {
	constructor () {
		this.messages = new Messages;
	}
}

function setupUI () {
	var algoUI = new AlgoUI;
}

window.addEventListener (
	'load',
	setupUI
);
