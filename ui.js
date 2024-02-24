
class MessageProbabilityEntry {
	constructor (prev = null, name = "x", focus = true, suggestVal = 0, nextCallback, deleteCallback) {
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
		this.inputElem.value = suggestVal;
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
		this.inputElem.setSelectionRange (2, 3000);
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
	}

	setIndex (index) {
		this.index = index;
		this.indexElem.innerHTML = this.index;
		this.next?.setIndex (index + 1);
	}

	checkInput () {

	}

	switchToNext () {
		if (this.next != null) {
			this.next.focus();
		} else {
			this.nextCallback ();
		}
	}

	value () {
		return parseFloat(this.inputElem.value);
	}

	prevTotal () {
		if (this.prev) {
			return this.value() + this.prev.prevTotal();
		}
		return this.value();
	}
}

class Messages {
	constructor () {
		this.addMessageButton = document.getElementById ("add_prob_button");
		this.addMessageButton.addEventListener ('click', () => { this.addMessage(); });
		this.lastMessage = null;
	}
	
	addMessage (focus = true) {
		let suggestVal = "0.0";

		if (this.lastMessage != null) {
			let currentTotal = this.lastMessage.prevTotal();
			console.log (`Total: ${currentTotal}`)
			if (currentTotal < 1 && currentTotal > 0) suggestVal = 1 - currentTotal; 
		}

		let newMessage = new MessageProbabilityEntry (
			this.lastMessage,
			"x",
			focus,
			suggestVal,
			() => { this.addMessage();},
			(last) => { this.setNewRoot(last);}
		);
		this.lastMessage = newMessage;
	}

	setNewRoot (root) {
		this.lastMessage = root;
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
